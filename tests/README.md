# ELab scope host checks

Run `npm run test:elab` after `npm ci`. This uses Node's built-in test runner and the project's existing TypeScript/React packages; it adds no dependencies. The runner compiles only the relevant modules to a temporary directory, checks real Web Streams with a mock serial port, and removes the temporary build afterward.

Coverage includes strict capability negotiation and legacy fallbacks; exact planar demultiplexing and voltage conversion; fragmented/coalesced binary envelopes, invalid base64 and buffer bounds; normal message/error delivery; query/listener cleanup; cancel/start/stop/disconnect/reconnect races; aligned trigger, single, frozen, panned and held captures; and host-rendered modern/legacy React markup/default controls.

## Unchanged wire contract

- Before installing the binary listener, use `sendAndReceive("get-scope-channels", 750, { exactResponse: true, signal })`. Only the exact `::val::2::val::` reply enables two channels. Timeout, unknown command, malformed/unexpected reply, or query failure selects one channel. No firmware-version or payload-size guessing.
- `start-send`: exactly 500 bytes, A1 only, on every firmware version.
- `start-send-2`: only after positive capability detection; exactly 1000 bytes, first 500 A1 then 500 A2, paired samples, no header/interleaving.
- Both retain `::bin::<base64>::bin::`; `stop-send` stops either mode.
- Unsigned bytes map to 0–3.3 V. `/ui/16bit` retains `sampleIntervalMs={0.1}`. Sample totals count paired instants, not the sum of channel lengths.
- A session belongs to one connection. Capability is cached only for that session. Each start resets capture history while retaining timebase/cursor/channel control settings. Both channel buffers are published, triggered, held, frozen and panned as one frame.

## Other validation

- `npx tsc --noEmit --incremental false`
- `npx eslint app/lib/webserial.ts app/lib/serial-binary.ts app/ui/16bit/page.tsx app/ui/16bit/lib/elab-scope.ts app/ui/16bit/components/apps/AppElab.tsx app/ui/16bit/components/common/Oscilloscope.tsx app/ui/16bit/components/common/scope-capture.ts scripts/test-elab.cjs tests/elab.test.cjs`
- `npm run build`

The host markup tests do not execute canvas drawing or pointer interactions. Browser functional validation with mocked Web Serial should still cover modern A1/A2 and legacy A1-only screenshots, source/visibility controls, single/freeze/run, pan, cursors, fullscreen/Escape and rapid capture toggles. Browser evidence was not captured during this implementation because the browser tool rejected its request schema. No physical-device testing is assumed or claimed.
