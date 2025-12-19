#!/bin/bash
# scripts/lint-markers.sh
# Marker Governance Linter - Tier A (fast, no DB)
# 
# This is the "dumb but fast" structural check.
# SANITY-053 is the authoritative DB-backed resolution test.
#
# Checks:
# 1. No @implements AC-* (wrong pattern - should be @satisfies)
# 2. No TAC-* namespace (forbidden)
# 3. No AC-* table definitions in Track docs (Track docs must not define ACs)
#
# Exit: 0 if clean, 1 if violations

set -e
echo "=== Marker Governance Linter (Tier A) ==="
echo "Note: SANITY-053 is the authoritative DB-backed test"
echo ""

VIOLATIONS=0

# Check 1: @implements AC-* in code (wrong pattern)
echo "[1] Checking for @implements AC-* in src/scripts..."
WRONG=$(grep -rn "^\s*//\s*@implements AC-" src/ scripts/ 2>/dev/null || true)
if [ -n "$WRONG" ]; then
  echo "ERROR: Wrong pattern (should be @satisfies AC-*):"
  echo "$WRONG"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK"
fi

# Check 2: TAC-* markers (forbidden namespace)
echo "[2] Checking for TAC-* markers..."
TAC=$(grep -rn "TAC-" src/ scripts/ 2>/dev/null | grep -v "lint-markers.sh" || true)
if [ -n "$TAC" ]; then
  echo "ERROR: Forbidden TAC-* namespace:"
  echo "$TAC"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK"
fi

# Check 3: AC-* table definitions in Track docs
# Track docs must not define AC tables - they reference BRD, not redefine it
echo "[3] Checking for AC-* table definitions in spec/track_*..."
TRACK_ACS=$(grep -rn "^| AC-[0-9]" spec/track_* 2>/dev/null || true)
if [ -n "$TRACK_ACS" ]; then
  echo "ERROR: Track docs must not define AC tables:"
  echo "$TRACK_ACS" | head -10
  COUNT=$(echo "$TRACK_ACS" | wc -l | tr -d ' ')
  [ "$COUNT" -gt 10 ] && echo "(showing first 10 of $COUNT matches)"
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo "  OK"
fi

echo ""
if [ $VIOLATIONS -gt 0 ]; then
  echo "FAILED: $VIOLATIONS structural violation(s)"
  echo "Run SANITY-053 for authoritative AC resolution test."
  exit 1
else
  echo "PASSED: No structural marker violations"
  exit 0
fi

