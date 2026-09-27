# CCA 2 Report Outline – QueueWise

> Replace every placeholder with the student's actual information. Do not invent URLs or identifiers.

## 1. Title page

**Project:** QueueWise – Smart Campus Queue Monitor  
**Course:** Cloud Computing and DevOps  
**Course Code:** CSE30040  
**Assessment:** CCA 2 – Individual Submission  
**Name:** `<YOUR NAME>`  
**PRN:** `<YOUR PRN>`  
**Roll Number:** `<YOUR ROLL NUMBER>`  
**Academic Year:** `<YOUR ACADEMIC YEAR>`

## 2. Problem statement and features

Explain the campus queue problem, objectives and the implemented features: SSR page, queue reporting, validation, automatic status, JSON API, health endpoint, JSON persistence and commit footer.

## 3. Architecture and pipeline diagram

Use the README/ARCHITECTURE diagrams. Explain browser → Express → JSON storage/EJS and Git branch → PR → CI → Docker smoke test → main → Render.

## 4. Explanation of each pipeline stage

### Test

Checkout, Node 22, `npm ci`, ESLint and Node's built-in tests.

### Build

Build the Alpine Docker image with the Git SHA, start the container, and call `/health`.

### Deploy

Only after `build`, only for a push to `main`, call the Render deploy hook stored as `RENDER_DEPLOY_HOOK`.

## 5. Failure demonstration

Document the feature branch, intentional failing assertion, pull request, failed test job, skipped build/deploy, screenshot, correction and successful rerun.

## 6. Challenges and learning

Suggested topics to document based on actual experience:

- server-side validation;
- isolated deterministic tests;
- JSON-file persistence;
- Docker non-root execution;
- CI dependency ordering;
- deployment-secret handling;
- commit SHA propagation.

## 7. Repository link

`<ACTUAL GITHUB REPOSITORY URL>`

## 8. Live application link

`<ACTUAL RENDER LIVE URL>`

## 9. GitHub Actions link

`<ACTUAL GITHUB ACTIONS WORKFLOW URL>`

## Evidence checklist

- Home page
- Queue creation
- Validation failure
- JSON API
- Health endpoint
- Passing CI
- Failing CI
- Docker smoke test
- Render deployment
- Commit ID footer
