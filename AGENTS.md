# Instructions for the agent

Read this file at the start of every session. Keep it short and correct; update it when the project changes.

## Project
<!-- One or two sentences: what the app does and for whom. Link SPEC.md. -->
Club Events is a university event management system for students and club organizers to discover, create, and register for campus events. See `SPEC.md`.

## Commands
<!-- How to install, run, test. Keep these exact and working. -->
- Install: npm install
- Run: npm start
- Test: npm test
- Coverage: npm run coverage
- MCP server: npm run mcp

## Conventions
<!-- Folder layout, naming, where business rules live, how errors are returned to the client. -->
- Folder layout: `src/routes/` for HTTP handlers, `src/services/` for business logic, `src/db/` for SQLite queries and migrations, `mcp-server/` for MCP server.
- Naming: camelCase for variables/functions, PascalCase for classes/components, kebab-case for filenames.
- Business rules live exclusively in `src/services/`.
- Errors are returned as JSON objects with `{ error: "message" }` and appropriate HTTP status codes (400, 401, 403, 404, 409, 500).

## Layers
<!-- Fill in the file or folder for each layer. -->
Requests arrive two ways and both end in the same place:

- HTTP route handler (`src/routes/`) → service (`src/services/`) → data access (`src/db/`) → database (SQLite)
- MCP tool (`mcp-server/server.js`) → **the same service** (`src/services/`) → data access (`src/db/`) → database (SQLite)

A route handler reads the request and turns a result into a status code. A service holds the
rules and knows nothing about HTTP or about MCP. Only the data layer writes SQL. An MCP tool
that talks to the database directly is a second, unguarded way into your data: never add one.

## The model feature
<!-- Provider, env var, and the call site. -->
- The provider is named in exactly one file: `src/services/recommendation.js` using `@google/genai`.
- The key comes from an environment variable (`GEMINI_API_KEY`) and is never committed or logged.
- Every call has a timeout (3s) and a deterministic fallback, so the app still works when the provider is down or rate-limited.
- The model's output is re-checked against real data before anything is saved or shown.
- Tests never call the provider: they pass in a fake client.

## The MCP server
<!-- Where it lives and how it authenticates. -->
- Lives in `mcp-server/`, grew out of Exercise 1.
- Every tool calls a service function; none touches the data layer or the database directly.
- It carries a user, and enforces exactly the same authorization rules as the HTTP API.
- Adding a tool means adding a row to the table in `SPEC.md` too.

## Tests and coverage
- Every acceptance criterion in `SPEC.md` has an id like `AC-3`, and a test whose title contains that id.
- The coverage gate runs in CI: 100% of the service layer, 80% overall.
- A test is evidence. Changing a test so the code passes destroys the evidence.

## Always ask before
- deleting files or folders
- editing a migration that has already run
- installing or removing dependencies
- pushing, tagging or changing CI
- anything that touches secrets or `.env`
- changing an authentication or authorization rule
- adding, renaming or removing an MCP tool
- changing a coverage threshold
- sending user data to a third-party model

## Never
- commit secrets, passwords, API keys or an OAuth client secret
- weaken or delete a test to make it pass
- lower a coverage threshold or switch off a CI job to make the build green
- add an MCP tool that reaches past the service layer
- log a prompt that contains somebody's personal data
