/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const fromBuild = (path) => require(join(process.env.ELAB_TEST_BUILD_DIR, path));
const { SerialBinaryDecoder } = fromBuild('app/lib/serial-binary.js');
const { WebSerialManager } = fromBuild('app/lib/webserial.js');
const { queryScopeChannels, decodeScopeFrame, ElabScopeSession, SCOPE_PROBE_TIMEOUT_MS } = fromBuild('app/ui/16bit/lib/elab-scope.js');
const { buildScopeCapture, freezeScopeFrame } = fromBuild('app/ui/16bit/components/common/scope-capture.js');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const flush = async () => { await tick(); await tick(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const envelope = (bytes) => `::bin::${Buffer.from(bytes).toString('base64')}::bin::`;

for (const value of ['2', null, '1', '0', '3', '02', '2.0', ' 2 ', '2\n', 'unsupported', 'unknown command', '::val::2::val::', '21', 'version 2', 'A1=2,A2=2', 2]) {
  test(`capability: only exact string 2 enables dual (${JSON.stringify(value)})`, async () => {
    let query;
    const result = await queryScopeChannels({ sendAndReceive: async (...args) => { query = args; return value; } });
    assert.equal(result, value === '2' ? 2 : 1);
    assert.equal(query[0], 'get-scope-channels');
    assert.equal(query[1], SCOPE_PROBE_TIMEOUT_MS);
    assert.ok(query[1] <= 1000);
    assert.equal(query[2].exactResponse, true);
  });
}
test('capability query errors safely fall back to A1', async () => {
  assert.equal(await queryScopeChannels({ sendAndReceive: async () => { throw Error('old firmware'); } }), 1);
});

test('legacy 500-byte frame stays A1 only; 1000-byte dual frame is planar, not interleaved', () => {
  const bytes = Uint8Array.from({ length: 1000 }, (_, i) => i < 500 ? i % 256 : 255 - (i % 256));
  const legacy = decodeScopeFrame(bytes.slice(0, 500), 1);
  assert.equal(legacy.a1.length, 500);
  assert.equal(legacy.a2, undefined);
  assert.equal(legacy.a1[0], 0);
  assert.equal(legacy.a1[255], 3.3);
  const dual = decodeScopeFrame(bytes, 2);
  assert.equal(dual.a1.length, 500);
  assert.equal(dual.a2.length, 500);
  for (let i = 0; i < 500; i++) {
    assert.equal(dual.a1[i], (bytes[i] / 255) * 3.3);
    assert.equal(dual.a2[i], (bytes[500 + i] / 255) * 3.3);
  }
});
test('frame lengths must match negotiated mode exactly; never infer dual from payload size', () => {
  for (const length of [0, 1, 499, 501, 999, 1000, 1001, 1500]) assert.equal(decodeScopeFrame(new Uint8Array(length), 1), null);
  for (const length of [0, 1, 499, 500, 501, 999, 1001, 1500]) assert.equal(decodeScopeFrame(new Uint8Array(length), 2), null);
});

test('stream decoder handles every split point in a normal 500-byte legacy frame', () => {
  const expected = Uint8Array.from({ length: 500 }, (_, i) => i % 256);
  const text = envelope(expected);
  for (let split = 1; split < text.length; split++) {
    const frames = [], errors = [];
    const decoder = new SerialBinaryDecoder((frame) => frames.push(frame), () => {}, (error) => errors.push(error));
    decoder.push(text.slice(0, split));
    decoder.push(text.slice(split));
    assert.equal(frames.length, 1, `split ${split}`);
    assert.deepEqual(frames[0], expected);
    assert.deepEqual(errors, []);
  }
});
test('stream decoder drains coalesced frames, fragmented markers, invalid base64, and ordinary messages', () => {
  const frames = [], errors = [], text = [];
  const decoder = new SerialBinaryDecoder((frame) => frames.push(frame), (part) => text.push(part), (error) => errors.push(error));
  const wire = 'before\n' + envelope([1, 2]) + 'between\n::bin::%%%::bin::' + envelope(new Uint8Array(1000).fill(3)) + envelope([4]) + 'after\n';
  for (const char of wire) decoder.push(char);
  assert.deepEqual(frames.map((f) => f.length), [2, 1000, 1]);
  assert.equal(errors.length, 1);
  assert.equal(text.join(''), 'before\nbetween\nafter\n');
  decoder.push(envelope([5]) + envelope([6]));
  assert.deepEqual(frames.slice(-2).map((f) => [...f]), [[5], [6]]);
});
test('unterminated binary frame is bounded and subsequent frames can recover', () => {
  const frames = [], errors = [];
  const decoder = new SerialBinaryDecoder((frame) => frames.push(frame), () => {}, (error) => errors.push(error));
  decoder.push('::bin::' + 'A'.repeat(70000));
  decoder.push(envelope([7]));
  assert.equal(errors.length, 1);
  assert.deepEqual([...frames[0]], [7]);
});

// The real WebSerialManager reads/writes Web Streams; only the physical port is mocked.
async function serialFixture(onCommand = () => {}) {
  let input;
  const commands = [], messages = [];
  let written = '';
  let failWrite = false;
  let closeCount = 0;
  const port = {
    open: async () => {},
    close: async () => { closeCount++; },
    readable: new ReadableStream({ start(controller) { input = controller; } }),
    writable: new WritableStream({ write(bytes) {
      if (failWrite) throw Error('mock write failed');
      written += new TextDecoder().decode(bytes);
      let end;
      while ((end = written.indexOf('\n')) >= 0) {
        const command = written.slice(0, end); written = written.slice(end + 1);
        commands.push(command); onCommand(command, push);
      }
    } }),
  };
  const push = (value) => input.enqueue(new TextEncoder().encode(value));
  global.window = { TextDecoderStream, TextEncoderStream };
  const manager = new WebSerialManager((message, type) => messages.push({ message, type }));
  await manager.connectWithExistingPort(port);
  return { manager, port, commands, messages, push, eof: () => input.close(), fail: () => { failWrite = true; }, closed: () => closeCount };
}

test('real serial reader: fragmented/coalesced no-newline binary frames do not suppress messages or send/error notifications', async () => {
  const f = await serialFixture();
  const frames = [];
  const stop = f.manager.listenForBinary((bytes) => frames.push(bytes));
  const wire = 'hello\n' + envelope(new Uint8Array(500).fill(8)) + 'notice\n' + envelope([9]) + '::bin::bad!::bin::' + envelope([10]);
  for (let i = 0; i < wire.length; i += 7) f.push(wire.slice(i, i + 7));
  await flush();
  assert.deepEqual(frames.map((bytes) => bytes.length), [500, 1, 1]);
  assert.deepEqual(f.messages.filter((m) => m.type === 'received').map((m) => m.message), ['hello', 'notice']);
  assert.equal(f.messages.filter((m) => m.type === 'error').length, 1);
  await f.manager.sendMessage('stop-send');
  assert.ok(f.messages.some((m) => m.type === 'sent' && m.message === 'Sent: stop-send'));
  stop();
  const newer = [];
  const stopNewer = f.manager.listenForBinary((bytes) => newer.push(bytes));
  stop(); // Old cleanup cannot restore an old callback or stop a newer subscription.
  f.push(envelope([11])); await flush();
  assert.deepEqual([...newer[0]], [11]);
  stopNewer();
  f.push('ordinary\n'); await flush();
  assert.ok(f.messages.some((m) => m.message === 'ordinary'));
  await f.manager.disconnect();
  assert.equal(f.closed(), 1);
});

test('real serial queries retain normal callbacks while a binary listener starts/stops; queries serialize', async () => {
  const f = await serialFixture((command, push) => push(`::val::${command === 'first' ? 'one' : 'two'}::val::\n`));
  const first = f.manager.sendAndReceive('first', 50);
  const stop = f.manager.listenForBinary(() => {});
  const second = f.manager.sendAndReceive('second', 50);
  assert.equal(await first, 'one');
  stop();
  assert.equal(await second, 'two');
  assert.deepEqual(f.commands, ['first', 'second']);
  f.push('still visible\n'); await flush();
  assert.ok(f.messages.some((m) => m.message === 'still visible'));
  await f.manager.disconnect();
});

for (const response of ['::val::2::val::\r\n', 'noise ::val::2::val::\n', '::val::02::val::\n', '::val::2::val::extra\n', '::val::2\n', 'unknown command\n', '']) {
  test(`real exact capability response: ${JSON.stringify(response)}`, async () => {
    const f = await serialFixture((_command, push) => { if (response) push(response); });
    const value = await f.manager.sendAndReceive('get-scope-channels', 15, { exactResponse: true });
    assert.equal(value === '2', response === '::val::2::val::\r\n');
    await f.manager.disconnect();
  });
}
test('real query abort, disconnect and write failure clear pending timeouts/callbacks', async () => {
  const f = await serialFixture();
  const abort = new AbortController();
  const pending = f.manager.sendAndReceive('get-scope-channels', 30, { signal: abort.signal });
  await tick(); abort.abort();
  assert.equal(await pending, null);
  const waiting = f.manager.sendAndReceive('get-app', 30);
  await tick(); await f.manager.disconnect();
  assert.equal(await waiting, null);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(f.messages.filter((m) => m.message.includes('Response timeout')).length, 0);
  await assert.rejects(f.manager.sendMessage('start-send'), /Not connected/);
  const broken = await serialFixture(); broken.fail();
  assert.equal(await broken.manager.sendAndReceive('get-app', 20), null);
  assert.ok(broken.messages.some((m) => m.type === 'error' && m.message.includes('mock write failed')));
  await broken.manager.disconnect();
});
test('physical readable EOF disconnects once and invalidates capture/query state', async () => {
  const f = await serialFixture();
  const pending = f.manager.sendAndReceive('get-app', 50);
  await tick(); f.eof(); await flush();
  assert.equal(await pending, null);
  assert.equal(f.manager.isConnected(), false);
  await f.manager.disconnect();
  assert.equal(f.messages.filter((m) => m.message === 'Disconnected').length, 1);
});

function sessionFixture(value = '2') {
  const events = [], frames = [], errors = [], states = [];
  let listener = null, connected = true;
  const transport = {
    isConnected: () => connected,
    sendAndReceive: async (command) => { events.push(command); return value; },
    sendMessage: async (command) => { events.push(command); },
    listenForBinary: (callback) => { events.push('listen'); listener = callback; return () => { events.push('detach'); listener = null; }; },
  };
  const session = new ElabScopeSession(transport, {
    onState: (state) => states.push(state), onReset: (channels) => events.push(`reset:${channels}`),
    onFrame: (frame) => frames.push(frame), onError: (error) => errors.push(error),
  });
  return { session, transport, events, errors, states, frames, deliver: (frame) => listener?.(frame), disconnect: () => { connected = false; } };
}
for (const [capability, start, bytes] of [['2', 'start-send-2', 1000], [null, 'start-send', 500], ['1', 'start-send', 500], ['unknown command', 'start-send', 500]]) {
  test(`session negotiates before listener/start (${JSON.stringify(capability)}), validates length and caches only per connection`, async () => {
    const f = sessionFixture(capability);
    await f.session.setCapturing(true);
    assert.deepEqual(f.events.slice(0, 4), ['get-scope-channels', `reset:${bytes / 500}`, 'listen', start]);
    f.deliver(new Uint8Array(bytes));
    f.deliver(new Uint8Array(bytes === 1000 ? 500 : 1000));
    assert.equal(f.frames.length, 1);
    assert.equal(f.errors.length, 1);
    await f.session.setCapturing(false);
    assert.equal(f.events.at(-1), 'stop-send');
    assert.equal(f.states.at(-1).phase, 'idle');
    await f.session.setCapturing(true);
    assert.equal(f.events.filter((event) => event === 'get-scope-channels').length, 1);
    await f.session.dispose();
    const next = sessionFixture(null); await next.session.setCapturing(true);
    assert.equal(next.events.at(-1), 'start-send');
    await next.session.dispose();
  });
}
test('rapid start/stop/start and stale probes cannot start or publish old capabilities', async () => {
  const f = sessionFixture();
  const oldProbe = deferred();
  let queries = 0;
  f.transport.sendAndReceive = async () => { queries++; return queries === 1 ? oldProbe.promise : '1'; };
  const first = f.session.setCapturing(true); await flush();
  const stop = f.session.setCapturing(false);
  const start = f.session.setCapturing(true);
  oldProbe.resolve('2');
  await Promise.all([first, stop, start]);
  assert.ok(!f.events.includes('start-send-2'));
  assert.equal(f.events.filter((event) => event === 'start-send').length, 1);
  assert.equal(f.states.at(-1).channels, 1);
  await f.session.dispose();
});
test('dispose during probe and transport loss prevent late starts/frames', async () => {
  const f = sessionFixture(); const probe = deferred();
  f.transport.sendAndReceive = () => probe.promise;
  const start = f.session.setCapturing(true); await flush();
  const dispose = f.session.dispose(); probe.resolve('2');
  await Promise.all([start, dispose]);
  assert.ok(!f.events.includes('listen'));
  const g = sessionFixture(); await g.session.setCapturing(true);
  g.disconnect(); g.deliver(new Uint8Array(1000));
  assert.equal(g.frames.length, 0);
  await g.session.dispose();
});
test('stop is ordered after an in-flight start write; rejected start is stopped and reported', async () => {
  const f = sessionFixture(); const write = deferred();
  f.transport.sendMessage = async (command) => { f.events.push(command); if (command === 'start-send-2') await write.promise; };
  const start = f.session.setCapturing(true); await flush();
  const stop = f.session.setCapturing(false);
  f.deliver(new Uint8Array(1000));
  assert.equal(f.frames.length, 0);
  write.resolve(); await Promise.all([start, stop]);
  assert.equal(f.events.at(-1), 'stop-send');
  assert.equal(f.states.at(-1).wanted, false);
  const g = sessionFixture();
  g.transport.sendMessage = async (command) => { g.events.push(command); if (command === 'start-send-2') throw Error('write rejected'); };
  await g.session.setCapturing(true);
  assert.equal(g.events.at(-1), 'stop-send');
  assert.match(g.errors[0], /write rejected/);
  assert.equal(g.states.at(-1).phase, 'idle');
  await g.session.dispose();
});
test('stop failure is visible, detaches frames, and a deliberate restart retries stop before start', async () => {
  const f = sessionFixture(); await f.session.setCapturing(true);
  let fail = true;
  f.transport.sendMessage = async (command) => { f.events.push(command); if (command === 'stop-send' && fail) { fail = false; throw Error('stop failed'); } };
  await f.session.setCapturing(false);
  assert.match(f.errors[0], /stop failed/);
  f.deliver(new Uint8Array(1000)); assert.equal(f.frames.length, 0);
  await f.session.setCapturing(true);
  assert.deepEqual(f.events.slice(-4), ['stop-send', 'reset:2', 'listen', 'start-send-2']);
  await f.session.dispose();
});

function capture(overrides = {}) {
  return buildScopeCapture({ data: new Array(40).fill(0.3), secondaryData: Array.from({ length: 40 }, (_, i) => i % 16 < 8 ? 0.3 : 2.8),
    total: 40, windowSamples: 8, preSamples: 4, sampleIntervalMs: 0.1,
    mode: 'normal', edge: 'rising', level: 1.65, triggerSource: 1,
    armedAt: null, frozen: null, previousFrame: null, lastTrigger: null, ...overrides });
}
test('A2 trigger applies one shared index/time origin to both traces, with legacy A1 triggering intact', () => {
  const result = capture();
  assert.equal(result.status, "TRIG'D"); assert.equal(result.frame.trigIndex, 24);
  assert.equal(result.frame.start, 20);
  assert.equal(result.frame.buf[24], 0.3); assert.equal(result.frame.secondary[24], 2.8);
  const legacy = capture({ data: result.frame.secondary, secondaryData: undefined, triggerSource: 0 });
  assert.equal(legacy.frame.trigIndex, 24); assert.equal(legacy.frame.secondary, undefined);
});
test('normal wait retains the complete previous paired trigger, not a latest unrelated A2', () => {
  const previous = capture().frame;
  const result = capture({ secondaryData: new Array(40).fill(0), lastTrigger: previous });
  assert.equal(result.status, 'WAIT'); assert.equal(result.frame, previous);
  assert.equal(result.frame.secondary[24], 2.8);
});
test('single ignores old triggers, freezes both channels on the same fresh edge, and survives later data', () => {
  const previous = capture().frame;
  const waiting = capture({ armedAt: 40, previousFrame: previous });
  assert.equal(waiting.status, 'WAIT'); assert.equal(waiting.captured, undefined);
  const data = Array.from({ length: 64 }, (_, i) => i / 64);
  const secondaryData = Array.from({ length: 64 }, (_, i) => i % 16 < 8 ? 0.3 : 2.8);
  const single = capture({ data, secondaryData, total: 64, armedAt: 40 });
  assert.equal(single.status, 'STOP'); assert.equal(single.captured.trigIndex, 56);
  const captured = single.captured;
  data.fill(3.3); secondaryData.fill(0);
  const frozen = capture({ frozen: captured });
  assert.equal(frozen.frame.buf[56], 56 / 64); assert.equal(frozen.frame.secondary[56], 2.8);
  assert.equal(frozen.frame.trigIndex, 56);
});
test('manual freeze, pan and timebase changes move both channel buffers together', () => {
  const live = capture().frame;
  const frozen = freezeScopeFrame(live, 4);
  const panned = capture({ frozen: { ...frozen, anchor: frozen.anchor - 3 }, preSamples: 6, windowSamples: 12 });
  assert.equal(panned.status, 'STOP');
  assert.equal(panned.frame.start, frozen.anchor - 3 - 6);
  assert.equal(panned.frame.buf, frozen.buf); assert.equal(panned.frame.secondary, frozen.secondary);
  assert.equal(panned.frame.trigIndex, frozen.trigIndex);
  const bad = capture({ mode: 'off', secondaryData: [1, 2] });
  assert.equal(bad.frame.secondary, undefined);
});


test('real legacy timeout is bounded and capture still starts with exactly the legacy command', async () => {
  const f = await serialFixture((command, push) => {
    if (command === 'start-send') push(envelope(new Uint8Array(500).fill(128)));
  });
  const frames = [], errors = [];
  const session = new ElabScopeSession(f.manager, {
    onState: () => {}, onReset: () => {}, onFrame: (frame) => frames.push(frame), onError: (error) => errors.push(error),
  });
  const before = Date.now();
  await session.setCapturing(true); await flush();
  assert.ok(Date.now() - before >= 700);
  assert.ok(Date.now() - before < 2000);
  assert.deepEqual(f.commands, ['get-scope-channels', 'start-send']);
  assert.equal(frames.length, 1); assert.equal(frames[0].length, 500);
  assert.deepEqual(errors, []);
  await session.dispose(); await f.manager.disconnect();
});
test('reconnect waits for old port cleanup; old queued queries cannot write on a new connection', async () => {
  const f = await serialFixture();
  const closing = deferred(); f.port.close = () => closing.promise;
  const pending = f.manager.sendAndReceive('old-query', 100);
  const queued = f.manager.sendAndReceive('old-queued-query', 100);
  await tick();
  const disconnect = f.manager.disconnect();
  let opened = false;
  const nextPort = {
    open: async () => { opened = true; }, close: async () => {},
    readable: new ReadableStream(), writable: new WritableStream(),
  };
  const reconnect = f.manager.connectWithExistingPort(nextPort);
  await flush(); assert.equal(opened, false);
  assert.equal(await pending, null); assert.equal(await queued, null);
  closing.resolve(); await Promise.all([disconnect, reconnect]);
  assert.equal(opened, true); assert.equal(f.manager.isConnected(), true);
  assert.deepEqual(f.commands, ['old-query']);
  await f.manager.disconnect();
});
test('falling-edge triggers also preserve paired indices after buffer rollover', () => {
  const result = capture({ edge: 'falling', total: 1040 });
  assert.equal(result.status, "TRIG'D"); assert.equal(result.frame.trigIndex, 32);
  const waiting = capture({ edge: 'falling', total: 1040, armedAt: 1040, previousFrame: result.frame });
  assert.equal(waiting.status, 'WAIT'); assert.equal(waiting.frame, result.frame);
});

// Host-rendered React markup assertions complement the real streamed-serial tests.
// They are not browser/canvas screenshots or pointer-interaction tests.
require.extensions['.css'] = (module) => { module.exports = new Proxy({}, { get: (_target, name) => name === '__esModule' ? false : String(name) }); };
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Oscilloscope = fromBuild('app/ui/16bit/components/common/Oscilloscope.js').default;
const AppElab = fromBuild('app/ui/16bit/components/apps/AppElab.js').default;
test('legacy scope UI has labeled A1 only and no phantom A2 source/visibility controls', () => {
  const markup = renderToStaticMarkup(React.createElement(Oscilloscope, { data: [0, 3.3], channelLabels: ['A1', 'A2'] }));
  assert.match(markup, /Oscilloscope: A1/);
  assert.doesNotMatch(markup, /A2|Measurement source|Trigger source|Show A2/);
  for (const feature of ['RUN', 'FREEZE', 'SINGLE', 'AUTOSET', 'SAVE PNG', 'X · TIME', 'Y · VOLT', 'Horizontal', 'Vertical', 'Trigger']) assert.ok(markup.includes(feature));
  const app = renderToStaticMarkup(React.createElement(AppElab, { isListeningForBinary: false, onBinaryListeningToggle: () => {} }));
  assert.match(app, /A1-only capture \(legacy compatible\)/);
  assert.match(app, /Start Capturing/);
  assert.doesNotMatch(app, /Show A2|Measurement source|Trigger source/);
});
test('modern scope UI exposes distinct-color A1/A2 labels, visibility and independent trigger/measurement sources', () => {
  const markup = renderToStaticMarkup(React.createElement(Oscilloscope, { data: [0, 3.3], secondaryData: [3.3, 0], channelLabels: ['A1', 'A2'], sampleIntervalMs: 0.1 }));
  assert.match(markup, /A1 and A2, time-aligned/);
  for (const control of ['Show A1', 'Show A2', 'Trigger source', 'Measurement source']) assert.ok(markup.includes(control));
  assert.match(markup, /#ffd23f/); assert.match(markup, /#7ea6ff/);
  assert.match(markup, /A1 ON/); assert.match(markup, /A2 ON/);
});
test('existing scope callers retain default channel name, timebase, height and fullscreen API', () => {
  const markup = renderToStaticMarkup(React.createElement(Oscilloscope, { data: [] }));
  assert.match(markup, /CH1/); assert.doesNotMatch(markup, /CH2|Measurement source/);
  assert.match(markup, /10ms/); assert.match(markup, /height:340px/);
  const fullscreen = renderToStaticMarkup(React.createElement(Oscilloscope, { data: [], fullscreen: true, onToggleFullscreen: () => {}, title: 'Custom Scope' }));
  assert.match(fullscreen, /Custom Scope/); assert.match(fullscreen, /Exit fullscreen \(Esc\)/);
});


test('an unexpected capability reply commits legacy fallback even if a later unrelated value is 2', async () => {
  const f = await serialFixture((_command, push) => push('unknown command\n::val::2::val::\n'));
  assert.equal(await queryScopeChannels(f.manager), 1);
  await f.manager.disconnect();
});
