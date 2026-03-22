const { spawn } = require('child_process');

const child = spawn('npm --prefix backend run start', {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
