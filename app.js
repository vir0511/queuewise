const express = require('express');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const queues = [];

const commitId =
  process.env.GIT_SHA ||
  process.env.RENDER_GIT_COMMIT ||
  'local';

// Determine queue status based on queue position
function getStatusClass(index) {
  if (index === 0) return 'status-low';
  if (index <= 2) return 'status-moderate';
  if (index <= 4) return 'status-busy';
  return 'status-very-busy';
}

function getStatusText(index) {
  if (index === 0) return 'Next';
  if (index <= 2) return 'Moderate';
  if (index <= 4) return 'Busy';
  return 'Very Busy';
}

// Home page
app.get('/', (req, res) => {
  const queueCards = queues
    .map(
      (item, index) => `
        <div class="queue-card">
          <div class="queue-top">
            <div>
              <h3>${item.customer}</h3>
              <p class="muted">${item.service}</p>
            </div>

            <span class="status ${getStatusClass(index)}">
              ${getStatusText(index)}
            </span>
          </div>

          <div class="metrics">
            <div>
              <span>Position</span>
              <strong>#${index + 1}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>${item.status}</strong>
            </div>
          </div>
        </div>
      `
    )
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <title>QueueWise</title>

      <link rel="stylesheet" href="/styles.css">
    </head>

    <body>

      <header class="hero">
        <div class="container">

          <p class="eyebrow">Smart Queue Management</p>

          <h1>QueueWise</h1>

          <p class="tagline">
            Manage queues. Reduce waiting. Serve better.
          </p>

          <p class="intro">
            A simple queue management system for adding customers,
            monitoring waiting positions and tracking service status.
          </p>

        </div>
      </header>


      <main class="container">

        <div class="main-grid">

          <!-- Queue Section -->
          <section class="panel">

            <div class="section-heading">

              <div>
                <h2>Current Queue</h2>
                <p class="muted">
                  Customers currently waiting for service
                </p>
              </div>

              <a class="api-link" href="/api/queues">
                View API
              </a>

            </div>

            ${
              queueCards
                ? `<div class="queue-list">${queueCards}</div>`
                : `
                  <div class="empty-state">
                    No customers are currently in the queue.
                  </div>
                `
            }

          </section>


          <!-- Add Customer Section -->
          <section class="panel form-panel">

            <h2>Add Customer</h2>

            <p class="muted">
              Add a new customer to the queue.
            </p>

            <form method="POST" action="/add">

              <label for="customer">
                Customer Name <span>*</span>
              </label>

              <input
                id="customer"
                type="text"
                name="customer"
                placeholder="Enter customer name"
                required
              >

              <label for="service">
                Service Type <span>*</span>
              </label>

              <input
                id="service"
                type="text"
                name="service"
                placeholder="Enter service type"
                required
              >

              <button type="submit">
                Add to Queue
              </button>

            </form>

            <p class="form-note">
              Required fields must be completed before adding a customer.
            </p>

          </section>

        </div>

      </main>


      <footer class="footer">

        <div class="container footer-inner">

          <span>
            QueueWise — Smart Queue Management
          </span>

          <span>
            Git Commit:
            <code>${commitId}</code>
          </span>

        </div>

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
    return res
      .status(400)
      .send('Customer name and service are required.');
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
