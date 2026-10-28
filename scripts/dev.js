/**
 * Runs the Express API and the Vite dev server together.
 * Usage: npm run dev
 */
const { spawn } = require('child_process');
const path = require('path');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(name, args) {
  const child = spawn(npmCmd, args, {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  const prefix = `[${name}]`;
  const pipe = (stream, out) => {
    stream.on('data', (chunk) => {
      String(chunk)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => out.write(`${prefix} ${line}\n`));
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix} exited with code ${code}`);
    process.exit(code || 0);
  });
  return child;
}

run('server', ['--prefix', 'server', 'run', 'dev']);
run('client', ['--prefix', 'client', 'run', 'dev']);
