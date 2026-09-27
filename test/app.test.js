const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp, calculateStatus } = require('../app');

async function makeTestApp() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'queuewise-'));
  const dataFile = path.join(directory, 'queues.json');
  const app = createApp({ dataFile });
  return { app, dataFile, directory };
}

async function request(app, method, url, body, headers = {}) {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const port = server.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}${url}`, {
      method,
      headers: { ...headers },
      body: body instanceof URLSearchParams ? body : body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    return { status: response.status, headers: response.headers, text };
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('GET /health returns HTTP 200 and status ok', async () => {
  const { app, directory } = await makeTestApp();
  try {
    const response = await request(app, 'GET', '/health');
    assert.equal(response.status, 200);
    assert.equal(JSON.parse(response.text).status, 'ok');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('valid POST /queues creates a queue report', async () => {
  const { app, dataFile, directory } = await makeTestApp();
  try {
    const body = new URLSearchParams({ location: 'Engineering Lab', peopleCount: '18', estimatedWait: '25', description: 'Project submission queue.' });
    const response = await request(app, 'POST', '/queues', body, { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' });
    assert.equal(response.status, 201);
    const saved = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].location, 'Engineering Lab');
    assert.equal(saved[0].status, 'Busy');
    assert.equal(saved[0].id, 1);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('invalid POST /queues returns HTTP 400 and does not write data', async () => {
  const { app, dataFile, directory } = await makeTestApp();
  try {
    const body = new URLSearchParams({ location: 'A', peopleCount: '999', estimatedWait: '5', description: '' });
    const response = await request(app, 'POST', '/queues', body, { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' });
    assert.equal(response.status, 400);
    assert.match(JSON.parse(response.text).error, /Location|People count/);
    const saved = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    assert.deepEqual(saved, []);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('GET /api/queues returns JSON', async () => {
  const { app, directory } = await makeTestApp();
  try {
    const response = await request(app, 'GET', '/api/queues');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type').startsWith('application/json'), true);
    assert.ok(Array.isArray(JSON.parse(response.text)));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('server calculates all queue status thresholds correctly', () => {
  assert.equal(calculateStatus(0), 'Low');
  assert.equal(calculateStatus(5), 'Low');
  assert.equal(calculateStatus(6), 'Moderate');
  assert.equal(calculateStatus(15), 'Moderate');
  assert.equal(calculateStatus(16), 'Busy');
  assert.equal(calculateStatus(30), 'Busy');
  assert.equal(calculateStatus(31), 'Very Busy');
  assert.equal(calculateStatus(500), 'Very Busy');
});

test('HTML page renders queue reports and commit footer', async () => {
  const { app, dataFile, directory } = await makeTestApp();
  const previous = process.env.GIT_SHA;
  process.env.GIT_SHA = 'test-sha';
  try {
    await fs.writeFile(
      dataFile,
      JSON.stringify([
        {
          id: 1,
          location: 'Test Library',
          peopleCount: 8,
          estimatedWait: 12,
          description: 'Test queue.',
          status: 'Moderate',
          reportedAt: new Date().toISOString()
        }
      ])
    );

    const response = await request(app, 'GET', '/');
    assert.equal(response.status, 200);
    assert.match(response.text, /Test Library/);
    assert.match(response.text, /Running commit:/);
    assert.match(response.text, /test-sha/);
  } finally {
    if (previous === undefined) delete process.env.GIT_SHA;
    else process.env.GIT_SHA = previous;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
