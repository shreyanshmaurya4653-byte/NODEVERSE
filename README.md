# NODEVERSE

### Distributed DAG Workflow & Automation Engine

**Design workflows visually. Execute dependencies in order. Observe every run. Recover failed tasks.**

NODEVERSE is a visual workflow automation platform built for **WEBSTER 2026 — Problem Statement 04, “The Dormammu Loop”** (**Team ID: 390**). It lets users build directed acyclic graph (DAG) workflows on a canvas, connect triggers and task nodes, validate dependencies, execute workflows, inspect node-level logs, and review or replay failures.

---

## ✨ What NODEVERSE Does

NODEVERSE brings workflow design and execution monitoring into one workspace. Instead of hard-coding every automation as a separate script, users can arrange reusable nodes, define how data moves between them, and run the workflow manually or through an event trigger.

### Core Capabilities

| Capability | What it provides |
|---|---|
| **Visual Workflow Studio** | Drag-and-drop node creation, editable node settings, dependency connections, canvas zoom/pan, auto-layout, and workflow save/load. |
| **DAG Validation** | Detects cycles and calculates a topological execution order before a workflow is saved or executed. |
| **Dependency-Aware Execution** | Executes nodes in topological order, passes outputs downstream, and skips nodes whose prerequisites fail or whose condition branch is not selected. |
| **Multiple Trigger Modes** | Manual runs, inbound HTTP webhooks, and cron-based schedules. |
| **Execution Telemetry** | Run and node statuses, inputs/outputs, attempt counts, timestamps, durations, and execution logs. |
| **Live Run Updates** | Server-Sent Events (SSE) stream node and run status changes to the browser while a run is in progress. |
| **Retry and Failure Recovery** | Configurable node-level retry limits, exponential backoff with jitter, and a Dead-Letter Queue (DLQ) for exhausted failures. |
| **Queued Execution** | Redis + BullMQ separates queued workflow runs from the HTTP request path when Redis is available. |
| **Workflow Templates** | Starter workflows for common automation patterns, including order routing, monitoring, and data-ingestion flows. |
| **Webhook Hub** | Inspect inbound webhook endpoints and send test payloads to webhook-triggered workflows. |

---

## 🧩 Available Node Types

| Node | Purpose |
|---|---|
| **Trigger** | Starts a workflow using manual, webhook, or cron configuration. Trigger payloads become the initial workflow input. |
| **HTTP Request** | Calls a configured HTTP endpoint with a method, URL, headers, and optional body. JSON responses are parsed when possible. Supports `{{input.field}}`-style value interpolation in configured strings. |
| **Transform** | Evaluates a JavaScript expression against the current input and returns the transformed value. |
| **Condition** | Evaluates a JavaScript condition and routes execution through the `true` or `false` output handle. |
| **Delay / Sleep** | Pauses a node for a configured duration. The executor currently bounds the delay to 50 ms–30 s. |
| **Web Scraper** | Fetches a page and extracts basic HTML information such as its title, meta description, headings, and absolute links. This is lightweight extraction, not a full browser automation engine. |
| **Outbound Notification** | Builds a notification message and can POST it to a configured webhook endpoint. If no endpoint is configured, it returns a notification result without sending to an external service. |
| **App Connector** | Provides configurable HTTP-based presets for services such as OpenAI, Discord, Slack, GitHub, Stripe, Google Sheets, Shopify, Telegram, email/Resend, and Supabase/PostgreSQL. These presets use the generic HTTP executor; they are not separate OAuth or provider-SDK integrations. |

### How execution works

1. **Design** the workflow by adding nodes and connecting their dependencies.
2. **Validate** the graph. Cycles are rejected and a topological order is calculated.
3. **Trigger** a run manually, through an inbound webhook, or through a cron schedule.
4. **Execute** eligible nodes in dependency order. A condition can prune an unselected branch; failed or skipped prerequisites prevent downstream execution.
5. **Observe** node states, outputs, timestamps, attempts, and logs through the run history and live SSE stream.
6. **Recover** exhausted node failures from the Dead-Letter Queue by replaying or discarding a dead-letter record.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    Browser[React + React Flow UI]
    API[Express REST API]
    DB[(PostgreSQL)]
    Redis[(Redis + BullMQ)]
    Worker[Workflow Executor]
    Cron[node-cron Scheduler]
    External[External Webhook Sender]
    SSE[SSE Run Stream]

    Browser <-->|REST / JSON| API
    API <--> DB
    API -->|enqueue run| Redis
    Redis --> Worker
    Worker <--> DB
    Cron -->|create scheduled run| DB
    Cron -->|enqueue scheduled job| Redis
    External -->|POST /webhooks/:workflowId| API
    Worker -->|run and node events| SSE
    SSE --> Browser
```

### Execution and storage model

The diagram shows logical components. In the current source, Express, the BullMQ worker, and the cron scheduler are initialized by the same Node.js server process; a separately deployed worker service would be a future step for independent process-level scaling.

- **Client:** React, Vite, React Router, React Flow, and Lucide icons.
- **API:** Node.js and Express handle workflow CRUD, validation, trigger requests, run history, statistics, webhook ingress, and dead-letter operations.
- **Persistence:** PostgreSQL stores workflow definitions, workflow runs, node runs, and dead-letter records.
- **Queue:** BullMQ uses Redis to process queued workflow runs. The worker is configured for a concurrency of five queued jobs.
- **Scheduler:** `node-cron` registers active cron workflows when the server starts and updates schedules when workflows are edited or activated/deactivated.
- **Live updates:** Server-Sent Events publish run and node updates to the browser.
- **Fallback mode:** If PostgreSQL is unavailable, the server falls back to in-memory storage. If Redis is unavailable, runs are dispatched asynchronously in-process instead of through BullMQ. In-memory data is not durable and is lost when the server restarts.

> **Execution detail:** Nodes within one workflow run currently execute sequentially in topological order. BullMQ concurrency applies to queued workflow jobs; it does not mean independent nodes inside a single DAG run concurrently.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, React Flow 11, Lucide React |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Queue and workers | Redis, BullMQ, ioredis |
| Scheduling | node-cron |
| Live events | Server-Sent Events (SSE) |
| Development environment | Docker, Docker Compose, npm |

---

## 🚀 Run Locally

### Prerequisites

- Node.js **20 or newer** and npm
- Docker Engine with the Docker Compose plugin (for the PostgreSQL and Redis services)

### 1. Create the server environment file

Create `server/.env` with the following **local-development-only** settings:

```dotenv
PORT=4000
DATABASE_URL=postgresql://nodeverse:nodeverse_secret@localhost:5432/nodeverse
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

These database settings match the development defaults in `docker-compose.yml`. Do not reuse the development password in a deployed environment, and do not commit your real `.env` file to GitHub.

### 2. Install dependencies

Run these commands from the repository root:

```bash
npm install
npm run install:all
```

The root install provides the `concurrently` command; `install:all` installs the client and server dependencies.

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

Wait until both containers are healthy before starting the application.

### 4. Start the client and API

```bash
npm run dev
```

The root development command starts the Express server and Vite client together.

### 5. Open NODEVERSE

| Workspace | URL |
|---|---|
| Landing page | http://localhost:5173/ |
| Workflow catalog | http://localhost:5173/workflows |
| Create a workflow | http://localhost:5173/editor/new |
| Execution history | http://localhost:5173/runs |
| Webhook Hub | http://localhost:5173/webhooks |
| Dead-Letter Queue | http://localhost:5173/dead-letters |
| Template gallery | http://localhost:5173/templates |
| API health check | http://localhost:4000/health |

If PostgreSQL or Redis is not available, the backend can fall back to in-memory storage and inline execution. That is useful for a quick local preview, but it should not be mistaken for durable operation.

### Docker Compose note

The repository includes Dockerfiles and a Compose definition for the client, server, PostgreSQL, and Redis. In the current source snapshot, the Vite proxy points at `127.0.0.1:4000`, which is correct when the client is running on the host but not from inside the separate client container. The client API helper also uses relative `/api` URLs rather than the `VITE_API_URL` variable. For that reason, the local-development steps above start only PostgreSQL and Redis through Compose and run the client/server on the host. Before relying on a full all-container launch, update the client proxy target to reach the Compose service at `http://server:4000`.

---

## 🔌 API Reference

The API listens on port `4000` by default.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Health check and service metadata. |
| `GET` | `/api/stats` | Workflow, run, and DLQ statistics. |
| `GET` | `/api/workflows` | List workflows. |
| `POST` | `/api/workflows` | Create a workflow. |
| `GET` | `/api/workflows/:id` | Fetch a workflow. |
| `PUT` | `/api/workflows/:id` | Update a workflow. |
| `PATCH` | `/api/workflows/:id/toggle` | Activate or pause a workflow. |
| `POST` | `/api/workflows/:id/duplicate` | Duplicate a workflow. |
| `DELETE` | `/api/workflows/:id` | Delete a workflow. |
| `POST` | `/api/workflows/validate` | Validate a graph and return its topological order. |
| `POST` | `/api/workflows/:id/trigger` | Start a manual run. |
| `POST` | `/webhooks/:workflowId` | Start an active webhook-triggered workflow. |
| `GET` | `/api/runs` | List runs; optional `workflowId`, `limit`, and `offset` query parameters are supported by the API. |
| `GET` | `/api/runs/:id` | Fetch a run with node-run details. |
| `GET` | `/api/runs/:id/node-runs` | Fetch node-level execution records. |
| `GET` | `/api/runs/:id/stream` | Subscribe to live run updates using SSE. |
| `POST` | `/api/runs/:id/cancel` | Mark a run as cancelled in run history. |
| `GET` | `/api/dead-letters` | List dead-letter records; optional `replayState` filter. |
| `POST` | `/api/dead-letters/:id/replay` | Create a new run using the dead-letter payload. |
| `POST` | `/api/dead-letters/:id/discard` | Mark a dead-letter record as discarded. |

### Trigger a workflow manually

Replace `<WORKFLOW_ID>` with the ID of a saved workflow:

```bash
curl -X POST http://localhost:4000/api/workflows/<WORKFLOW_ID>/trigger \
  -H "Content-Type: application/json" \
  -d '{"input":{"orderId":"ORD-1001","amount":249.50}}'
```

### Send a webhook payload

The selected workflow must be active and configured with `trigger_type: "webhook"`:

```bash
curl -X POST http://localhost:4000/webhooks/<WORKFLOW_ID> \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-1001","amount":249.50}'
```

Both endpoints return an accepted run response; execution continues asynchronously.

---

## 🧪 Tests and Build

Run the included server smoke test:

```bash
npm test --prefix server
```

Build the frontend for production:

```bash
npm run build --prefix client
```

The current server test script checks database-store initialization, basic statistics/workflow access, DAG analysis for acyclic and cyclic graphs, dead-letter listing, and run creation. It is a lightweight smoke test, not a complete end-to-end suite for external HTTP calls, queue recovery, or browser interactions.

---

## 📁 Project Structure

```text
NODEVERSE/
├── client/
│   ├── src/
│   │   ├── components/       # Navigation and custom React Flow nodes
│   │   ├── pages/            # Landing, studio, workflows, runs, DLQ, webhooks, templates
│   │   ├── api/               # Client-side API requests and SSE connection
│   │   ├── App.jsx            # Client routes
│   │   └── index.css          # Application styling
│   ├── Dockerfile
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/            # Workflow, run, stats, webhook, and DLQ APIs
│   │   ├── db.js              # PostgreSQL schema and in-memory fallback store
│   │   ├── executor.js        # DAG analysis, node handlers, retries, run engine
│   │   ├── queue.js            # BullMQ queue and worker
│   │   ├── scheduler.js        # Cron scheduling
│   │   ├── sse.js              # Live event publisher
│   │   └── index.js            # Express application entry point
│   ├── test-unit.js            # Server smoke test
│   ├── Dockerfile
│   └── package.json
├── legacy-prototype/           # Earlier static HTML/CSS/JS prototype
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 🔐 Security and Implementation Notes

- **Local/demo project:** The API currently has no authentication or authorization layer. Do not expose it directly to the public internet as-is.
- **JavaScript expressions:** Transform and condition expressions are evaluated with `new Function`; they are not a hardened sandbox. Only run workflows authored by trusted users.
- **Retries:** Retry/backoff is implemented at the node level. The BullMQ queue itself is configured for one queue attempt; exhausted node failures are recorded in the DLQ.
- **Integration presets:** App connector presets use the generic HTTP executor. Supply suitable endpoints and credentials yourself, and avoid placing real secrets in workflow definitions shared with others.
- **Idempotency and worker heartbeats:** The abstract describes these as part of the intended resilience design, but explicit idempotency guards and worker-heartbeat recovery are not implemented in the current source snapshot.
- **Environment and dependencies:** Keep `.env` files, `node_modules/`, and generated build outputs out of Git history unless there is a specific reason to track them. Use a `.gitignore` before pushing the repository.

---

## 🎯 Project Context

**Event:** WEBSTER 2026 — Code Sangam 2026  
**Problem Statement:** 04 — The Dormammu Loop  
**Project / Website Name:** NODEVERSE  
**Team ID:** 390

NODEVERSE explores how visual workflow design, deterministic DAG execution, queued task processing, operational telemetry, and retry-based recovery can work together in a single automation platform.
