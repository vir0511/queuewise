# QueueWise Viva Cheat Sheet

## 1. What is the difference between CI and CD?

**CI (Continuous Integration)** automatically validates changes when code is pushed or proposed through a pull request. In this project it installs dependencies, lints the code and runs automated tests.

**CD (Continuous Delivery/Deployment)** moves a validated version toward a deployed environment. Here, the deployment job calls the Render deploy hook after the Docker build and smoke test succeed on `main`.

## 2. What does `needs:` do in your workflow?

`needs` creates job dependencies. `build` has `needs: test`, so it cannot run when `test` fails. `deploy` has `needs: build`, so it cannot run when the Docker build/smoke test fails.

## 3. Why should a deploy URL be stored as a secret?

A deploy hook can trigger a deployment. Keeping it in `secrets.RENDER_DEPLOY_HOOK` prevents the sensitive value from being committed to the repository or exposed in normal source code.

## 4. What happens if one test fails?

The `test` job fails. Because `build` needs `test`, the build job is skipped. Because `deploy` needs `build`, deployment is also skipped. This prevents an unvalidated change from reaching Render.

## 5. How do you roll back a bad release using Git?

Identify the last known-good commit and use a normal Git-based recovery strategy, preferably reverting the bad change on `main` with `git revert <commit>` so the history remains auditable. Push the corrective commit; the normal CI/CD pipeline then validates and deploys it.

## 6. Why use Docker when the app already runs locally?

Docker packages the runtime, application files and production dependencies into a reproducible image. The same container can be tested in CI and run by Render, reducing differences between local and deployment environments.

## Workflow jobs

**test:** checkout → Node 22 → `npm ci` → lint → `npm test`.

**build:** checkout → Docker build with Git SHA → start container → call `/health` → stop container.

**deploy:** only after build, and only on a push to `main`, call the Render deploy hook.

## Dockerfile

- `node:22-alpine` keeps the runtime lightweight.
- `ARG GIT_SHA` receives the build SHA.
- `ENV GIT_SHA=$GIT_SHA` makes it available to the app.
- `npm ci --omit=dev` installs only production dependencies.
- Runtime files are copied into `/app`.
- Ownership is assigned to the built-in `node` user.
- `USER node` avoids running the application as root.
- Port 3000 is exposed.

## Health endpoint

`GET /health` returns JSON containing `status: "ok"` and the resolved commit ID. CI uses it as a real container smoke test.

## Commit ID

The application resolves the displayed ID as `RENDER_GIT_COMMIT`, then `GIT_SHA`, then `local`. This allows Render and Docker to identify the running source version without hardcoding a commit.

## Server-side rendering

EJS generates the HTML on the server. The browser receives an already rendered queue list, while user-controlled values are escaped with EJS's `<%=` syntax.

## Validation

Validation occurs on the server even though the HTML form also has basic constraints. Location must be 2–60 characters, people count 0–500, estimated wait 0–300 minutes, and description at most 300 characters.

## Status calculation

- 0–5 → Low
- 6–15 → Moderate
- 16–30 → Busy
- 31+ → Very Busy

The status is calculated after validation and before persistence; clients never submit the authoritative status.

## Tests

1. `/health` returns 200 and `ok`.
2. A valid queue POST creates a report and calculates status.
3. Invalid POST returns 400 and leaves the data store unchanged.
4. `/api/queues` returns JSON.
5. All status boundaries are checked.
6. The SSR page renders queue data and the commit footer.
