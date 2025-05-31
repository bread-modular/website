// Minimal SerialPort type for TS
export interface SerialPort {
  open(options: any): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<any>;
  writable: WritableStream<any>;
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

  private onMessageCallback: (message: string, type: MessageType) => void;

  constructor(onMessage: (message: string, type: MessageType) => void) {
    this.onMessageCallback = onMessage;
  }

  isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && "serial" in navigator;
  }

  isConnected(): boolean {
    return this.port !== null;
  }

  async connect(): Promise<void> {
    try {
      // @ts-ignore
      const port = await (navigator as any).serial.requestPort();
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });
      this.port = port;
      this.onMessageCallback("Connected", "status");
      this.setupCommunication();
      this.readLoop();
    } catch (error: any) {
      this.onMessageCallback("Connection error: " + (error?.message || String(error)), "error");
      throw error;
    }
  }

  private setupCommunication(): void {
    if (!this.port) return;
    this.abortController = new AbortController();

    const textDecoder = new (window as any).TextDecoderStream();
    this.readPipePromise = this.port.readable.pipeTo(
      textDecoder.writable,
      { signal: this.abortController.signal }
    );
    this.reader = textDecoder.readable.getReader();

    const textEncoder = new (window as any).TextEncoderStream();
    this.writer = textEncoder.writable.getWriter();
    this.writePipePromise = textEncoder.readable.pipeTo(
      this.port.writable,
      { signal: this.abortController.signal }
    );
  }

  private async readLoop(): Promise<void> {
    this.readLoopActive = true;
    try {
      while (this.port && this.readLoopActive) {
        if (!this.reader) break;
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) this.onMessageCallback(value, "received");
      }
    } catch (error: any) {
      this.onMessageCallback("Read error: " + (error?.message || String(error)), "error");
      if (this.port) this.disconnect();
    } finally {
      this.readLoopActive = false;
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!message.trim() || !this.writer) return;
    try {
      await this.writer.write(message + "\n");
      this.onMessageCallback("Sent: " + message, "sent");
    } catch (error: any) {
      this.onMessageCallback("Send error: " + (error?.message || String(error)), "error");
      throw error;
    }
  }

  /**
   * Sends a message and waits for a response that matches the pattern ::val::...::val::
   * @param message The message to send
   * @param timeoutMs Timeout in milliseconds (default: 5000)
   * @returns The value between ::val:: markers or null if timeout or no match
   */
  async sendAndReceive(message: string, timeoutMs: number = 5000): Promise<string | null> {
    if (!message.trim() || !this.writer || !this.port) {
      return null;
    }

    let timeoutId = 0;
    let responseBuffer = "";
    let originalCallback = this.onMessageCallback;
    
    try {
      // Create a promise that will resolve when we get a matching response or timeout
      const responsePromise = new Promise<string | null>((resolve) => {
        // Set up a temporary callback to look for the response
        this.onMessageCallback = (data, type) => {
          // Call the original callback to maintain normal message display
          originalCallback(data, type);
          
          // Process the response if it's from the device
          if (type === "received") {
            responseBuffer += data;
            
            // Check for the pattern ::val::...::val::
            const pattern = /::val::(.*?)::val::/;
            const match = responseBuffer.match(pattern);
            
            if (match) {
              // We found a match, clear the timeout and resolve
              window.clearTimeout(timeoutId);
              
              // Extract the value between ::val:: markers
              resolve(match[1]);
            }
          }
        };
        
        // Set up timeout
        timeoutId = window.setTimeout(() => {
          this.onMessageCallback("Response timeout for: " + message, "error");
          resolve(null);
        }, timeoutMs);
      });
      
      // Send the message
      await this.writer.write(message + "\n");
      this.onMessageCallback("Sent: " + message, "sent");
      
      // Wait for the response or timeout
      const result = await responsePromise;
      
      // Restore the original callback
      this.onMessageCallback = originalCallback;
      
      return result;
    } catch (error: any) {
      // Restore the original callback in case of error
      this.onMessageCallback = originalCallback;
      
      this.onMessageCallback("Send error: " + (error?.message || String(error)), "error");
      return null;
    }
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

  async sendSampleFile(sampleId: number, sampleFile: File): Promise<void> {
    if (!this.port || !this.writer) {
      throw new Error("Not connected to device");
    }

    try {
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
      this.onMessageCallback(`Sent: write-sample-base64 ${sampleId} ${arrayBuffer.byteLength} ${length}`, "sent");

      // Wait for Pico to respond with 'Ready to receive ...'
      await new Promise((res) => setTimeout(res, 300));

      // Send base64 data in chunks
      const chunkSize = 1024;
      let sent = 0;
      this.onMessageCallback("Sending base64 data...", "status");
      while (sent < length) {
        const end = Math.min(sent + chunkSize, length);
        const chunk = base64Data.substring(sent, end);
        await this.writer.write(chunk);
        sent = end;
        if (Math.floor((sent / length) * 10) > Math.floor(((sent - chunk.length) / length) * 10)) {
          const percent = Math.floor((sent / length) * 100);
          this.onMessageCallback(`Sending: ${percent}% (${sent}/${length} chars)`, "status");
        }
        await new Promise(res => setTimeout(res, 5));
      }
      // Send end marker
      await this.writer.write("\n");
      this.onMessageCallback(`Sample file sent (${arrayBuffer.byteLength} bytes as ${length} base64 chars)`, "sent");
    } catch (error: any) {
      this.onMessageCallback("Sample upload error: " + (error?.message || String(error)), "error");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.readLoopActive = false;
    
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.reader = null;
    }
    
    if (this.writer) {
      try {
        await this.writer.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.writer = null;
    }
    
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.abortController = null;
    }
    
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.port = null;
    }
    
    this.readPipePromise = null;
    this.writePipePromise = null;
  }
}