# QueueWise Architecture

## Runtime flow

1. Browser requests `/`.
2. Express reads `data/queues.json`.
3. EJS renders the queue reports on the server.
4. A browser form submits `POST /queues`.
5. Express validates location, people count, estimated wait and description.
6. The server calculates status from people count; the client cannot supply or override it.
7. The new report receives the next unique numeric ID and an ISO timestamp.
8. Data is written through a temporary file and renamed into place.
9. The browser is redirected to the SSR home page.

## API flow

`GET /api/queues` reads the same server-side JSON data and returns it as JSON.

`GET /health` returns an operational status plus the current commit identifier.

## Persistence

The application creates `data/queues.json` when absent. A temporary file is written before replacement so a partially written JSON file is avoided during normal writes.

## Security/input handling

- Server-side validation is mandatory.
- EJS uses escaped output tags (`<%=`) for user-controlled values.
- JSON request bodies are size-limited to 10 KB.
- No `eval()` is used.
- No credentials or API keys are required.
- `.env` and private credentials are ignored by Git.

## CI/CD architecture

```text
Feature branch
    |
    v
Pull Request ----------------------------+
    |                                     |
    v                                     |
GitHub Actions                            |
    |                                     |
    +--> test: npm ci -> lint -> tests    |
    |                                     |
    +--> build: Docker -> container -> /health
              |                           |
              v                           |
         Merge to main <-----------------+
              |
              v
        deploy job
              |
              v
    Render Deploy Hook
              |
              v
       Live Docker service
```

The dependency graph is `test -> build -> deploy`. Deployment additionally requires a push event whose ref is `refs/heads/main`.
