const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}`;
let passed = 0, failed = 0;

const req = (method, path, body) => new Promise((resolve) => {
  const data = body ? JSON.stringify(body) : null;
  const options = {
    hostname: 'localhost', port: process.env.PORT || 5000,
    path, method,
    headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
  };
  const r = http.request(options, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
      catch { resolve({ status: res.statusCode, body: d }); }
    });
  });
  r.on('error', (e) => resolve({ status: 0, error: e.message }));
  if (data) r.write(data);
  r.end();
});

const test = async (name, fn) => {
  try { await fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
};

(async () => {
  console.log('\n🌐 API Integration Tests (server must be running)');

  await test('GET /api/health returns 200', async () => {
    const res = await req('GET', '/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.status) throw new Error('Missing status field');
  });

  await test('GET /api/metrics returns system info', async () => {
    const res = await req('GET', '/api/metrics');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.system) throw new Error('Missing system field');
  });

  await test('POST /api/auth/login with bad creds returns 401', async () => {
    const res = await req('POST', '/api/auth/login', { email: 'bad@bad.com', password: 'wrong' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('POST /api/auth/login with valid creds returns token', async () => {
    const res = await req('POST', '/api/auth/login', { email: 'patient@medicare.com', password: 'patient123' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.token) throw new Error('Missing token');
    if (!res.body.refreshToken) throw new Error('Missing refreshToken');
  });

  await test('POST /api/auth/refresh with no token returns 401', async () => {
    const res = await req('POST', '/api/auth/refresh', {});
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('GET /api/doctors returns list', async () => {
    const res = await req('GET', '/api/doctors');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Expected array');
  });

  await test('GET /api/webrtc/room/invalid returns 404', async () => {
    const res = await req('GET', '/api/webrtc/room/nonexistent-room');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━\n`);
  if (failed > 0) process.exit(1);
})();
