#!/bin/bash
# scripts/count-brd-acs.sh
# Generates AC format breakdown directly from BRD content
# This script is evidence for ORGAN PATCH PR

BRD="docs/BRD_V20_6_3_COMPLETE.md"

echo "=== AC FORMAT BREAKDOWN (generated from BRD) ==="
echo ""

# List-style ACs: "- ACN:" pattern (requires story context for full ID)
LIST_COUNT=$(grep -cE "^-\s*AC[0-9]+:" "$BRD")
echo "List-style ACs (- ACN:): $LIST_COUNT"

# Table-style ACs: "| AC-X.Y.Z |" pattern (explicit full IDs)
TABLE_COUNT=$(grep -cE "^\|\s*AC-?[0-9]+\.[0-9]+\.[0-9]+\s*\|" "$BRD")
echo "Table-style ACs (| AC-X.Y.Z |): $TABLE_COUNT"

# Total
TOTAL=$((LIST_COUNT + TABLE_COUNT))
echo ""
echo "TOTAL: $LIST_COUNT + $TABLE_COUNT = $TOTAL"
echo ""

# Verification
if [ "$TOTAL" -eq 2849 ]; then
  echo "✓ Total matches expected 2,849"
  exit 0
else
  echo "✗ Total ($TOTAL) does NOT match expected 2,849"
  exit 1
fi

