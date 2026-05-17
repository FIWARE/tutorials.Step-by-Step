---
description: Sync a tutorial's Postman collection from its README. Parses every numbered cURL request, converts it to Postman v2.1 format (method, URL with variable substitution, headers, body), and adds missing items or flags divergent ones. Writes the updated JSON on confirmation.
model: claude-haiku-4-5-20251001
allowed-tools:
  - Read
  - Edit
  - Bash
---

Synchronise the Postman collection for the tutorial at `$ARGUMENTS`: parse every numbered cURL request from its README.md and ensure each one exists in the tutorial's `.postman_collection.json` file with the correct method, URL, headers, and body.

## Step 1 — Resolve paths

Resolve `$ARGUMENTS` to an absolute tutorial directory.

```
TUTORIAL_DIR=<resolved absolute path>
README=$TUTORIAL_DIR/README.md
```

Find the Postman collection file: `ls $TUTORIAL_DIR/*.postman_collection.json`. If multiple files exist, pick the one matching the tutorial name most closely. If none exists, report and stop — do not create one from scratch without asking first.

```
POSTMAN=$TUTORIAL_DIR/<name>.postman_collection.json
```

## Step 2 — Parse curl requests from README

Read `$README` and build an ordered list of **request blocks**. For each block extract:

| Field | How to extract |
|---|---|
| `number` | Numeral(s) from `#### N️⃣ Request:` heading (e.g. `1`, `10`) |
| `section` | The nearest `##` or `###` heading *above* this request — used as the Postman folder name |
| `name` | A human-readable request name: use the `###` heading directly above if it's descriptive, otherwise derive from the URL and method (e.g. `GET /ngsi-ld/v1/entities`) |
| `curl_raw` | Raw multi-line curl command from the ` ```console ` or ` ```bash ` fenced block, joined into one string |
| `description` | All prose between the request heading and the code block (may include `> [!NOTE]` blocks) |
| `response_example` | Content of the first ` ```json ` fenced block after the subsequent `#### Response:` heading; may be absent |

## Step 3 — Parse each curl command into Postman fields

For each request block, parse `curl_raw` into:

**Method**
- Look for `-X METHOD` or `-iX METHOD`. Default to `GET` if absent.
- If the command has a body flag (`-d`, `--data`, `--data-raw`) but no `-X`, treat as `POST`.

**URL**
- Extract the URL argument (single- or double-quoted, or unquoted).
- Replace `http://localhost:1026` with `http://{{context-broker}}`.
- Replace `http://localhost:3004` with `http://{{ld-context}}`.
- Replace `http://localhost:3000` with `http://{{context-provider}}`.
- Replace any other `http://localhost:PORT` with `http://{{localhost}}` and add a note about the port.
- Split into `protocol`, `host`, `port` (omit `port` key if using a variable host), `path` (array, split on `/`), and `query` (array of `{key, value}` pairs from the query string).

**Headers**
- Each `-H "Key: Value"` becomes `{ "key": "Key", "value": "Value" }`.

**Body**
- If `-d` or `--data` or `--data-raw` is present and `-G` is **not** present, this is a request body.
  - `mode: "raw"`, `raw: <value>`, `options: { "raw": { "language": "json" } }` if the value parses as JSON.
- If `-G` is present, the `-d` params are query parameters; append them to the `query` array instead of the body.

**Description**
- Set to the `description` field from Step 2, plus (if `response_example` is present) append it after a `\n\n#### Response:\n` separator. Keep formatting clean for Postman's markdown renderer.

## Step 4 — Build the updated Postman collection

Read `$POSTMAN` as JSON. The structure is Postman Collection v2.1:

```json
{
  "info": { ... },
  "item": [ <folder or request items> ]
}
```

Items are either **folders** (`{ "name": "...", "item": [...] }`) or **requests** (`{ "name": "...", "request": {...}, "response": [] }`).

**Matching strategy:**
For each request block parsed from the README, search the existing collection (recursively, depth-first) for an item whose `request.url.raw` normalises to the same URL and whose `request.method` matches. If found, it already exists — collect it for comparison but do not duplicate it.

**Adding new requests:**
If a request is not found in the collection:
1. Determine the correct folder: find or create a folder at the top level of `item` whose `name` matches `section` from Step 2.
2. Append the new request item to that folder's `item` array (or to the root `item` array if no section folder applies).
3. Build the request item as:

```json
{
  "name": "<name from Step 2>",
  "request": {
    "method": "<METHOD>",
    "header": [ { "key": "...", "value": "..." } ],
    "body": { ... },          // omit if no body
    "url": {
      "raw": "...",
      "protocol": "http",
      "host": [ "{{context-broker}}" ],
      "path": [ "...", "..." ],
      "query": [ ... ]        // omit if empty
    },
    "description": "..."
  },
  "response": []
}
```

**Updating existing requests:**
If a request already exists but its headers, body, or description differ from what was parsed from README, list the discrepancy and ask the user whether to update it.

## Step 5 — Report

Before writing, print a summary:

```
Request | Name                                | Action
--------|-------------------------------------|--------
1️⃣      | Obtaining Version Information       | already present (no change)
2️⃣      | Creating your first Data Entity     | ADDED to folder "Creating NGSI-LD entities"
3️⃣      | Obtain entity data by FQN Type      | already present — header mismatch (see below)
```

List any update candidates with the specific field that differs.

## Step 6 — Write

Ask: "Write changes to `<POSTMAN filename>`? (y/N)".

If the user answers `y`:
- Serialise the updated collection JSON with 2-space indentation (matching the existing file's style).
- Write to `$POSTMAN`.
- Confirm "Postman collection updated: N request(s) added, M request(s) updated."

If the user answers `n`: print the full proposed JSON to stdout so the user can inspect it, and leave the file unchanged.
