import { SerialBinaryDecoder } from "./serial-binary";

declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<SerialPort>;
    };
  }
  interface Window {
    TextDecoderStream: typeof TextDecoderStream;
    TextEncoderStream: typeof TextEncoderStream;
  }
}

// Minimal SerialPort type for TS
export interface SerialPort {
  open(options: SerialPortOpenOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
}

export interface SerialPortOpenOptions {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  flowControl: string;
}

export type MessageType = "received" | "sent" | "status" | "error";
export type MessageObj = { message: string; type: MessageType };

export class WebSerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private readLoopActive = false;
  private readPipePromise: Promise<void> | null = null;
  private writePipePromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;

  private textBuffer = "";
  private connectionEpoch = 0;
  private disconnectPromise: Promise<void> | null = null;
  private queryQueue: Promise<unknown> = Promise.resolve();
  private messageObservers = new Set<(message: string, type: MessageType) => void>();
  private pendingQueries = new Set<() => void>();
  private binaryDecoder: SerialBinaryDecoder | null = null;

  private onMessageCallback: (message: string, type: MessageType) => void;

  constructor(onMessage: (message: string, type: MessageType) => void) {
    this.onMessageCallback = onMessage;
  }

  private emit(message: string, type: MessageType): void {
    this.onMessageCallback(message, type);
    for (const observer of this.messageObservers) observer(message, type);
  }

  private receiveText(text: string): void {
    this.textBuffer += text;
    let newline: number;
    while ((newline = this.textBuffer.indexOf("\n")) !== -1) {
      const line = this.textBuffer.slice(0, newline);
      this.textBuffer = this.textBuffer.slice(newline + 1);
      if (line.trim()) this.emit(line, "received");
    }
  }

  /**
   * Connect using an already-selected SerialPort (e.g. provided by esp-web-tools UI).
   * This mirrors the behaviour of connect(), but skips navigator.serial.requestPort().
   */
  async connectWithExistingPort(port: SerialPort): Promise<void> {
    await this.disconnectPromise;
    if (this.port) throw new Error("Already connected to device");
    try {
      if (!port) {
        throw new Error("No serial port provided");
      }
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
      this.port = port;
      this.connectionEpoch++;
      this.textBuffer = "";
      this.setupCommunication();
      this.emit("Connected", "status");
      void this.readLoop();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit("Connection error: " + errorMessage, "error");
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Expose the underlying SerialPort (if any) for advanced integrations.
   */
  getPort(): SerialPort | null {
    return this.port;
  }

  isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && "serial" in navigator;
  }

  isConnected(): boolean {
    return this.port !== null;
  }

  async connect(): Promise<void> {
    await this.disconnectPromise;
    if (this.port) throw new Error("Already connected to device");
    try {
      if (!navigator.serial) {
        throw new Error("Web Serial API not supported");
      }
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
      this.port = port;
      this.connectionEpoch++;
      this.textBuffer = "";
      this.setupCommunication();
      this.emit("Connected", "status");
      void this.readLoop();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit("Connection error: " + errorMessage, "error");
      await this.disconnect();
      throw error;
    }
  }

  private setupCommunication(): void {
    if (!this.port) return;
    this.abortController = new AbortController();

    const textDecoder = new window.TextDecoderStream();
    this.readPipePromise = (this.port.readable as ReadableStream).pipeTo(
      textDecoder.writable,
      { signal: this.abortController.signal }
    );
    void this.readPipePromise.catch(() => { /* Reported by the reader / disconnect. */ });
    this.reader = textDecoder.readable.getReader();

    const textEncoder = new window.TextEncoderStream();
    this.writer = textEncoder.writable.getWriter();
    this.writePipePromise = (textEncoder.readable as ReadableStream).pipeTo(
      this.port.writable,
      { signal: this.abortController.signal }
    );
    const epoch = this.connectionEpoch;
    void this.writePipePromise.catch((error) => {
      // TextEncoderStream can accept a write before the physical sink rejects it.
      if (!this.port || epoch !== this.connectionEpoch) return;
      this.emit("Write error: " + (error instanceof Error ? error.message : String(error)), "error");
      void this.disconnect();
    });
  }

  private async readLoop(): Promise<void> {
    this.readLoopActive = true;
    const reader = this.reader;
    const epoch = this.connectionEpoch;
    try {
      while (this.port && this.readLoopActive && reader) {
        const { value, done } = await reader.read();
        if (done || epoch !== this.connectionEpoch || !this.readLoopActive) break;
        if (value) {
          if (this.binaryDecoder) this.binaryDecoder.push(value);
          else this.receiveText(value);
        }
      }
    } catch (error: unknown) {
      if (this.readLoopActive && epoch === this.connectionEpoch) {
        this.emit("Read error: " + (error instanceof Error ? error.message : String(error)), "error");
      }
    } finally {
      if (epoch === this.connectionEpoch && this.port) {
        void this.disconnect().catch(() => { /* Disconnect emits its error. */ });
      }
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!message.trim()) return;
    if (!this.writer || !this.port) throw new Error("Not connected to device");
    try {
      await this.writer.write(message + "\n");
      this.emit("Sent: " + message, "sent");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit("Send error: " + errorMessage, "error");
      throw error;
    }
  }

  /**
   * Sends a message and waits for a response that matches the pattern ::val::...::val::
   * @param message The message to send
   * @param timeoutMs Timeout in milliseconds (default: 5000)
   * @returns The value between ::val:: markers or null if timeout or no match
   */
  sendAndReceive(
    message: string,
    timeoutMs: number = 5000,
    options: { signal?: AbortSignal; exactResponse?: boolean } = {},
  ): Promise<string | null> {
    const epoch = this.connectionEpoch;
    // The wire has no request IDs. Never let simultaneous value queries steal replies.
    const result = this.queryQueue.then(() => this.queryValue(message, timeoutMs, options, epoch));
    this.queryQueue = result.catch(() => null);
    return result;
  }

  private async queryValue(
    message: string,
    timeoutMs: number,
    options: { signal?: AbortSignal; exactResponse?: boolean },
    epoch: number,
  ): Promise<string | null> {
    if (!message.trim() || !this.writer || !this.port || epoch !== this.connectionEpoch || options.signal?.aborted) return null;
    let responseBuffer = "";
    let resolveResponse: (value: string | null) => void = () => {};
    const response = new Promise<string | null>((resolve) => { resolveResponse = resolve; });
    const cancel = () => resolveResponse(null);
    const observer = (data: string, type: MessageType) => {
      if (type !== "received") return;
      responseBuffer = (responseBuffer + data).slice(-8192);
      const match = options.exactResponse
        ? data.match(/^::val::([^\r\n]*?)::val::\r?$/)
        : responseBuffer.match(/::val::(.*?)::val::/);
      if (match) resolveResponse(match[1]);
      else if (options.exactResponse) resolveResponse(null);
    };
    this.messageObservers.add(observer);
    this.pendingQueries.add(cancel);
    options.signal?.addEventListener("abort", cancel, { once: true });
    const timeout = setTimeout(() => {
      this.emit("Response timeout for: " + message, "error");
      cancel();
    }, timeoutMs);
    try {
      await this.writer.write(message + "\n");
      this.emit("Sent: " + message, "sent");
      return await response;
    } catch (error: unknown) {
      this.emit("Send error: " + (error instanceof Error ? error.message : String(error)), "error");
      return null;
    } finally {
      clearTimeout(timeout);
      this.messageObservers.delete(observer);
      this.pendingQueries.delete(cancel);
      options.signal?.removeEventListener("abort", cancel);
    }
  }

  /** Listen for streamed base64 envelopes without replacing normal message/query callbacks. */
  listenForBinary(callback: (data: Uint8Array) => void): () => void {
    if (!this.port) throw new Error("Not connected to device");
    if (this.binaryDecoder) throw new Error("A binary listener is already active");
    const decoder = new SerialBinaryDecoder(
      callback,
      (text) => this.receiveText(text),
      (message) => this.emit(message, "error"),
    );
    this.binaryDecoder = decoder;
    return () => {
      // Idempotent; an old cleanup must not detach a newer listener.
      if (this.binaryDecoder !== decoder) return;
      this.binaryDecoder = null;
      decoder.stop();
    };
  }

  // Helper function to convert binary data to base64
  private encodeBinaryBase64(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  // CRC32 implementation (same polynomial as firmware)
  private crc32(buf: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (~crc) >>> 0;
  }

  // Validate WAV file format (44.1kHz, 16-bit, mono, PCM)
  private async validateWavFile(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      // Read the first 44 bytes (standard WAV header size)
      const headerBuffer = await file.slice(0, 44).arrayBuffer();
      const header = new Uint8Array(headerBuffer);

      // Check if file is large enough to contain a WAV header
      if (header.length < 44) {
        return { valid: false, error: "File too small to be a valid WAV file" };
      }

      // Check RIFF header (bytes 0-3)
      const riffHeader = String.fromCharCode(header[0], header[1], header[2], header[3]);
      if (riffHeader !== "RIFF") {
        return { valid: false, error: "Not a valid WAV file (missing RIFF header)" };
      }

      // Check WAVE format (bytes 8-11)
      const waveFormat = String.fromCharCode(header[8], header[9], header[10], header[11]);
      if (waveFormat !== "WAVE") {
        return { valid: false, error: "Not a valid WAV file (missing WAVE format)" };
      }

      // Check fmt chunk (bytes 12-15)
      const fmtChunk = String.fromCharCode(header[12], header[13], header[14], header[15]);
      if (fmtChunk !== "fmt ") {
        return { valid: false, error: "Invalid WAV file (missing fmt chunk)" };
      }

      // Check audio format (bytes 20-21) - should be 1 for PCM
      const audioFormat = header[20] | (header[21] << 8);
      if (audioFormat !== 1) {
        return { valid: false, error: "Only PCM format is supported (found format: " + audioFormat + ")" };
      }

      // Check number of channels (bytes 22-23) - should be 1 for mono
      const numChannels = header[22] | (header[23] << 8);
      if (numChannels !== 1) {
        return { valid: false, error: "Only mono audio is supported (found " + numChannels + " channels)" };
      }

      // Check sample rate (bytes 24-27) - should be 44100
      const sampleRate = header[24] | (header[25] << 8) | (header[26] << 16) | (header[27] << 24);
      if (sampleRate !== 44100) {
        return { valid: false, error: "Only 44.1kHz sample rate is supported (found " + sampleRate + " Hz)" };
      }

      // Check bits per sample (bytes 34-35) - should be 16
      const bitsPerSample = header[34] | (header[35] << 8);
      if (bitsPerSample !== 16) {
        return { valid: false, error: "Only 16-bit audio is supported (found " + bitsPerSample + " bits)" };
      }

      return { valid: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { valid: false, error: "Error reading WAV file: " + errorMessage };
    }
  }

  async sendSampleFile(sampleId: number, sampleFile: File): Promise<void> {
    if (!this.port || !this.writer) {
      throw new Error("Not connected to device");
    }

    try {
      // Validate WAV file format
      const validationResult = await this.validateWavFile(sampleFile);
      if (!validationResult.valid) {
        // this.emit(validationResult.error || "Unknown error", "error");
        throw new Error(validationResult.error || "Unknown error");
      }

      // Convert file to binary
      const arrayBuffer = await sampleFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Calculate CRC32 and prepend (little-endian)
      const crc = this.crc32(uint8Array);
      const withCrc = new Uint8Array(uint8Array.length + 4);
      withCrc[0] = crc & 0xFF;
      withCrc[1] = (crc >> 8) & 0xFF;
      withCrc[2] = (crc >> 16) & 0xFF;
      withCrc[3] = (crc >> 24) & 0xFF;
      withCrc.set(uint8Array, 4);

      // Base64 encode
      const base64Data = this.encodeBinaryBase64(withCrc);
      const length = base64Data.length;

      // Send the write-sample-base64 command
      await this.writer.write(`write-sample-base64 ${sampleId} ${arrayBuffer.byteLength} ${length}\n`);
      this.emit(`Sent: write-sample-base64 ${sampleId} ${arrayBuffer.byteLength} ${length}`, "sent");

      // Wait for Pico to respond with 'Ready to receive ...'
      await new Promise((res) => setTimeout(res, 300));

      // Send base64 data in chunks
      const chunkSize = 1024;
      let sent = 0;
      this.emit("Sending base64 data...", "status");
      while (sent < length) {
        const end = Math.min(sent + chunkSize, length);
        const chunk = base64Data.substring(sent, end);
        await this.writer.write(chunk);
        sent = end;
        if (Math.floor((sent / length) * 10) > Math.floor(((sent - chunk.length) / length) * 10)) {
          const percent = Math.floor((sent / length) * 100);
          this.emit(`Sending: ${percent}% (${sent}/${length} chars)`, "status");
        }
        await new Promise(res => setTimeout(res, 5));
      }
      // Send end marker
      await this.writer.write("\n");
      this.emit(`Sample file sent (${arrayBuffer.byteLength} bytes as ${length} base64 chars)`, "sent");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit("Sample upload error: " + errorMessage, "error");
      throw error;
    }
  }

  disconnect(): Promise<void> {
    if (this.disconnectPromise) return this.disconnectPromise;
    if (!this.port) return Promise.resolve();
    const port = this.port;
    const reader = this.reader;
    const writer = this.writer;
    const abortController = this.abortController;
    const pipes = [this.readPipePromise, this.writePipePromise];
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.abortController = null;
    this.readLoopActive = false;
    this.connectionEpoch++;
    this.binaryDecoder?.stop();
    this.binaryDecoder = null;
    this.textBuffer = "";
    for (const cancel of this.pendingQueries) cancel();
    // Notify consumers immediately, including physical removal / readable EOF.
    this.emit("Disconnected", "status");
    this.disconnectPromise = (async () => {
      try {
        await reader?.cancel().catch(() => {});
        // Flush accepted commands (notably stop-send) before aborting the pipes.
        // Failed/removed serial sinks reject close; teardown still continues.
        await writer?.close().catch(() => {});
        abortController?.abort();
        await Promise.allSettled(pipes);
        await port.close();
      } catch (error) {
        this.emit("Disconnect error: " + (error instanceof Error ? error.message : String(error)), "error");
      } finally {
        this.readPipePromise = null;
        this.writePipePromise = null;
        this.disconnectPromise = null;
      }
    })();
    return this.disconnectPromise;
  }
}
