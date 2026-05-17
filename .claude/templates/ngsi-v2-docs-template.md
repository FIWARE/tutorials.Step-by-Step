<!--
  NGSI-v2 ReadTheDocs docs file template.
  Source: NGSI-v2/docs/<tutorial-name>.md
  This file is NOT a direct copy of the README. It follows its own format conventions.
  See sync-docs.md for the full transformation ruleset.
-->

[![FIWARE Core Context Management](https://fiware.github.io/catalogue/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

**Description:** {First sentence of the intro paragraph, verbatim from README.}

{Rest of intro paragraph. Cross-tutorial links rewritten to relative .md paths.}

{Postman/Codespaces badge buttons, verbatim from README.}

<hr class="core"/>

# {First `#`-level content heading from README — verbatim}

> "{Opening quote, verbatim from README}"
>
> — {Attribution}

{Intro prose for this section.}

<h3>{## Sub-section heading from README — use HTML tag to keep out of MkDocs TOC}</h3>

{Content verbatim from README. Cross-tutorial links → relative .md.}

---

## Architecture

{README `# Architecture` body, verbatim. Cross-tutorial links → relative .md.}

### Video: NGSI-v2 Core Context Management

[![](https://fiware.github.io/tutorials.NGSI-LD/img/video-logo.png)](https://www.youtube.com/watch?v=XXXX 'NGSI-v2 ...')

Click on the image above to watch a demo of this tutorial describing how to ...

## Prerequisites

### Docker {and Docker Compose}

{README `# Prerequisites / ## Docker` body, verbatim.}

### WSL

{README `# Prerequisites / ## WSL` body, verbatim.}

## Start Up

{README `# Start Up` body, verbatim. Note syntax conversions below.}

> **Note:** If you want to clean up and start over again you can do so with the following command:
>
> ```
> ./services stop
> ```

---

## {Main Operations Section}

{README `# Main Operations Section` body. Apply all conversions below.}

### {Sub-section}

#### N Request:

```bash
curl ...
```

#### Response:

> **Tip:** Use [jq](...) to format the JSON responses in this tutorial. Pipe the result by appending
>
> ```
> | jq '.'
> ```

```json
{
    ...
}
```

---

<!--
=== FORMAT CONVERSION RULES ===

1. HEADING LEVELS
   README `# Foo`           → docs `## Foo`         (all except the FIRST # heading)
   README `## Bar`          → docs `### Bar`
   README `### Baz`         → docs sub-section in prose or `#### Baz`
   First `#` content heading stays at `# ` level (this is the MkDocs page title).

2. SUB-SECTIONS WITHIN THE INTRO (`# First Heading`)
   README `## Sub`          → docs `<h3>Sub</h3>`   (keeps sub-sections out of MkDocs nav)
   README `### Sub-sub`     → docs `<h4>Sub-sub</h4>`

3. ALERT / ADMONITION SYNTAX
   `> [!NOTE]`  followed by blank + body  → `> **Note:** body` (inline or block)
   `> [!TIP]`   followed by blank + body  → `> **Tip** body`

4. CODE FENCES
   ` ```console `  (curl command blocks)  → ` ```bash `
   Other language identifiers unchanged.

5. REQUEST NUMBERING
   `#### 1️⃣ Request:` → `#### 1 Request:`
   `#### 1️⃣0️⃣ Request:` → `#### 10 Request:`

6. CROSS-TUTORIAL LINKS
   `(https://github.com/FIWARE/tutorials.Getting-Started)`  → `(getting-started.md)`
   Use the nav map in mkdocs.yml to resolve all tutorial GitHub URLs to relative .md paths.

7. GET REQUEST STYLE
   Inline query params in URL → `-G -d 'param=value'` style for readability.
   e.g. `curl -X GET 'http://host/v2/entities?type=Foo&options=keyValues'`
     → `curl -G -X GET 'http://host/v2/entities' -d 'type=Foo' -d 'options=keyValues'`

8. OMIT FROM DOCS
   - `<h1 align="center">` image block
   - `## {TutorialName}` heading immediately after
   - Language-switcher lines (🇯🇵 このチュートリアルは...)
   - `## Contents` / `<details>` ToC block
   - `## License` section and trailing `---` before it

9. ADD TO DOCS (not in README)
   - `### Video: NGSI-v2 Core Context Management` block after ## Architecture
   - `---` horizontal rules between major top-level sections

10. PRESERVE AS-IS
    All body prose, code blocks (non-curl), blockquotes, images, tables.
    Prerequisites section IS included in NGSI-v2 docs (unlike NGSI-LD).
-->
