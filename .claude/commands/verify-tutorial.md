---
description: Start a FIWARE tutorial's Docker services and validate every numbered cURL request in its README against the documented response payload. Reports pass/fail per request and highlights structural or value mismatches.
model: claude-haiku-4-5-20251001
allowed-tools:
  - Bash
  - Read
---

Walk through the FIWARE tutorial at `$ARGUMENTS` by starting its services, executing every numbered cURL request from the README, and verifying each response against the documented payload.

## Helper scripts

Three Python 3 scripts in `.claude/scripts/` handle all execution and comparison logic. Use them as described — do not reimplement their behaviour inline.

| Script | Purpose |
|---|---|
| `parse_readme.py` | Extract all numbered request blocks from a README → JSON array |
| `compare_json.py` | Compare actual vs expected JSON, ignoring dynamic fields |
| `run_requests.py` | **Execute all requests and return a full JSON report** |

`run_requests.py` imports the other two; it is the primary tool for verification.

## Step 1 — Resolve paths

`$ARGUMENTS` may be a bare directory name (`tutorials.Getting-Started`), a submodule-relative path (`NGSI-v2/tutorials.Getting-Started`), or an absolute path. Normalise to absolute.

```
TUTORIAL_DIR=<resolved absolute path>
README=$TUTORIAL_DIR/README.md
SCRIPTS=/Users/jasonfox/Workspace/Step-by-Step/.claude/scripts
```

Confirm both `README.md` and `services` exist in `$TUTORIAL_DIR`; if not, report and stop.

## Step 2 — Start services

Always stop everything before starting, regardless of what is currently running. Other tutorials' containers bind the same ports and will silently produce wrong results.

### 2a — ARM64 image pre-pull (Apple Silicon only)

Check whether `docker-compose.yml` references any ARM64-incompatible FIWARE images:

```bash
grep -E 'image:\s*(quay\.io/fiware/(tutorials\.context-provider|orion))' "$TUTORIAL_DIR/docker-compose.yml"
```

If any matches are found, pre-pull each with an explicit platform flag, e.g.:

```bash
docker pull --platform linux/amd64 quay.io/fiware/tutorials.context-provider
docker pull --platform linux/amd64 quay.io/fiware/orion
```

**Do NOT set `DOCKER_DEFAULT_PLATFORM=linux/amd64` globally.** This clashes with
MongoDB and other images that have a native ARM64 manifest already cached, causing
Docker to refuse the cached image.

### 2b — Stop then start

```bash
cd "$TUTORIAL_DIR" && bash services stop
cd "$TUTORIAL_DIR" && bash services start
```

Run each as a separate command to guarantee the working directory is correct. Do not
combine into a single `&&` chain across two bash invocations.

### 2c — Health check

Poll until the broker is ready (up to 90 s):

```bash
for i in $(seq 1 18); do
  curl -sf http://localhost:1026/version && echo && break
  echo "Waiting… ($i/18)"; sleep 5
done
```

Report the broker version on success. If the loop exhausts without a response, stop — do not execute requests against an unhealthy broker.

If `services start` fails with "no matching manifest for linux/arm64", return to step 2a and pre-pull the failing image.

## Step 3 — Run all requests

```bash
cd "$TUTORIAL_DIR" && python3 "$SCRIPTS/run_requests.py" README.md
```

Capture the output. If the script exits 2, report the fatal error and stop. Exit 1 means some requests failed — the JSON report is still complete and must be processed.

The script automatically handles:
- Stripping `-i`/`-iX` flags (which mix HTTP headers into the response body)
- **Hardcoded ObjectIds** in URLs → marks **N/A** (illustrative examples; ID won't exist on a fresh broker)
- **Random-data endpoints** (`/random/` in the URL) → structure-only comparison (keys and types verified; scalar values vary)
- Ignoring known dynamic fields (`uptime`, `version`, `createdAt`, `modifiedAt`, etc.) and database-generated ObjectId values in `id` fields

## Step 4 — Report results

Print a summary table, one row per request:

```
Req  | Label                                   | Status | Notes
-----|------------------------------------------+--------|-------------------
1    | Checking the service health              | PASS   |
2    | Random Data Context Provider             | PASS   | structure verified; values vary
6    | Retrieve entity by id                    | FAIL   | "location.value" differs …
10   | Read a registered Context Provider       | N/A    | hardcoded database ID
```

Status values:
- **PASS** — response matched (or structure matched for random endpoints)
- **FAIL** — mismatch; show each entry from `mismatches` with path, expected, actual
- **N/A** — skipped (hardcoded ID not present on fresh broker)
- **INFO** — no documented response to compare; show first 200 chars of actual

After the table, print a detailed failure section quoting the `mismatches` array for every FAIL, and the final counts: `N PASS · N FAIL · N N/A · N INFO`.

### Handling FAILs

Before proposing a README fix for any FAIL, check whether the mismatch is a **known false positive** (see below). Only propose fixes when the actual broker response confirms the docs are wrong.

### Known false positives — do not file as documentation bugs

- **Context-provider forwarded attributes**: if the tutorial registers a random-data context provider for an attribute (e.g. `relativeHumidity`), subsequent entity GET requests that return that attribute will show a random value. The URL does not contain `/random/`, so the script cannot auto-detect this. Report the mismatch as **WARN** in your notes, not FAIL, and do not propose a fix.

- **Subscription / registration IDs in response bodies**: ObjectIds in `id` fields are auto-ignored by `compare_json.py`. If a FAIL still appears on an `id` path that looks like a 24-char hex value, treat it as a known false positive.

## Step 5 — Clean up (optional)

After the report, ask: "Stop Docker services now? (y/N)". If the user answers `y`, run `bash services stop` from `$TUTORIAL_DIR`.
