#!/usr/bin/env python3
"""
Compare two JSON values semantically, ignoring known dynamic fields.

A "mismatch" is reported when:
  - a key present in *expected* is absent from *actual*
  - a non-dynamic scalar value in *expected* differs from the same path in *actual*
  - the type at a path differs (with int/float treated as interchangeable)
  - an array has a different length

Keys present in *actual* but absent from *expected* are silently ignored; the
documented payload is the contract, not an exhaustive schema.

Usage:
    python3 compare_json.py '<actual_json>' '<expected_json>'
    python3 compare_json.py --files actual.json expected.json
    python3 compare_json.py --ignore field1 field2 -- '<actual>' '<expected>'
    python3 compare_json.py --random '<actual>' '<expected>'  # structure-only

Output (stdout): JSON object:
  {
    "match":         true | false,
    "mismatches":    [ { "path": "...", "expected": ..., "actual": ... } ],
    "ignored_paths": [ "uptime", "git_hash", ... ]
  }

Exit codes: 0 if match, 1 if mismatch, 2 on usage or JSON-parse error.
"""

import sys
import re
import json
import argparse
from typing import Any

# MongoDB ObjectId: 24 lowercase hex characters.  These are database-generated
# IDs for registrations and subscriptions and will differ on every fresh broker.
_OBJECT_ID_RE = re.compile(r'^[0-9a-f]{24}$')

# ---------------------------------------------------------------------------
# Dynamic fields — values that change between runs and must not be compared.
# Add entries here as new tutorials expose additional volatile fields.
# ---------------------------------------------------------------------------
DEFAULT_DYNAMIC_FIELDS: frozenset[str] = frozenset({
    # Orion / Orion-LD version info
    'uptime',
    'git_hash',
    'compile_time',
    'compiled_by',
    'compiled_in',
    'release_date',
    'version',
    'orion version',
    'orionld version',
    'doc',
    # Subscription / notification state
    'startTime',
    'lastNotification',
    'lastSuccess',
    'lastFailure',
    'lastSuccessCode',
    'failsCounter',
    'timesSent',
    # NGSI-LD temporal metadata
    'createdAt',
    'modifiedAt',
    'observedAt',
    # Legacy NGSI-v2 metadata
    'dateCreated',
    'dateModified',
    'dateObserved',
    'dateExpires',
})


def _leaf_key(path: str) -> str:
    """Return the final segment of a dotted path, stripping array indices."""
    segment = path.rsplit('.', 1)[-1] if '.' in path else path
    # Strip trailing [N] from array paths like "items[0]"
    return segment.split('[')[0]


def _compare(
    actual: Any,
    expected: Any,
    path: str,
    dynamic: frozenset[str],
    random_mode: bool = False,
) -> tuple[list[dict], list[str]]:
    """
    Recursively compare *actual* against *expected*.

    random_mode: when True, only verify that expected keys are present and types
    match — scalar values are not compared.  Use this for endpoints that return
    randomly-generated data where the README shows sample output only.

    Returns (mismatches, ignored_paths).
    """
    mismatches: list[dict] = []
    ignored: list[str] = []

    display_path = path or '(root)'

    # Skip if this leaf key is dynamic
    if _leaf_key(path) in dynamic:
        ignored.append(display_path)
        return mismatches, ignored

    # Type mismatch (int/float are compatible)
    if not isinstance(actual, type(expected)):
        if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
            pass  # fall through to value check below
        else:
            mismatches.append({
                'path':     display_path,
                'expected': f'<{type(expected).__name__}> {json.dumps(expected)}',
                'actual':   f'<{type(actual).__name__}> {json.dumps(actual)}',
            })
            return mismatches, ignored

    if isinstance(expected, dict):
        for key, exp_val in expected.items():
            child_path = f'{path}.{key}' if path else key
            if key in dynamic:
                ignored.append(child_path)
                continue
            # Auto-ignore database-generated ObjectId values — these are
            # registration/subscription IDs that differ on every fresh broker.
            if key == 'id' and isinstance(exp_val, str) and _OBJECT_ID_RE.match(exp_val):
                ignored.append(child_path)
                continue
            if key not in actual:
                mismatches.append({
                    'path':     child_path,
                    'expected': exp_val,
                    'actual':   '(missing)',
                })
            else:
                mm, ig = _compare(actual[key], exp_val, child_path, dynamic, random_mode)
                mismatches.extend(mm)
                ignored.extend(ig)
        # Keys in actual but not in expected are not errors

    elif isinstance(expected, list):
        if len(actual) != len(expected):
            mismatches.append({
                'path':     display_path,
                'expected': f'array of length {len(expected)}',
                'actual':   f'array of length {len(actual)}',
            })
        else:
            for idx, (act_item, exp_item) in enumerate(zip(actual, expected)):
                idx_path = f'{path}[{idx}]' if path else f'[{idx}]'
                mm, ig = _compare(act_item, exp_item, idx_path, dynamic, random_mode)
                mismatches.extend(mm)
                ignored.extend(ig)

    else:
        # Scalar comparison — skipped in random_mode (structure verified, values vary)
        if not random_mode and actual != expected:
            mismatches.append({
                'path':     display_path,
                'expected': expected,
                'actual':   actual,
            })

    return mismatches, ignored


def compare(
    actual_str: str,
    expected_str: str,
    extra_dynamic: set[str] | None = None,
    random_mode: bool = False,
) -> dict:
    """
    Parse both JSON strings and compare them.
    Returns a result dict suitable for JSON serialisation.

    random_mode: skip scalar value comparison — only check keys present and types.
    """
    dynamic = DEFAULT_DYNAMIC_FIELDS | (extra_dynamic or set())

    try:
        actual = json.loads(actual_str)
    except json.JSONDecodeError as exc:
        return {
            'match': False,
            'error': f'actual response is not valid JSON: {exc}',
            'mismatches': [],
            'ignored_paths': [],
        }

    try:
        expected = json.loads(expected_str)
    except json.JSONDecodeError as exc:
        return {
            'match': False,
            'error': f'expected JSON from docs is not valid JSON: {exc}',
            'mismatches': [],
            'ignored_paths': [],
        }

    mismatches, ignored = _compare(actual, expected, '', dynamic, random_mode)
    return {
        'match':         len(mismatches) == 0,
        'mismatches':    mismatches,
        'ignored_paths': ignored,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Compare two JSON values, ignoring known dynamic fields.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='Exit 0 = match, 1 = mismatch, 2 = usage/parse error.',
    )
    parser.add_argument('actual',   nargs='?', help='Actual JSON string')
    parser.add_argument('expected', nargs='?', help='Expected JSON string (from README)')
    parser.add_argument(
        '--files', nargs=2, metavar=('ACTUAL', 'EXPECTED'),
        help='Read JSON from files instead of positional arguments',
    )
    parser.add_argument(
        '--ignore', nargs='*', default=[],
        help='Additional field names to treat as dynamic (ignore their values)',
    )
    parser.add_argument(
        '--random', action='store_true',
        help='Structure-only mode: verify keys and types but skip scalar value comparison',
    )
    args = parser.parse_args()

    if args.files:
        try:
            actual_str   = open(args.files[0], encoding='utf-8').read()
            expected_str = open(args.files[1], encoding='utf-8').read()
        except OSError as exc:
            sys.exit(f'Error reading file: {exc}')
    elif args.actual and args.expected:
        actual_str   = args.actual
        expected_str = args.expected
    else:
        parser.print_help(sys.stderr)
        sys.exit(2)

    result = compare(actual_str, expected_str, extra_dynamic=set(args.ignore), random_mode=args.random)

    if 'error' in result:
        print(json.dumps(result, indent=2, ensure_ascii=False), file=sys.stderr)
        sys.exit(2)

    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0 if result['match'] else 1)


if __name__ == '__main__':
    main()
