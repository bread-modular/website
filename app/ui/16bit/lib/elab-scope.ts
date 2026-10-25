export type ScopeChannels = 1 | 2;
export const SCOPE_SAMPLES_PER_CHANNEL = 500;
export const SCOPE_PROBE_TIMEOUT_MS = 750;

export interface ScopeTransport {
  isConnected(): boolean;
  sendAndReceive(command: string, timeoutMs?: number, options?: { signal?: AbortSignal; exactResponse?: boolean }): Promise<string | null>;
  sendMessage(command: string): Promise<void>;
  listenForBinary(callback: (bytes: Uint8Array) => void): () => void;
}

export async function queryScopeChannels(transport: ScopeTransport, signal?: AbortSignal): Promise<ScopeChannels> {
  try {
    const value = await transport.sendAndReceive("get-scope-channels", SCOPE_PROBE_TIMEOUT_MS, { signal, exactResponse: true });
    // No version guesses, numeric coercion, substring matching or payload heuristics.
    return value === "2" ? 2 : 1;
  } catch {
    return 1;
  }
}

export function decodeScopeFrame(bytes: Uint8Array, channels: ScopeChannels): { a1: number[]; a2?: number[] } | null {
  if (bytes.length !== channels * SCOPE_SAMPLES_PER_CHANNEL) return null;
  const volts = (value: number) => (value / 255) * 3.3;
  return {
    a1: Array.from(bytes.subarray(0, SCOPE_SAMPLES_PER_CHANNEL), volts),
    ...(channels === 2 ? { a2: Array.from(bytes.subarray(SCOPE_SAMPLES_PER_CHANNEL), volts) } : {}),
  };
}

export type ScopePhase = "idle" | "probing" | "starting" | "capturing" | "stopping";
export interface ScopeSessionState { channels: ScopeChannels; phase: ScopePhase; wanted: boolean }

/** One connection only. Serializes writes; canceled/stale probes can never start capture. */
export class ElabScopeSession {
  private channels: ScopeChannels | null = null;
  private wanted = false;
  private revision = 0;
  private disposed = false;
  private streamMayBeRunning = false;
  private stopListener: (() => void) | null = null;
  private probe: AbortController | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(private transport: ScopeTransport, private callbacks: {
    onState: (state: ScopeSessionState) => void;
    onReset: (channels: ScopeChannels) => void;
    onFrame: (bytes: Uint8Array) => void;
    onError: (message: string) => void;
  }) {}

  wantsCapture(): boolean { return this.wanted; }

  private publish(phase: ScopePhase): void {
    if (!this.disposed) this.callbacks.onState({ channels: this.channels ?? 1, phase, wanted: this.wanted });
  }

  private detach(): void {
    this.stopListener?.();
    this.stopListener = null;
  }

  setCapturing(wanted: boolean): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.wanted = wanted;
    const revision = ++this.revision;
    this.probe?.abort();
    // Stop accepting frames immediately, not when the pending write finishes.
    this.detach();
    this.publish(wanted ? "starting" : "stopping");
    this.queue = this.queue.then(() => this.reconcile(revision)).catch((error) => {
      if (this.disposed || revision !== this.revision) return;
      this.wanted = false;
      this.detach();
      this.callbacks.onError(`Scope capture error: ${error instanceof Error ? error.message : String(error)}`);
      this.publish("idle");
    });
    return this.queue;
  }

  private async stopStream(): Promise<void> {
    if (!this.streamMayBeRunning) return;
    if (this.transport.isConnected()) await this.transport.sendMessage("stop-send");
    this.streamMayBeRunning = false;
  }

  private async reconcile(revision: number): Promise<void> {
    const current = () => !this.disposed && revision === this.revision && this.transport.isConnected();
    if (!current()) return;
    await this.stopStream();
    if (!current()) return;
    if (!this.wanted) { this.publish("idle"); return; }
    if (this.channels === null) {
      this.publish("probing");
      this.probe = new AbortController();
      const channels = await queryScopeChannels(this.transport, this.probe.signal);
      this.probe = null;
      if (!current()) return;
      this.channels = channels;
    }
    const channels = this.channels;
    this.callbacks.onReset(channels);
    this.publish("starting");
    let reportedBadLength = false;
    this.stopListener = this.transport.listenForBinary((bytes) => {
      if (!current() || !this.wanted) return;
      if (bytes.length !== channels * SCOPE_SAMPLES_PER_CHANNEL) {
        if (!reportedBadLength) this.callbacks.onError(`Scope frame rejected: expected ${channels * SCOPE_SAMPLES_PER_CHANNEL} bytes for ${channels} channel(s), received ${bytes.length}`);
        reportedBadLength = true;
        return;
      }
      this.callbacks.onFrame(bytes);
    });
    this.streamMayBeRunning = true; // Also stop after an uncertain/rejected write.
    try {
      await this.transport.sendMessage(channels === 2 ? "start-send-2" : "start-send");
    } catch (error) {
      this.detach();
      try { await this.stopStream(); } catch (stopError) {
        this.callbacks.onError(`Scope stop error: ${String(stopError)}`);
      }
      throw error;
    }
    if (current()) this.publish("capturing");
    // An intervening Stop/Dispose is queued after this write, never before it.
  }

  dispose(): Promise<void> {
    this.disposed = true;
    this.wanted = false;
    this.revision++;
    this.probe?.abort();
    this.detach();
    this.queue = this.queue.then(() => this.stopStream()).catch((error) => {
      this.callbacks.onError(`Scope stop error: ${String(error)}`);
    });
    return this.queue;
  }
}
