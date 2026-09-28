const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: true }));

const queues = [];

const commitId =
  process.env.GIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  'local';

// Home page
app.get('/', (req, res) => {
  const rows = queues
    .map(
      (item) => `
        <tr>
          <td>${item.customer}</td>
          <td>${item.service}</td>
          <td><span>${item.status}</span></td>
        </tr>
      `
    )
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QueueWise</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
        }

        input, button {
          padding: 8px;
          margin: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }

        span {
          padding: 4px 8px;
          border-radius: 5px;
          background: #eee;
        }

        footer {
          margin-top: 30px;
          font-size: 14px;
        }
      </style>
    </head>

    <body>
      <h1>QueueWise</h1>

      <form method="POST" action="/add">
        <input
          type="text"
          name="customer"
          placeholder="Customer Name"
        />

        <input
          type="text"
          name="service"
          placeholder="Service Type"
        />

        <button type="submit">Add to Queue</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          ${rows || '<tr><td colspan="3">No customers in queue</td></tr>'}
        </tbody>
      </table>

      <footer>
        Git Commit: ${commitId}
      </footer>
    </body>
    </html>
  `);
});

// Add queue item
app.post('/add', (req, res) => {
  const customer = String(req.body.customer || '').trim();
  const service = String(req.body.service || '').trim();

  if (!customer || !service) {
    return res.status(400).send('Customer name and service are required.');
  }

  queues.push({
    customer,
    service,
    status: 'Waiting'
  });

  return res.redirect('/');
});

// JSON queue API
app.get('/api/queues', (req, res) => {
  res.json(queues);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    commit: commitId
  });
});

module.exports = app;
