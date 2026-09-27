const express = require('express');
const path = require('node:path');
const fs = require('node:fs/promises');

const DEFAULT_DATA_FILE = path.join(__dirname, 'data', 'queues.json');

function getDataFile() {
  return process.env.QUEUE_DATA_FILE || DEFAULT_DATA_FILE;
}

function getCommitId() {
  return process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA || 'local';
}

function calculateStatus(peopleCount) {
  if (peopleCount <= 5) return 'Low';
  if (peopleCount <= 15) return 'Moderate';
  if (peopleCount <= 30) return 'Busy';
  return 'Very Busy';
}

async function ensureDataFile(filePath = getDataFile()) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]\n', 'utf8');
  }
}

async function readQueues(filePath = getDataFile()) {
  await ensureDataFile(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Queue data must be an array.');
    return data;
  } catch {
    throw new Error('Queue data file contains invalid JSON.');
  }
}

async function writeQueues(queues, filePath = getDataFile()) {
  await ensureDataFile(filePath);
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(queues, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, filePath);
}

function parseInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function validateQueueInput(body) {
  const errors = [];
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const peopleCount = parseInteger(body.peopleCount);
  const estimatedWait = parseInteger(body.estimatedWait);
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!location) errors.push('Location is required.');
  else if (location.length < 2 || location.length > 60) errors.push('Location must be 2–60 characters.');

  if (peopleCount === null) errors.push('People count must be a whole number.');
  else if (peopleCount < 0 || peopleCount > 500) errors.push('People count must be between 0 and 500.');

  if (estimatedWait === null) errors.push('Estimated wait must be a whole number.');
  else if (estimatedWait < 0 || estimatedWait > 300) errors.push('Estimated wait must be between 0 and 300 minutes.');

  if (description.length > 300) errors.push('Description must be 300 characters or fewer.');

  return {
    valid: errors.length === 0,
    errors,
    value: {
      location,
      peopleCount,
      estimatedWait,
      description
    }
  };
}

function nextId(queues) {
  return queues.reduce((max, queue) => Math.max(max, Number(queue.id) || 0), 0) + 1;
}

function isJsonRequest(req) {
  return req.is('application/json') || req.get('Accept')?.includes('application/json');
}

function createApp(options = {}) {
  const app = express();
  const dataFile = options.dataFile || getDataFile();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', commit: getCommitId() });
  });

  app.get('/api/queues', async (req, res, next) => {
    try {
      const queues = await readQueues(dataFile);
      res.json(queues);
    } catch (error) {
      next(error);
    }
  });

  app.get('/', async (req, res, next) => {
    try {
      const queues = await readQueues(dataFile);
      res.render('index', {
        queues,
        commit: getCommitId(),
        form: { location: '', peopleCount: '', estimatedWait: '', description: '' },
        errors: [],
        success: req.query.added === '1'
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/queues', async (req, res, next) => {
    const validation = validateQueueInput(req.body);
    if (!validation.valid) {
      if (isJsonRequest(req)) return res.status(400).json({ error: validation.errors.join(' ') });
      try {
        const queues = await readQueues(dataFile);
        return res.status(400).render('index', {
          queues,
          commit: getCommitId(),
          form: req.body,
          errors: validation.errors,
          success: false
        });
      } catch (error) {
        return next(error);
      }
    }

    try {
      const queues = await readQueues(dataFile);
      const queue = {
        id: nextId(queues),
        location: validation.value.location,
        peopleCount: validation.value.peopleCount,
        estimatedWait: validation.value.estimatedWait,
        description: validation.value.description,
        status: calculateStatus(validation.value.peopleCount),
        reportedAt: new Date().toISOString()
      };
      queues.push(queue);
      await writeQueues(queues, dataFile);

      if (isJsonRequest(req)) return res.status(201).json(queue);
      return res.redirect('/?added=1');
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (isJsonRequest(req)) return res.status(500).json({ error: 'Internal server error.' });
    return res.status(500).send('Internal server error.');
  });

  return app;
}

module.exports = {
  createApp,
  calculateStatus,
  validateQueueInput,
  readQueues,
  writeQueues,
  getCommitId
};
