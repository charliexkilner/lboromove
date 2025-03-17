# Property Management Scripts

This directory contains scripts for managing property data, particularly for fixing image issues and detecting duplicate properties.

## Available Scripts

### 1. Fix Property Images (`fix-property-images.ts`)

This script validates and fixes property images across all housing providers by:
- Identifying properties with potentially mismatched images
- Re-scraping images from the original property URLs
- Updating the database with the correct images
- Generating a detailed report of the process

### 2. Detect Duplicate Properties (`detect-duplicate-properties.ts`)

This script detects and optionally merges duplicate properties by:
- Grouping properties by street address and number of rooms
- Identifying potential duplicates based on address and property details
- Suggesting merges with the most complete property as the primary
- Merging images from all duplicates, filtering by relevance to the address
- Generating a detailed report of the process

## Installation

Before running these scripts, you need to install the required dependencies:

```bash
# Make the install script executable (if not already)
chmod +x scripts/install-dependencies.sh

# Run the install script
./scripts/install-dependencies.sh
```

This will install the necessary npm packages and TypeScript type definitions.

## Usage

### Fix Property Images

```bash
# Run the script
npx ts-node -P tsconfig.scripts.json scripts/fix-property-images.ts
```

The script will:
1. Scan all properties in the database
2. Identify properties with potentially mismatched images
3. Re-scrape images from the original URLs
4. Update the database with the correct images
5. Generate a report in the `reports` directory

### Detect Duplicate Properties

```bash
# Run the script to detect duplicates and generate a report (without making changes)
npx ts-node -P tsconfig.scripts.json scripts/detect-duplicate-properties.ts

# Run the script to detect duplicates and apply the merges
npx ts-node -P tsconfig.scripts.json scripts/detect-duplicate-properties.ts --apply
```

The script will:
1. Scan all properties in the database
2. Group properties by street address and number of rooms
3. Identify potential duplicates
4. Generate a report in the `reports` directory
5. If the `--apply` flag is provided, merge the duplicates

### Run All Property Fixes

To run both scripts in sequence:

```bash
./scripts/fix-all-property-issues.sh
```

## Reports

Both scripts generate detailed JSON reports in the `reports` directory. These reports include:
- Timestamp of the operation
- Number of properties processed
- Details of properties with issues
- Actions taken to fix the issues

The reports are named with timestamps for easy tracking:
- `property-images-report-[timestamp].json`
- `duplicate-properties-report-[timestamp].json`

## Troubleshooting

If you encounter TypeScript errors, make sure you're using the custom TypeScript configuration:

```bash
# Always use the -P flag to specify the scripts TypeScript config
npx ts-node -P tsconfig.scripts.json scripts/fix-property-images.ts
```

This configuration includes settings for ES2015 target and downlevelIteration which are required for these scripts. 