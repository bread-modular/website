const MARKER = "::bin::";
// Generous enough for existing binary users, but bound a missing closing marker.
const MAX_FRAME_CHARS = 64 * 1024;

/** Streaming envelope decoder. Text outside binary envelopes is never suppressed. */
export class SerialBinaryDecoder {
  private buffer = "";

  constructor(
    private readonly onFrame: (bytes: Uint8Array) => void,
    private readonly onText: (text: string) => void,
    private readonly onError: (message: string) => void,
  ) {}

  push(text: string): void {
    this.buffer += text;
    while (this.buffer) {
      const start = this.buffer.indexOf(MARKER);
      if (start < 0) {
        // Keep only a possible fragmented opening marker, forwarding ordinary text now.
        let tail = Math.min(MARKER.length - 1, this.buffer.length);
        while (tail && !MARKER.startsWith(this.buffer.slice(-tail))) tail--;
        this.onText(this.buffer.slice(0, this.buffer.length - tail));
        this.buffer = this.buffer.slice(this.buffer.length - tail);
        return;
      }
      if (start > 0) {
        this.onText(this.buffer.slice(0, start));
        this.buffer = this.buffer.slice(start);
      }
      const end = this.buffer.indexOf(MARKER, MARKER.length);
      if (end < 0) {
        if (this.buffer.length > MAX_FRAME_CHARS) {
          this.buffer = "";
          this.onError("Binary decode error: unterminated frame exceeded buffer limit");
        }
        return;
      }
      const payload = this.buffer.slice(MARKER.length, end);
      // Always consume the envelope BEFORE decoding, including invalid base64.
      this.buffer = this.buffer.slice(end + MARKER.length);
      let bytes: Uint8Array;
      try {
        const decoded = atob(payload);
        bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
      } catch (error) {
        this.onError(`Binary decode error: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      this.onFrame(bytes);
    }
  }

  stop(): void {
    // A partial binary envelope cannot become a normal message after detaching.
    if (!this.buffer.startsWith(MARKER)) this.onText(this.buffer);
    this.buffer = "";
  }
}
