import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for the read-only smoke check.');
  process.exit(1);
}

const port = process.env.SMOKE_TEST_PORT || '3123';
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], {
  env: { ...process.env, PORT: port, NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', data => { output += data.toString(); });
server.stderr.on('data', data => { output += data.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(`${base}/`);
      if (response.ok) return;
    } catch {
      // Wait for the process to bind its port.
    }
    await delay(250);
  }
  throw new Error(`Server did not start. ${output}`);
}

try {
  await waitForServer();
  const home = await fetch(`${base}/`);
  if (!home.ok || !(await home.text()).includes('Bookly')) {
    throw new Error('The application root did not respond as expected.');
  }
  const anonymous = await fetch(`${base}/api/auth/me`);
  if (anonymous.status !== 401) throw new Error(`Unauthenticated request returned ${anonymous.status}, expected 401.`);
  const demo = await fetch(`${base}/api/auth/demo-status`);
  if (!demo.ok || typeof (await demo.json()).available !== 'boolean') {
    throw new Error('Demo availability endpoint did not return a valid response.');
  }
  console.log('Build and read-only API smoke checks passed.');
} catch (error) {
  console.error(error.message);
  if (output) console.error(output);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
