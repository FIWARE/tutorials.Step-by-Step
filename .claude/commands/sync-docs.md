---
description: Diff a tutorial README against its ReadTheDocs docs file and optionally update the docs file. Applies all README-to-docs transformation rules (strip ToC/Prerequisites/image header, plain-number headings, bash fences, relative links, Description prefix, hr divider).
model: claude-haiku-4-5-20251001
allowed-tools:
  - Read
  - Edit
  - Bash
---

Compare the README.md for the tutorial at `$ARGUMENTS` against its corresponding ReadTheDocs docs file. Show a diff of any divergence, then offer to update the docs file to match.

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

A `README.md` is the source of truth for content. The `docs/*.md` file is **not** a mechanical copy of the README — it has its own established format conventions for ReadTheDocs/MkDocs. Use the existing docs file as the reference for format; only propagate content changes from the README.

### Omit from docs (never present)

- The `<h1 align="center">` HTML block at the top (the logo image header).
- The `## <TutorialName>` heading immediately after the image block.
- The language switcher link (e.g. `-   このチュートリアルは[日本語](...)`).
- The `## Contents` section including its `<details><summary>...</summary>` ToC block.
- The `## License` section and the trailing `---` before it.
- The `## Prerequisites` section and all its subsections — **NGSI-LD only**. In NGSI-v2 docs the Prerequisites section is retained.

### Structure of a correctly-synced docs file

```
[Badges — same as README, no ## heading wrapper]

**Description:** [first prose sentence from README intro paragraph]

[Rest of intro paragraph]

[Postman/Codespaces badge buttons]

<hr class="core"/>

# [First README `#` content heading — this is the MkDocs page title]

> "[Opening quote from README]"
>
> — [Attribution]

[Intro prose from under the first `#` heading]

<h3>[README `##` sub-sections within the intro — HTML tag keeps them out of MkDocs nav]</h3>

[Content]

---

## Architecture

[README `# Architecture` body]

### Video: NGSI-v2 Core Context Management

[![](https://fiware.github.io/tutorials.NGSI-LD/img/video-logo.png)](https://www.youtube.com/watch?v=XXXX 'NGSI-v2 ...')

Click on the image above to watch a demo of this tutorial describing how to ...

## Prerequisites   ← NGSI-v2 only

[README `# Prerequisites` body]

## Start Up

[README `# Start Up` body]

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

## [Main Operations Section]

[Numbered request/response blocks]

---
```

### Transformation rules applied to content copied from README

| README element | Docs equivalent |
|---|---|
| Badges + intro paragraph | Same badges (no `##` wrapper); `**Description:** ` prefix on first prose sentence; `<hr class="core"/>` before first `#` heading |
| README `# Foo` (all except first `#` heading) | `## Foo` |
| README `## Bar` | `### Bar` |
| README `##` sub-sections within the first `#` block | `<h3>Bar</h3>` (HTML tag, keeps out of MkDocs TOC) |
| README `###` sub-sub-sections within the first `#` block | `<h4>Baz</h4>` |
| `#### 1️⃣ Request:` (emoji number heading) | `#### 1 Request:` (plain digit, no emoji) |
| ` ```console ` fenced block | ` ```bash ` |
| GET request inline query params e.g. `?type=Foo&options=keyValues` | `-G -d 'type=Foo' -d 'options=keyValues'` style for readability |
| `> [!NOTE]` followed by body | `> **Note:** body` |
| `> [!TIP]` followed by body | `> **Tip** body` |
| Absolute GitHub cross-tutorial links `(https://github.com/FIWARE/tutorials.SomeName)` | Relative doc links `(some-name.md)` using the nav map from `mkdocs.yml` |
| `#!/bin/bash` at the top of a git-clone code block | Remove — not present in README |

### Added to docs only (not in README)

- `### Video: NGSI-v2 Core Context Management` block immediately after `## Architecture`
- `---` horizontal rules between major top-level sections (before `## Architecture`, before main operations section, etc.)

### Preserved as-is

All body prose, code blocks (non-curl), blockquotes, images, tables, YAML snippets.

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
