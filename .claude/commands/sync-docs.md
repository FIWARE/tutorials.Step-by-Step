---
description: Diff a tutorial README against its ReadTheDocs docs file and optionally update the docs file. Works for both NGSI-v2 and NGSI-LD tutorials. Applies all README-to-docs transformation rules per the relevant template in .claude/templates/.
model: claude-haiku-4-5-20251001
allowed-tools:
  - Read
  - Edit
  - Bash
---

Compare the README.md for the tutorial at `$ARGUMENTS` against its corresponding ReadTheDocs docs file. Show a diff of any divergence, then offer to update the docs file to match.

**Template references** (read these before starting to understand the expected format):
- NGSI-v2: `.claude/templates/ngsi-v2-docs-template.md`
- NGSI-LD: `.claude/templates/ngsi-ld-docs-template.md`

## Step 1 — Resolve tutorial path and find the docs file

Resolve `$ARGUMENTS` to an absolute tutorial directory (same rules as `verify-tutorial`).

```
TUTORIAL_DIR=<resolved absolute path>
README=$TUTORIAL_DIR/README.md
SUBMODULE_DIR=<absolute path to NGSI-v2 or NGSI-LD root>  # infer from TUTORIAL_DIR
MKDOCS=$SUBMODULE_DIR/mkdocs.yml
DOCS_DIR=$SUBMODULE_DIR/docs          # all docs files live here, NOT under TUTORIAL_DIR
```

The docs files for all tutorials in a submodule are centralised under `$SUBMODULE_DIR/docs/` — for example, `NGSI-v2/docs/getting-started.md`, `NGSI-LD/docs/linked-data.md`. They are never inside the individual tutorial directory.

**Finding the docs file:** The nav section of `mkdocs.yml` maps human-readable titles to `docs/` filenames. To find the right entry:

1. Read `$README` and extract the primary content heading — the first `# Heading` (level-1, ignoring the `<h1 align="center">` image block) in the file.
2. Read `$MKDOCS` and scan the `nav:` section for an entry whose label matches that heading (case-insensitive, ignoring backticks and `@`).
3. The docs file path is `$DOCS_DIR/<filename>.md`. If no match is found, report all nav entries and ask the user to select.

## Step 2 — Understand the docs format conventions

First determine which submodule the tutorial belongs to (NGSI-v2 or NGSI-LD), then read the corresponding template:
- NGSI-v2: `.claude/templates/ngsi-v2-docs-template.md`
- NGSI-LD: `.claude/templates/ngsi-ld-docs-template.md`

A `README.md` is the source of truth for **content**. The `docs/*.md` file is **not** a mechanical copy — it has its own established format for ReadTheDocs/MkDocs. Use the existing docs file as the reference for format; only propagate content changes from the README.

### Rules common to both NGSI-v2 and NGSI-LD

**Always omit:**
- `<h1 align="center">` image block at the top
- `## <TutorialName>` heading immediately after the image block
- Language switcher line (e.g. `-   このチュートリアルは[日本語](...)`)
- `## Contents` / `<details>` ToC block
- `## License` section and trailing `---` before it
- `#!/bin/bash` shebang at the top of git-clone code blocks

**Always transform:**

| README element | Docs equivalent |
|---|---|
| Badges + intro paragraph | Same badges (no `##` wrapper); `**Description:** ` prefix on first prose sentence |
| `<hr class="..."/>` | Placed after badges/intro, before first `#` heading; class matches the chapter |
| First README `#` content heading | `#` (MkDocs page title — stays at `#` level) |
| All subsequent `#` headings | `##` |
| `##` headings within first `#` intro block | `<h3>...</h3>` (HTML tag, keeps out of MkDocs TOC) |
| `###` headings within first `#` intro block | `<h4>...</h4>` |
| `##` headings elsewhere | `###` |
| `###` headings elsewhere | `####` |
| `#### 1️⃣ Request:` / `#### 1️⃣0️⃣ Request:` | `#### 1 Request:` / `#### 10 Request:` (plain digits) |
| ` ```console ` fenced block | ` ```bash ` |
| `> [!NOTE]` + body | `> **Note:** body` |
| `> [!TIP]` + body | `> **Tip** body` |
| Absolute GitHub cross-tutorial links | Relative `.md` links via `mkdocs.yml` nav map |

**Always preserve:** body prose, non-curl code blocks, blockquotes, images, tables, YAML snippets.

### NGSI-v2 specific rules

- Prerequisites section **is retained** in NGSI-v2 docs.
- `---` horizontal rule is added **before `## Architecture`** (separating intro from Architecture).
- `---` horizontal rules are added before each major operations section.
- Video section title is always `### Video: NGSI-v2 Core Context Management` — placed after `## Architecture`.
- GET request inline query params → `-G -d 'param=value'` style.
- Start Up uses `./services create; ./services start;` pattern.

### NGSI-LD specific rules

- Prerequisites section is **always omitted** in NGSI-LD docs.
- **No `---` before `## Architecture`** — intro flows directly into Architecture without a divider.
- `---` horizontal rules are added only before major operations sections (not before Architecture).
- Video section title varies per tutorial (`### Video: {Title}`) — present only when a video exists.
- Video section is placed **within `## Architecture`** (as a `###` sub-section).
- Start Up section uses `git checkout NGSI-LD` and `./services [orion|scorpio|stellio]` pattern.
- `<hr>` class depends on chapter: `core` for Core CM, `iotagents` for IoT Agents, etc.
- Badge set depends on chapter — consult the existing docs file or the NGSI-LD template.

## Step 3 — Identify content divergence

Read both `$README` and `$DOCS` and compare their **content** (not format). Note:

- Content present in README but missing or wrong in docs → needs updating
- Format differences (heading levels, HTML tags, alert syntax, code fence names) → these are expected and correct; do not flag them as divergence unless the content itself differs
- Docs-only additions (Video section, `---` dividers) → always retain these; they are not divergence

Produce a list of specific content differences found.

## Step 4 — Present findings

Present the list of content differences to the user:
- "Docs file is in sync." (no differences)
- List each difference with the docs location (line number or section) and what it should become.

## Step 5 — Update (optional)

If there are differences, ask: "Update the docs file to match? (y/N)".

If the user answers `y`:
- Apply each content change to the docs file using targeted edits. Preserve all docs-format elements (heading levels, HTML tags, alert syntax, Video section, `---` dividers).
- Run `npm run prettier:text` from the submodule root (only for English `.md` files — never for `.ja.md`).
- Run `npm run lint:text` from the submodule root and report the result.
- Confirm "Docs file updated."

If the user answers `n` or does not respond: leave the file unchanged.
