const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

async function request(path, options = {}) {
  const server = app.listen(0);

  try {
    const port = server.address().port;

    return await fetch(`http://localhost:${port}${path}`, {
      ...options,
      redirect: 'manual'
    });
  } finally {
    server.close();
  }
}

test('GET /health returns status ok', async () => {
  const response = await request('/health');

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.status, 'ok');
});

test('POST /add creates a queue item and redirects', async () => {
  const response = await request('/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'customer=Test%20Customer&service=Student%20Help'
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/');
});

test('GET /api/queues contains the created queue item', async () => {
  const response = await request('/api/queues');

  assert.equal(response.status, 200);

  const queues = await response.json();

  assert.ok(Array.isArray(queues));

  const found = queues.some(
    item =>
      item.customer === 'Test Customer' &&
      item.service === 'Student Help'
  );

  assert.equal(found, true);
});

test('POST /add with missing data returns 400', async () => {
  const response = await request('/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'customer=&service='
  });

  assert.equal(response.status, 400);
});