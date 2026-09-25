import { execSync, spawn } from 'child_process';
import { setTimeout as delay } from 'timers/promises';

const TEST_PORT = process.env.SMOKE_TEST_PORT || '3123';
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!TEST_DATABASE_URL) {
  console.error('TEST_DATABASE_URL or DATABASE_URL must be set for smoke tests.');
  process.exit(1);
}

execSync('node server/db/migrate.js', {
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: 'test' },
  stdio: 'inherit',
});

const serverProcess = spawn('node', ['server/index.js'], {
  env: {
    ...process.env,
    PORT: TEST_PORT,
    DATABASE_URL: TEST_DATABASE_URL,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    SENDGRID_API_KEY: '',
    TWILIO_ACCOUNT_SID: '',
    TWILIO_AUTH_TOKEN: '',
  },
  stdio: 'pipe',
});

let serverOutput = '';
serverProcess.stdout.on('data', d => { serverOutput += d.toString(); });
serverProcess.stderr.on('data', d => { serverOutput += d.toString(); });

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await delay(500);
  }
  throw new Error(`Server did not become ready. Output: ${serverOutput}`);
}

async function runChecks() {
  const base = `http://localhost:${TEST_PORT}`;

  const homeRes = await fetch(`${base}/`);
  if (!homeRes.ok) throw new Error(`Home page returned ${homeRes.status}`);
  const homeText = await homeRes.text();
  if (!homeText.includes('Bookly')) throw new Error('Home page does not contain Bookly');

  const demoRes = await fetch(`${base}/api/auth/demo-status`);
  if (!demoRes.ok) throw new Error(`demo-status returned ${demoRes.status}`);
  const demoData = await demoRes.json();

  const testEmail = `smoke_${Date.now()}@test.com`;
  const regRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'TestPass123', name: 'Smoke Test' }),
  });
  if (regRes.status !== 201) throw new Error(`Registration failed with ${regRes.status}: ${await regRes.text()}`);

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'TestPass123' }),
  });
  if (loginRes.status !== 200) throw new Error(`Login failed with ${loginRes.status}: ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  if (!loginData.user || loginData.user.email !== testEmail) throw new Error('Login returned incorrect user');
}

async function main() {
  try {
    await waitForServer(`http://localhost:${TEST_PORT}/`);
    await runChecks();
    console.log('✅ Smoke checks passed');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  } catch (err) {
    console.error('❌ Smoke checks failed:', err.message);
    console.error('Server output:', serverOutput);
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }
}

main();
