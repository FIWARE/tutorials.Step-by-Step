<!--
  NGSI-LD ReadTheDocs docs file template.
  Source: NGSI-LD/docs/<tutorial-name>.md
  This file is NOT a direct copy of the README. It follows its own format conventions.
  See sync-docs.md for the full transformation ruleset.
-->

<!-- BADGES: Choose the set that matches the tutorial's chapter. -->

<!-- Core Context Management tutorials use: -->
[![FIWARE Core Context Management](https://fiware.github.io/catalogue/badges/chapters/core.svg)](https://github.com/FIWARE/catalogue/blob/master/core/README.md)
[![NGSI LD](https://img.shields.io/badge/NGSI-LD-d6604d.svg)](https://cim.etsi.org/NGSI-LD/official/front-page.html)
[![JSON LD](https://img.shields.io/badge/JSON--LD-1.1-f06f38.svg)](https://w3c.github.io/json-ld-syntax/)

<!-- IoT Agents chapter tutorials use (replace the badges above): -->
<!-- [![FIWARE IoT Agents](https://fiware.github.io/catalogue/badges/chapters/iot-agents.svg)](...) -->
<!-- [![JSON](https://img.shields.io/badge/Payload-JSON-27ae60.svg)](...) -->

**Description:** {First sentence of the intro paragraph, verbatim from README.}

{Rest of intro paragraph. Cross-tutorial links rewritten to relative .md paths.}

{Postman/Codespaces badge buttons, verbatim from README.}

<!-- OPTIONAL: Some tutorials (e.g. linked-data.md) add bridging paragraphs here before <hr>. -->

<!-- <hr> class matches the chapter: class="core" for Core CM, class="iotagents" for IoT Agents, etc. -->
<hr class="core"/>

# {First `#`-level content heading from README — verbatim}

> "{Opening quote, verbatim from README}"
>
> ― {Attribution}

{Intro prose for this section.}

<!-- Sub-sections of the first `#` block use HTML tags to stay out of MkDocs TOC. -->
<h3>{## Sub-section heading from README}</h3>

{Content verbatim from README. Cross-tutorial links → relative .md.}

<h4>{### Sub-sub-section heading from README}</h4>

{Content.}

<!-- NOTE: Unlike NGSI-v2, there is NO `---` horizontal rule before ## Architecture. -->

## Architecture

{README `# Architecture` body. Cross-tutorial links → relative .md.}

<!-- Video section is optional — include only when a relevant video exists for this tutorial. -->
### Video: {Tutorial-Specific Title}

[![](https://fiware.github.io/tutorials.NGSI-LD/img/video-logo.png)](https://www.youtube.com/watch?v=XXXX "{Tutorial-Specific Title}")

Click on the image above to watch a demo of this tutorial describing how to ...

<!-- NOTE: Prerequisites section is OMITTED entirely in NGSI-LD docs (unlike NGSI-v2). -->

## Start Up

All services can be initialized from the command-line by running the
[services](https://github.com/FIWARE/tutorials.{TutorialName}/blob/NGSI-LD/services) Bash script provided within the
repository. Please clone the repository and create the necessary images by running the commands as shown:

```bash
git clone https://github.com/FIWARE/tutorials.{TutorialName}.git
cd tutorials.{TutorialName}
git checkout NGSI-LD
./services create
```

To start the system with your preferred [context broker](https://www.fiware.org/catalogue/#components), run the
following command:

```bash
./services [orion|scorpio|stellio]
```

<!-- ALTERNATIVE for tutorials that do not need a separate create step: -->
<!--
```bash
git clone https://github.com/FIWARE/tutorials.{TutorialName}.git
cd tutorials.{TutorialName}
git checkout NGSI-LD

./services [orion|scorpio|stellio]
```
-->

{Optional: seed data import note.}

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
curl -iX POST 'http://localhost:1026/ngsi-ld/v1/...' \
-H 'Content-Type: application/json' \
-H 'Link: <http://context/user-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--data-raw '{
    ...
}'
```

#### Response:

> **Tip:** Use [jq](https://www.digitalocean.com/community/tutorials/how-to-transform-json-data-with-jq) to format the
> JSON responses in this tutorial. Pipe the result by appending
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
   README `# Foo`             → docs `## Foo`         (all except the FIRST # heading)
   README `## Bar`            → docs `### Bar`
   README `### Baz`           → docs `#### Baz`
   First `#` content heading stays at `# ` level (MkDocs page title).

   NOTE: Some existing NGSI-LD docs files have heading level bugs where `##` was not
   shifted to `###`. This template documents the CORRECT rule. When syncing, follow the
   correct rule regardless of what already exists in the file.

2. SUB-SECTIONS WITHIN THE INTRO (`# First Heading` block only)
   README `## Sub`            → docs `<h3>Sub</h3>`   (keeps sub-sections out of MkDocs nav)
   README `### Sub-sub`       → docs `<h4>Sub-sub</h4>`
   Sub-sections of ALL OTHER `##` sections use standard Markdown headings (###, ####).

3. ALERT / ADMONITION SYNTAX
   `> [!NOTE]`  followed by blank + body  → `> **Note:** body`
   `> [!TIP]`   followed by blank + body  → `> **Tip** body`

4. CODE FENCES
   ` ```console `  (curl command blocks)  → ` ```bash `
   Other language identifiers unchanged.

5. REQUEST NUMBERING
   `#### 1️⃣ Request:` → `#### 1 Request:`
   `#### 1️⃣0️⃣ Request:` → `#### 10 Request:`

6. CROSS-TUTORIAL LINKS
   `(https://github.com/FIWARE/tutorials.Entity-Relationships/tree/NGSI-LD)`
     → `(entity-relationships.md)`
   Use the nav map in NGSI-LD/mkdocs.yml to resolve GitHub tutorial URLs to relative .md paths.

7. GET REQUEST STYLE
   Inline query params in URL → `-G -d 'param=value'` style for readability.
   e.g. `curl -X GET 'http://host/ngsi-ld/v1/entities?type=Building&options=keyValues'`
     → `curl -G -X GET 'http://host/ngsi-ld/v1/entities' -d 'type=Building' -d 'options=keyValues'`

8. OMIT FROM DOCS
   - `<h1 align="center">` image block
   - `## {TutorialName}` heading immediately after
   - Language-switcher lines (🇯🇵 このチュートリアルは...)
   - `## Contents` / `<details>` ToC block
   - `## Prerequisites` section and ALL its subsections (Docker, WSL, etc.)
     ← This is the key NGSI-LD difference: Prerequisites are ALWAYS omitted (unlike NGSI-v2)
   - `## License` section and trailing `---` before it
   - `#!/bin/bash` shebang at the top of git-clone code blocks

9. ADD TO DOCS (not in README)
   - `### Video: {Title}` block within ## Architecture (when a video exists)
   - `---` horizontal rules before each major top-level operations section
   - NOTE: Do NOT add `---` before `## Architecture` (NGSI-LD convention differs from NGSI-v2)

10. PRESERVE AS-IS
    All body prose, code blocks (non-curl), blockquotes, images, tables, YAML snippets.
    `@context` Link headers in curl commands must be preserved exactly.

11. START UP PATTERN (NGSI-LD specific)
    NGSI-LD tutorials support multiple context brokers. The Start Up section uses one
    of two patterns depending on whether a separate image-build step is needed:

    Pattern A (most tutorials — separate create and start steps):
      ./services create
      ./services [orion|scorpio|stellio]

    Pattern B (simpler tutorials — single combined command):
      ./services [orion|scorpio|stellio]

    The `#!/bin/bash` shebang MUST be removed from git-clone code blocks.

12. BADGE AND <hr> CLASS BY CHAPTER
    Core Context Management : badges = FIWARE Core CM + NGSI LD + JSON LD
                              <hr class="core"/>
    IoT Agents & Robots     : badges = FIWARE IoT Agents + payload type
                              <hr class="iotagents"/>
    Processing & History    : badges = FIWARE Processing + relevant tech
                              <hr class="processing"/>
    Identity Management     : badges = FIWARE Security + relevant tech
                              <hr class="security"/>
    Consult the existing docs file for the correct badge set when updating.
-->
