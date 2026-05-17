#!/usr/bin/env python3
"""
Parse a FIWARE tutorial README.md and extract numbered cURL request/response pairs.

Each numbered request block begins with a heading of the form:
    #### 1️⃣ Request:
and is followed by a ```console or ```bash fenced block containing the curl
command.  An optional ```json fenced block under the next #### Response:
heading provides the expected payload.

Usage:
    python3 parse_readme.py <path/to/README.md>

Output (stdout): JSON array — one object per numbered request:
  {
    "number":        "1",            # plain digit string, no emoji
    "section":       "...",          # nearest ## heading above this request
    "label":         "...",          # nearest ### heading (falls back to section)
    "curl":          "curl -X ...",  # raw command; multi-line body preserved
    "expected_json": { ... } | null, # parsed JSON from Response block, or null
    "expect_2xx":    true | false    # true when no expected_json and the method
                                     # is POST/PATCH/PUT/DELETE (check status only)
  }

Exit codes: 0 on success, 1 on error.
"""

import sys
import re
import json

# ---------------------------------------------------------------------------
# Emoji-keycap digit normalisation
# Each emoji digit is: ASCII digit  U+FE0F (variation selector)  U+20E3 (keycap)
# The variation selector is optional in some encodings.
# ---------------------------------------------------------------------------
_KEYCAP_RE = re.compile(r'(\d)️?⃣')


def _emoji_to_digits(s: str) -> str:
    """Replace all emoji-keycap digit sequences with their ASCII equivalents."""
    return _KEYCAP_RE.sub(r'\1', s).replace('️', '').strip()


# ---------------------------------------------------------------------------
# Heading patterns
# ---------------------------------------------------------------------------
_REQUEST_RE = re.compile(r'^####\s+(.+?)\s+Request:\s*$')
_RESPONSE_RE = re.compile(r'^####\s+Response:\s*$')
_H2_RE = re.compile(r'^##\s+(?!#)')
_H3_RE = re.compile(r'^###\s+(?!#)')
_H4_RE = re.compile(r'^####\s+')


def _read_fence_block(lines: list[str], start: int) -> tuple[list[str], int]:
    """
    Starting at *start* (the line after the opening fence), collect lines until
    the closing ``` and return (content_lines, index_after_closing_fence).
    """
    block: list[str] = []
    i = start
    while i < len(lines):
        if lines[i].rstrip() == '```':
            return block, i + 1
        block.append(lines[i])
        i += 1
    return block, i  # unterminated fence — return what we have


def _join_continuation_lines(lines: list[str]) -> str:
    """
    Join bash line-continuation sequences (backslash + newline) into a single
    space while preserving multi-line single-quoted strings verbatim.

    Strategy: reassemble the original text, then collapse ' \\\n ' sequences
    that appear *outside* single-quoted strings.
    """
    raw = '\n'.join(lines)
    # Collapse: optional-whitespace + backslash + newline + optional-whitespace
    # Only when NOT inside a single-quoted string.
    # Simple heuristic: replace ' \<newline>' with a single space.
    result = re.sub(r'[ \t]*\\\n[ \t]*', ' ', raw)
    return result.strip()


def parse(readme_path: str) -> list[dict]:
    with open(readme_path, encoding='utf-8') as fh:
        raw_lines = fh.readlines()

    lines = [l.rstrip('\n') for l in raw_lines]
    n = len(lines)
    requests: list[dict] = []

    current_section = ''
    current_subsection = ''
    i = 0

    while i < n:
        line = lines[i]

        # ── update heading context ──────────────────────────────────────────
        if _H2_RE.match(line):
            current_section = line.lstrip('#').strip()
            current_subsection = ''
        elif _H3_RE.match(line):
            current_subsection = line.lstrip('#').strip()

        m = _REQUEST_RE.match(line)
        if not m:
            i += 1
            continue

        # ── request heading found ───────────────────────────────────────────
        number = _emoji_to_digits(m.group(1))
        label = current_subsection or current_section
        i += 1

        # ── scan forward for the curl fenced block ──────────────────────────
        curl_lines: list[str] = []
        while i < n:
            l = lines[i]
            fence_m = re.match(r'^```(\w*)$', l.rstrip())
            if fence_m:
                lang = fence_m.group(1).lower()
                if lang in ('console', 'bash', ''):
                    # This is the curl block
                    curl_lines, i = _read_fence_block(lines, i + 1)
                    break
                else:
                    # Skip a non-curl fenced block (e.g. ```json inline example)
                    _, i = _read_fence_block(lines, i + 1)
            elif _REQUEST_RE.match(l) or _H2_RE.match(l) or _H3_RE.match(l):
                # Overran into the next request or section without finding a block
                break
            else:
                i += 1

        if not curl_lines:
            continue  # no curl block found — skip this heading

        curl = _join_continuation_lines(curl_lines)

        # ── scan forward for #### Response: and its ```json block ───────────
        expected_json = None
        while i < n:
            l = lines[i]
            if _RESPONSE_RE.match(l):
                i += 1
                # Look for a ```json block
                while i < n:
                    rl = lines[i].rstrip()
                    fence_m2 = re.match(r'^```(\w*)$', rl)
                    if fence_m2:
                        lang2 = fence_m2.group(1).lower()
                        if lang2 == 'json':
                            json_lines, i = _read_fence_block(lines, i + 1)
                            try:
                                expected_json = json.loads('\n'.join(json_lines))
                            except json.JSONDecodeError:
                                pass  # treat malformed block as absent
                            break
                        else:
                            # Skip non-JSON fence block
                            _, i = _read_fence_block(lines, i + 1)
                    elif _REQUEST_RE.match(rl) or _H2_RE.match(rl) or _H3_RE.match(rl):
                        break
                    else:
                        i += 1
                break
            elif _REQUEST_RE.match(l) or _H2_RE.match(l) or _H3_RE.match(l):
                # Next request / section arrived — no Response heading for us
                break
            else:
                i += 1

        # ── determine whether to expect a 2xx status check ─────────────────
        expect_2xx = expected_json is None and bool(
            re.search(r'(?:-iX|-X)\s+(POST|PATCH|PUT|DELETE)', curl, re.IGNORECASE)
        )

        requests.append({
            'number':        number,
            'section':       current_section,
            'label':         label,
            'curl':          curl,
            'expected_json': expected_json,
            'expect_2xx':    expect_2xx,
        })

    return requests


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: parse_readme.py <path/to/README.md>')
    try:
        result = parse(sys.argv[1])
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except OSError as exc:
        sys.exit(f'Error reading file: {exc}')
