/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const { runInNewContext } = require('node:vm');

const filename = join(__dirname, '../scripts/test-elab.cjs');
const source = readFileSync(filename, 'utf8');

// Execute the real runner with isolated process state and no compilation or disk writes.
function runRunner(compile, tests) {
  let calls = 0;
  let cleaned = false;
  const runnerProcess = { execPath: process.execPath, env: {} };
  const mockRequire = (name) => {
    if (name === 'node:child_process') return { spawnSync: () => ++calls === 1 ? compile : tests };
    if (name === 'node:fs') return {
      mkdtempSync: () => join(tmpdir(), 'elab-runner-regression'),
      mkdirSync() {},
      copyFileSync() {},
      rmSync() { cleaned = true; },
    };
    return require(name);
  };
  mockRequire.resolve = require.resolve;
  runInNewContext(source, { require: mockRequire, process: runnerProcess }, { filename, timeout: 1000 });
  assert.equal(cleaned, true, 'temporary build cleanup must still run');
  return { exitCode: runnerProcess.exitCode, calls };
}

const signaled = spawnSync(process.execPath, ['-e', "process.kill(process.pid, 'SIGTERM')"]);
const failed = spawnSync(join(tmpdir(), `elab-missing-executable-${process.pid}`));
assert.equal(signaled.status, null);
assert.equal(signaled.signal, 'SIGTERM');
assert.equal(failed.status, null);
assert.equal(failed.error.code, 'ENOENT');

for (const [name, result, expected] of [
  ['success', { status: 0 }, 0],
  ['nonzero exit', { status: 7 }, 7],
  ['signal termination', signaled, 1],
  ['failed spawn', failed, 1],
]) {
  test(`ELab runner test child: ${name}`, () => {
    assert.deepEqual(runRunner({ status: 0 }, result), { exitCode: expected, calls: 2 });
  });
  if (expected !== 0) test(`ELab runner compiler: ${name}`, () => {
    assert.deepEqual(runRunner(result, { status: 0 }), { exitCode: expected, calls: 1 });
  });
}
