# QueueWise – Smart Campus Queue Monitor

QueueWise is a dynamic, server-rendered web application for the CSE30040 Cloud Computing and DevOps CCA 2 individual submission. Students can report and monitor current queue conditions at campus facilities such as the canteen, library, administration office and labs.

## 1. Problem statement

Campus queues change throughout the day, but students often have no simple shared view of current waiting conditions. QueueWise provides a small, reproducible system where students can submit a queue observation and immediately see the server-calculated queue status.

## 2. Objectives

- Build a dynamic server-rendered application using Express and EJS.
- Store application data in a simple JSON file without a database.
- Validate all user input on the server.
- Expose a JSON API and health endpoint.
- Package the application in a non-root Alpine Docker container.
- Validate the project through automated tests and ESLint.
- Deliver the application through GitHub Actions and a Render deploy hook.

## 3. Features

- SSR home page at `GET /`.
- Queue report form at `POST /queues`.
- Server-side validation and useful HTTP 400 responses.
- Automatic status calculation: 0–5 Low, 6–15 Moderate, 16–30 Busy, 31+ Very Busy.
- JSON API at `GET /api/queues`.
- Health endpoint at `GET /health`.
- Dynamic running commit footer using `RENDER_GIT_COMMIT`, then `GIT_SHA`, then `local`.
- JSON-file persistence with atomic temporary-file replacement.
- HTML escaping through EJS escaped output tags.
- Node.js built-in test runner and ESLint.
- Docker and GitHub Actions CI/CD.

## 4. Technology stack

| Area | Technology |
|---|---|
| Runtime | Node.js 22 LTS-compatible |
| Server | Express 5 |
| SSR | EJS |
| Tests | Node.js `node:test` + `assert/strict` |
| Linting | ESLint 9 |
| Persistence | JSON file |
| Container | Docker + Node 22 Alpine |
| CI/CD | GitHub Actions |
| Deployment | Render |

No React, Next.js, database, Firebase or external API is required.

## 5. Architecture

```text
Browser
   |
   | GET / or POST /queues
   v
Express application
   |
   +--> Validation
   |
   +--> Status calculation
   |
   +--> JSON file persistence
   |
   +--> EJS SSR
   |
   +--> /api/queues
   |
   +--> /health
   |
   v
Docker container
   |
   v
Render
```

### CI/CD pipeline

```text
Developer
   |
Git Branch
   |
Pull Request
   v
GitHub Actions
   |
   +--> Lint
   |
   +--> Tests
   |
   v
Docker Build
   |
Container /health smoke test
   |
Merge to main
   |
Render Deploy Hook
   |
Live Application
```

## 6. Folder structure

```text
queuewise/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── data/
│   └── queues.json
├── public/
│   └── styles.css
├── test/
│   └── app.test.js
├── views/
│   └── index.ejs
├── docs/
│   ├── ARCHITECTURE.md
│   ├── REPORT_OUTLINE.md
│   └── VIVA_CHEATSHEET.md
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── eslint.config.js
├── package.json
├── package-lock.json
├── app.js
├── server.js
├── README.md
└── render.yaml
```

## 7. Prerequisites

- Node.js 22.x
- npm 10+
- Git
- Docker Desktop for local container validation
- GitHub account/repository
- Render account for deployment

## 8. Local installation from a fresh clone

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd queuewise
npm ci
```

Copy `.env.example` to `.env` only if you need local environment settings. `.env` is ignored by Git.

## 9. Running locally

```bash
npm start
```

Open `http://localhost:3000`.

The application listens on `process.env.PORT || 3000`.

## 10. Testing

The tests use temporary directories and do not modify `data/queues.json`.

```bash
npm test
```

The suite covers health, valid creation, invalid creation, JSON API, status thresholds and SSR commit rendering.

## 11. Linting

```bash
npm run lint
```

The command must finish with zero errors.

## 12. API documentation

### `GET /api/queues`

Returns the current queue array as JSON.

### `POST /queues`

Form fields:

- `location`: required string, 2–60 characters.
- `peopleCount`: required integer, 0–500.
- `estimatedWait`: required integer, 0–300 minutes.
- `description`: optional, maximum 300 characters.

For an HTML form submission, a valid request redirects to `/?added=1`. For a JSON request, a valid request returns HTTP 201 and the created object. Invalid requests return HTTP 400 and a JSON error when the request asks for JSON.

### `GET /health`

Returns:

```json
{
  "status": "ok",
  "commit": "..."
}
```

## 13. Docker build and run

Build with the required build argument:

```bash
docker build --build-arg GIT_SHA=local -t queuewise .
```

Or with a real Git SHA:

```bash
docker build --build-arg GIT_SHA=$(git rev-parse HEAD) -t queuewise .
```

Run:

```bash
docker run --rm -p 3000:3000 queuewise
```

Verify:

```bash
curl http://localhost:3000/health
```

The image uses Node 22 Alpine, installs production dependencies with `npm ci --omit=dev`, copies only runtime files, exposes port 3000, and runs as the non-root `node` user.

## 14. Git branching strategy

Use `main` as the protected integration branch. Create feature branches such as:

```bash
git switch -c feature/queue-report-form
```

Open a pull request into `main`. CI runs on both pull requests and pushes to `main`.

### Recommended 10+ meaningful commits

These are examples only. The student's actual history must correspond to the work actually performed:

1. `chore: initialize Node.js project`
2. `feat: add Express server and SSR homepage`
3. `feat: add queue report form`
4. `feat: add server-side validation`
5. `feat: add queue status calculation`
6. `feat: add JSON API and health endpoint`
7. `feat: add commit ID footer`
8. `test: add application endpoint tests`
9. `chore: configure ESLint`
10. `build: add production Dockerfile`
11. `ci: add GitHub Actions test pipeline`
12. `ci: add Docker smoke test`
13. `cd: add Render deployment hook`
14. `docs: complete README and viva documentation`

## 15. Pull request workflow

```bash
git switch -c feature/my-change
# edit files
git status
git add .
git commit -m "feat: describe the change"
git push -u origin feature/my-change
```

Create the PR in GitHub, wait for the `test` and `build` jobs to pass, review the changes, and merge into `main`.

After merging:

```bash
git switch main
git pull origin main
```

## 16. GitHub Actions explanation

The workflow is named `CCA2 CI/CD` and runs for pull requests to `main` and pushes to `main`.

**Job 1 – test:** checkout, Node 22 setup, `npm ci`, `npm run lint`, and `npm test`.

**Job 2 – build:** runs only after `test`; builds the Docker image using `${{ github.sha }}`, starts the image, and calls `/health` with `curl`.

**Job 3 – deploy:** runs only after `build`, and only for a push to `main`. It calls the Render deploy hook using the GitHub secret `RENDER_DEPLOY_HOOK`.

Because `build` needs `test`, a failed test prevents the Docker build and therefore prevents deployment. Because `deploy` needs `build`, a failed smoke test also prevents deployment.

## 17. Render setup

1. Push the repository to GitHub.
2. In Render, create a new Web Service from the GitHub repository.
3. Select Docker as the runtime and use the repository `Dockerfile`.
4. Set the service health check path to `/health` if it is not detected from `render.yaml`.
5. Disable Render Auto-Deploy. GitHub Actions is responsible for triggering deployment.
6. Create a Render deploy hook for the service.
7. Copy the deploy-hook value into GitHub Actions secrets as `RENDER_DEPLOY_HOOK`.
8. Do not put the real hook or live URL in source code.

`render.yaml` is intentionally free of personal repository URLs and secrets.

## 18. GitHub Secret setup

Repository → Settings → Secrets and variables → Actions → New repository secret.

Name:

```text
RENDER_DEPLOY_HOOK
```

Value: paste the actual Render deploy-hook URL generated by your Render service.

The value is never stored in this repository.

## 19. Failure demonstration

Use a feature branch:

```bash
git switch -c demo/failing-ci
```

Temporarily break a test, for example change an expected status from `Busy` to `Low`. Then:

```bash
git add test/app.test.js
git commit -m "test: demonstrate failing CI"
git push -u origin demo/failing-ci
```

Open a Pull Request to `main`.

Demonstrate that:

1. The `test` job fails.
2. The `build` job is skipped because it needs `test`.
3. The `deploy` job does not execute.
4. Capture a screenshot of the failed test and skipped downstream jobs.

Fix the test:

```bash
git add test/app.test.js
git commit -m "test: restore expected status assertion"
git push
```

After CI succeeds, merge the PR. The resulting push to `main` runs the successful pipeline and invokes the Render deploy hook.

## 20. Successful deployment demonstration

Capture screenshots showing:

- passing `test` job;
- successful Docker build and `/health` smoke test;
- successful `deploy` job on a push to `main`;
- live QueueWise page;
- live `/health` response;
- footer showing the deployed commit SHA.

Do not invent URLs. Add your actual GitHub and Render links to the report only after they exist.

## 21. Commit ID mechanism

The footer uses:

```text
RENDER_GIT_COMMIT -> GIT_SHA -> local
```

The Docker build supplies `GIT_SHA` from `${{ github.sha }}`. Render can expose `RENDER_GIT_COMMIT`. No real commit ID is hardcoded in the application.

## 22. Troubleshooting

**Port already in use:** use another port locally, for example `PORT=3001 npm start` on shells that support that syntax, or set `PORT` through your environment before running Node.

**Data file error:** check that the process can write to `data/`. The application creates the directory/file when missing.

**Invalid JSON data:** restore `data/queues.json` to a valid JSON array. The server deliberately refuses malformed data instead of silently replacing it.

**Docker unavailable:** install/start Docker Desktop. The project can still be linted and tested without Docker.

**Render deployment does not start:** verify Auto-Deploy is off, the secret name is exactly `RENDER_DEPLOY_HOOK`, and the deploy hook value is current.

## 23. Viva preparation

See `docs/VIVA_CHEATSHEET.md` for the six required questions and project-specific explanations.

## 24. Screenshots checklist

- [ ] Home page with queue cards
- [ ] Add queue report form
- [ ] Successful report submission
- [ ] Validation error
- [ ] `/api/queues`
- [ ] `/health`
- [ ] Local terminal showing tests passing
- [ ] Local terminal showing lint passing
- [ ] GitHub Actions successful pipeline
- [ ] Failure-demo pipeline
- [ ] Docker build and smoke test
- [ ] Render service/live page
- [ ] Running commit footer

## 25. CCA 2 final submission checklist

- [ ] GitHub repository is available.
- [ ] `main` contains the final working version.
- [ ] Meaningful commit history is visible.
- [ ] Pull request workflow is demonstrated.
- [ ] `npm ci` works from a fresh clone.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] Docker image builds.
- [ ] Docker container responds to `/health`.
- [ ] Render Auto-Deploy is off.
- [ ] GitHub secret is exactly `RENDER_DEPLOY_HOOK`.
- [ ] Render deploy is triggered only from the `main` push workflow.
- [ ] Report contains actual repository, live app and Actions links.
- [ ] Failure demonstration screenshot is included.
- [ ] Success demonstration screenshot is included.

## 26. Verification status for this delivered project

The following local checks were actually executed while preparing this project: Node.js version check, dependency installation/lockfile generation, `npm test`, and `npm run lint`.

Docker could not be executed in the current build environment because Docker is not installed there. GitHub Actions and Render cannot be executed from this environment because they require the student's external accounts/repository. Therefore those external deployment stages are documented but not claimed as locally verified.

## Verification note for the supplied project archive

The source code, configuration, tests, Dockerfile and CI/CD definitions were statically reviewed in the build environment used to prepare this archive. The environment used for archive preparation does not have access to the public npm registry or Docker daemon, so a genuine npm lockfile could not be generated here and Docker/GitHub/Render execution could not be claimed as locally verified. On a normal development machine, run `npm install` once to generate the genuine `package-lock.json`, then use `npm ci` for reproducible installs as required by the CCA 2 workflow.
Assessment Version: QueueWise CCA 2
