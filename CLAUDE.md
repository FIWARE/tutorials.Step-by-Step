# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is an umbrella repository for [FIWARE](https://www.fiware.org/) Step-by-Step tutorials. It contains two git submodules:

- `NGSI-v2/` — tutorials for the NGSI-v2 interface (Smart Supermarket theme), documented at [fiware-tutorials.rtfd.io](https://fiware-tutorials.rtfd.io)
- `NGSI-LD/` — tutorials for the NGSI-LD interface (Smart Farm theme), documented at [ngsi-ld-tutorials.rtfd.io](https://ngsi-ld-tutorials.rtfd.io)

Each submodule is an independent git repository with its own dependencies, tutorials, and Docker configuration. Most content changes happen within the submodules, not in the root repo.

## Submodule Setup

After cloning, initialize submodules:

```console
git submodule update --init --recursive
```

To pull the latest upstream changes into the submodules:

```console
git submodule update --recursive --remote
```

## Linting and Formatting

Each submodule has its own `package.json`. Run these from within the relevant submodule directory (`NGSI-v2/` or `NGSI-LD/`):

```console
npm install
npm run lint:text        # textlint for prose (typos, grammar, dead links)
npm run lint:md          # remark for Markdown structure
npm run prettier:text    # auto-format Markdown files
npm run prettier         # auto-format JS files (NGSI-v2 only)
```

**Always run these tools before submitting changes:**
- For **CODE** changes: `npm run prettier && npm run lint`
- For **Markdown** changes (English only): `npm run prettier:text && npm run lint:text`

> [!IMPORTANT]
> **Never run Prettier on Japanese markdown files (`*.ja.md`)**. Prettier's default behavior can break Japanese character spacing and line wrapping, making the text unreadable.

For the context-provider app (NGSI-v2 only):

```console
npm install -C ./NGSI-v2/context-provider
npm test -C ./NGSI-v2/context-provider   # runs ESLint
```

## Architecture

### Tutorial Structure

Each tutorial lives in its own subdirectory (e.g., `NGSI-v2/tutorials.Getting.Started/`) and contains:
- `README.md` — the primary tutorial document with numbered cURL examples
- `services` — a bash script to start/stop Docker services for the tutorial
- `docs/*.md` — ReadTheDocs-formatted version of the same content (without Prerequisites section, using plain text numbers instead of emoji numbers)

### NGSI-v2 Components

#### Context Provider (`NGSI-v2/context-provider/`)
A Node.js/Express application (port 3000) that serves as the primary runtime for the "Smart Supermarket" tutorials. It acts as a multi-purpose component:
- **IoT Simulator**: Mimics various Ultralight 2.0 devices (sensors/actuators).
- **Web UI**: Provides a front-end to visualize the state of the supermarket.
- **Context Provider**: Exposes legacy HTTP endpoints for Orion to query.
Key directories: `controllers/`, `routes/`, `models/`, `views/` (Pug), `public/`.

### NGSI-LD Components

#### Tutorial Web App (`NGSI-LD/app/`)
The primary front-end for the "Smart Farm" tutorials (port 3000). It functions as:
- **Web Interface**: Visualizes the farm state and historical data using Pug templates.
- **NGSI-LD Proxy**: Interacts with the Context Broker using JSON-LD.
- **Context Provider**: Serves static/random data (e.g., weather) via NGSI-LD endpoints.

#### IoT Device Simulator (`NGSI-LD/iot-devices/`)
A dedicated service (port 3001) that simulates the "Smart Farm" IoT hardware.
- **Multi-Protocol**: Supports measurements over HTTP and MQTT.
- **Payload Formats**: Supports Ultralight 2.0, JSON, and XML formats.
- **Simulated Devices**: Manages state for motion sensors, tractors, sprinklers, and animal collars.

#### Context Forwarder (`NGSI-LD/forwarder/`)
A lightweight proxy (port 80) used in advanced security and multitenancy tutorials.
- **Header Injection**: Automatically adds `NGSILD-Tenant` and Wallet headers.
- **VC Verification**: Integrates with W3C Verifiable Credentials for request validation.

### Docker

Each tutorial uses Docker Compose. The `services` script in each tutorial directory wraps `docker compose` commands. The Dockerfiles in `NGSI-v2/docker/` and `NGSI-LD/` build the context-provider app as a distroless production image.

Multi-platform builds (ARM64 + AMD64) are triggered via `buildx.sh` at the repo root.

## Tutorial Authoring Conventions

- **Writing style**: formal, direct verbs, no apostrophes, Chicago Manual of Style
- **ToC**: three levels only; no headings below `###`; `#### Request` and `#### Response` are the only 4th-level headings
- **cURL numbering**: emoji numbers (1️⃣, 2️⃣…) in `README.md`; plain text numbers in `docs/*.md`
- **Mandatory sections** per tutorial: _Architecture_ (with diagram), _Start Up_, and _Prerequisites_ (README only)
- **PR discipline**: raise separate PRs for code changes and documentation changes

## CI

A single GitHub Actions workflow (`.github/workflows/chron.yml`) runs weekly on Monday at 08:00 UTC to auto-update both submodules and push the result.
