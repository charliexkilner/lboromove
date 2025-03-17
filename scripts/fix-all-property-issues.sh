#!/bin/bash

# Script to run both property image fixing and duplicate detection in sequence

echo "===== Starting Property Data Cleanup ====="
echo ""

# Step 1: Fix property images
echo "Step 1: Fixing property images..."
npx ts-node -P tsconfig.scripts.json scripts/fix-property-images.ts
echo ""
echo "Property image fixing complete!"
echo ""

# Step 2: Detect and report duplicate properties (without applying changes)
echo "Step 2: Detecting duplicate properties..."
npx ts-node -P tsconfig.scripts.json scripts/detect-duplicate-properties.ts
echo ""
echo "Duplicate property detection complete!"
echo ""

echo "===== Property Data Cleanup Complete ====="
echo ""
echo "Reports have been generated in the 'reports' directory."
echo ""
echo "To merge duplicate properties, run:"
echo "npx ts-node -P tsconfig.scripts.json scripts/detect-duplicate-properties.ts --apply"
echo "" 