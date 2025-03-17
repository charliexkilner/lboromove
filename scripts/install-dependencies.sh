#!/bin/bash

# Script to install dependencies for property image and duplicate detection scripts

echo "Installing dependencies for property scripts..."

# Install npm packages
npm install --save dotenv node-fetch@2 cheerio

# Install TypeScript type definitions
npm install --save-dev @types/node-fetch @types/cheerio @types/dotenv

echo "Dependencies installed successfully!"
echo "You can now run the property image and duplicate detection scripts using:"
echo "npx ts-node -P tsconfig.scripts.json scripts/fix-property-images.ts"
echo "npx ts-node -P tsconfig.scripts.json scripts/detect-duplicate-properties.ts" 