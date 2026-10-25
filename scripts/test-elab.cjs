/* eslint-disable @typescript-eslint/no-require-imports */
// No test dependencies: compile just the host-testable modules into an isolated temp dir.
const { mkdtempSync, rmSync, mkdirSync, copyFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const buildDir = mkdtempSync(join(tmpdir(), 'elab-host-tests-'));
try {
  const compile = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'),
    '--outDir', buildDir, '--rootDir', '.', '--module', 'commonjs', '--target', 'ES2020',
    '--lib', 'ES2020,DOM', '--jsx', 'react-jsx', '--strict', '--skipLibCheck', '--esModuleInterop',
    'app/lib/webserial.ts', 'app/ui/16bit/lib/elab-scope.ts',
    'app/ui/16bit/components/common/scope-capture.ts',
    'app/ui/16bit/components/common/Oscilloscope.tsx',
    'app/ui/16bit/components/apps/AppElab.tsx', 'node_modules/next/types/global.d.ts',
  ], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status || 1;
  else {
    for (const css of [
      'app/ui/16bit/components/common/Oscilloscope.module.css',
      'app/ui/16bit/components/apps/AppElab.module.css',
      'app/ui/16bit/components/apps/AppCommon.module.css',
    ]) {
      const dest = join(buildDir, css);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(css, dest);
    }
    const tests = spawnSync(process.execPath, ['--test', 'tests/elab.test.cjs', 'tests/elab-runner.test.cjs'], {
      stdio: 'inherit', env: { ...process.env, ELAB_TEST_BUILD_DIR: buildDir, NODE_PATH: resolve('node_modules') },
    });
    // A signal or failed spawn has no numeric exit status: never report it as success.
    process.exitCode = tests.status ?? 1;
  }
} finally {
  rmSync(buildDir, { recursive: true, force: true });
}
