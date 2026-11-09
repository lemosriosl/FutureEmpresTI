const { spawnSync } = require('node:child_process');

const resultado = spawnSync(process.execPath, ['--test', 'normalizar.test.mjs'], {
  cwd: __dirname,
  env: { SystemRoot: process.env.SystemRoot },
  stdio: 'inherit',
});
if (resultado.error) throw resultado.error;
process.exitCode = resultado.status ?? 1;
