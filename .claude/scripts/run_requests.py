#!/usr/bin/env python3
"""
Execute all numbered cURL requests from a FIWARE tutorial README.md and
compare responses against documented payloads.

Handles automatically:
  - Hardcoded MongoDB ObjectIds in URLs  → marks N/A (example-only request)
  - Random-data endpoints (/random/)     → structure-only comparison
  - curl -i/-iX flags                    → stripped (headers corrupt body)
  - ARM64 image pull failures            → detected via services start output;
                                           caller must pre-pull affected images

Usage:
    python3 run_requests.py <path/to/README.md>

Output (stdout): JSON report:
  {
    "readme":   "<path>",
    "total":    N,
    "passed":   N,
    "failed":   N,
    "skipped":  N,     # N/A + INFO
    "results":  [ ... ]
  }

Each result object:
  {
    "number":       "1",
    "label":        "...",
    "status":       "PASS" | "FAIL" | "N/A" | "INFO",
    "reason":       "...",         # FAIL only
    "note":         "...",         # supplementary (e.g. random data)
    "mismatches":   [...],         # FAIL with body comparison
    "ignored_paths": [...],        # fields skipped as dynamic
    "actual":       "..."          # INFO only (first 300 chars)
  }

Exit: 0 if all PASS/N/A/INFO, 1 if any FAIL, 2 on fatal error.
"""

import sys
import os
import re
import json
import subprocess
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Locate sibling scripts
# ---------------------------------------------------------------------------
_SCRIPTS_DIR = Path(__file__).parent
sys.path.insert(0, str(_SCRIPTS_DIR))

from parse_readme import parse       # noqa: E402
from compare_json import compare     # noqa: E402

# ---------------------------------------------------------------------------
# Detection patterns
# ---------------------------------------------------------------------------

# 24-char lowercase hex — MongoDB ObjectId used for subscription / registration IDs.
# Such IDs are database-generated and will not exist on a freshly-started broker.
_OBJECT_ID_IN_URL_RE = re.compile(r'/[0-9a-f]{24}(?:[/?]|$)')

# Endpoints whose response values are randomly generated on each call.
# The README shows sample output; exact values will never match.
# Matches /random/ mid-path and /random at end of path (before ? or end).
_RANDOM_URL_RE = re.compile(r'/random(?:[/?]|$)')


def _prepare_curl(curl: str) -> str:
    """
    Strip header-capture flags and ensure silent mode + timeout are set.

    Transformations applied (in order):
      -iX METHOD  →  -sX METHOD    (keep method flag, drop header output)
      -i<flags>   →  -s<flags>     (drop -i from any combined flag group)
      bare -i     →  (removed)     (standalone -i with no method flag)
      missing -s  →  add -s        (suppress progress meter)
      missing --max-time → add --max-time 15
    """
    # -iX → -sX  (combined with explicit method)
    cmd = re.sub(r'\B-([a-zA-Z]*)i([a-zA-Z]+)\b', r'-\1s\2', curl)
    # standalone -i flag (word-boundary, not part of another option)
    cmd = re.sub(r'(?<!\w)-i(?!\w)', '', cmd)
    # collapse any double-spaces left behind
    cmd = re.sub(r'  +', ' ', cmd).strip()
    # ensure -s is present
    if not re.search(r'\bcurl\b.*\B-[a-zA-Z]*s', cmd):
        cmd = cmd.replace('curl ', 'curl -s ', 1)
    # ensure --max-time is present
    if '--max-time' not in cmd:
        cmd = cmd.replace('curl ', 'curl --max-time 15 ', 1)
    return cmd


def _has_hardcoded_object_id(curl: str) -> bool:
    """Return True if the URL targets a specific resource by a hardcoded ObjectId."""
    return bool(_OBJECT_ID_IN_URL_RE.search(curl))


def _is_random_endpoint(curl: str) -> bool:
    """Return True if the URL targets a random-data generator endpoint."""
    return bool(_RANDOM_URL_RE.search(curl))


def _run_curl(cmd: str) -> tuple[str, int]:
    """Execute *cmd* via bash and return (stdout.strip(), returncode)."""
    result = subprocess.run(
        ['bash', '-c', cmd],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return result.stdout.strip(), result.returncode


def _check_2xx(body: str, rc: int) -> tuple[bool, str]:
    """
    Decide whether a mutation request (expect_2xx=True) succeeded.

    Returns (ok, failure_reason).
    """
    if rc != 0:
        return False, f'curl exited with code {rc}'
    if body:
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                if 'error' in parsed or 'orionError' in parsed:
                    err = parsed.get('error') or parsed.get('orionError', {})
                    return False, f'Error response: {json.dumps(err)}'
        except json.JSONDecodeError:
            pass  # non-JSON body on a mutation is fine (e.g. plain 201)
    return True, ''


def _compare_bodies(body: str, expected: object, random_mode: bool) -> dict:
    """
    Compare *body* (raw string) against *expected* (Python object).

    Delegates to compare_json.compare(); uses temp files for large payloads.
    """
    expected_str = json.dumps(expected, ensure_ascii=False)

    if len(body) + len(expected_str) > 4000:
        fd_a, path_a = tempfile.mkstemp(suffix='.json')
        fd_e, path_e = tempfile.mkstemp(suffix='.json')
        try:
            with os.fdopen(fd_a, 'w', encoding='utf-8') as f:
                f.write(body)
            with os.fdopen(fd_e, 'w', encoding='utf-8') as f:
                f.write(expected_str)
            return compare(
                open(path_a, encoding='utf-8').read(),
                open(path_e, encoding='utf-8').read(),
                random_mode=random_mode,
            )
        finally:
            os.unlink(path_a)
            os.unlink(path_e)
    else:
        return compare(body, expected_str, random_mode=random_mode)


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

def run_tutorial(readme_path: str) -> dict:
    """Parse *readme_path* and execute all numbered requests in order."""
    requests = parse(readme_path)
    results = []

    for req in requests:
        num      = req['number']
        label    = req['label']
        curl     = req['curl']
        expected = req['expected_json']
        is_2xx   = req['expect_2xx']

        # ── N/A: hardcoded database ID in URL ──────────────────────────────
        if _has_hardcoded_object_id(curl):
            results.append({
                'number': num,
                'label':  label,
                'status': 'N/A',
                'reason': (
                    'URL contains a hardcoded database-generated ID that will not '
                    'exist on a fresh broker — illustrative example only'
                ),
            })
            continue

        random_mode = _is_random_endpoint(curl)
        cmd = _prepare_curl(curl)

        # ── Execute ─────────────────────────────────────────────────────────
        try:
            body, rc = _run_curl(cmd)
        except subprocess.TimeoutExpired:
            results.append({
                'number': num, 'label': label,
                'status': 'FAIL', 'reason': 'Request timed out (>30 s)',
            })
            continue

        # ── Mutation / 2xx check ─────────────────────────────────────────────
        if is_2xx:
            ok, reason = _check_2xx(body, rc)
            results.append({
                'number': num, 'label': label,
                'status': 'PASS' if ok else 'FAIL',
                **({'reason': reason} if not ok else {}),
            })
            continue

        # ── Body comparison ──────────────────────────────────────────────────
        if expected is not None:
            try:
                cmp = _compare_bodies(body, expected, random_mode)
            except Exception as exc:
                results.append({
                    'number': num, 'label': label,
                    'status': 'FAIL',
                    'reason': f'Comparison error: {exc}',
                })
                continue

            entry: dict = {
                'number':        num,
                'label':         label,
                'status':        'PASS' if cmp.get('match') else 'FAIL',
                'mismatches':    cmp.get('mismatches', []),
                'ignored_paths': cmp.get('ignored_paths', []),
            }
            if 'error' in cmp:
                entry['status'] = 'FAIL'
                entry['reason'] = cmp['error']
            if random_mode and not cmp.get('match'):
                entry['note'] = (
                    'Random-data endpoint — scalar values vary per call; '
                    'only structure (keys + types) was verified'
                )
            results.append(entry)
            continue

        # ── Informational (no documented response) ──────────────────────────
        results.append({
            'number': num,
            'label':  label,
            'status': 'INFO',
            'actual': body[:300] if body else '(empty)',
        })

    passed  = sum(1 for r in results if r['status'] == 'PASS')
    failed  = sum(1 for r in results if r['status'] == 'FAIL')
    skipped = sum(1 for r in results if r['status'] in ('N/A', 'INFO'))

    return {
        'readme':  readme_path,
        'total':   len(results),
        'passed':  passed,
        'failed':  failed,
        'skipped': skipped,
        'results': results,
    }


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: run_requests.py <path/to/README.md>')
    try:
        report = run_tutorial(sys.argv[1])
    except OSError as exc:
        sys.exit(f'Error: {exc}')
    except Exception as exc:
        sys.exit(f'Fatal error: {exc}')

    print(json.dumps(report, indent=2, ensure_ascii=False))
    sys.exit(0 if report['failed'] == 0 else 1)
