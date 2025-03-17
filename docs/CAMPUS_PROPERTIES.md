# Campus Properties Integration

This document explains how to set up and use the campus properties feature in the LboroMove application.

## Overview

The campus properties feature allows you to display on-campus accommodation options alongside regular properties. Campus properties are stored in a JSON file that is loaded by the application.

## Setup Steps

Follow these steps to set up the campus properties feature:

1. **Scrape Campus Properties**

   Run the update script to fetch the latest campus properties from the university website:

   ```bash
   npx ts-node -P tsconfig.scripts.json scripts/update-campus-properties.ts
   ```

   This will create a `campus-properties.json` file in the `data` directory.

2. **Verify the JSON File**

   Check that the `campus-properties.json` file exists in the `data` directory and contains the expected data.

3. **Restart the Application**

   Restart the application to load the new campus properties:

   ```bash
   npm run dev
   ```

## How It Works

The campus properties integration works as follows:

1. Campus properties are scraped from the university website and stored in a JSON file.
2. The application loads the campus properties from the JSON file during server-side rendering.
3. Date objects (createdAt, updatedAt) are serialized to ISO strings to ensure they can be passed from server to client.
4. Campus properties are displayed in the "On Campus" tab alongside regular properties.
5. When a user clicks on a campus property, a specialized modal is shown with campus-specific details.

## Updating Campus Properties

To update the campus properties:

1. Run the update script to get the latest data:

   ```bash
   npx ts-node -P tsconfig.scripts.json scripts/update-campus-properties.ts
   ```

2. Restart the application to see the changes.

## Troubleshooting

If campus properties are not showing up:

1. Check that the `campus-properties.json` file exists in the `data` directory.
2. Verify that the file contains valid JSON data.
3. Check the server logs for any errors related to campus properties.
4. Try running the update script again to refresh the data.

### Common Issues

- **Date Serialization Error**: If you see an error like `Error serializing .campusProperties[0].createdAt`, it means that Date objects are not being properly converted to strings. Make sure the serialization in `getServerSideProps` is working correctly.

## Future Improvements

In the future, we plan to store campus properties in the database for better persistence and management. The current implementation uses a JSON file as a temporary solution.

## Files Involved

- `scripts/scrape-campus-properties.ts` - Scrapes campus properties from the university website
- `scripts/update-campus-properties.ts` - Updates the campus properties JSON file
- `utils/campusProperties.ts` - Utility functions for working with campus properties
- `components/CampusPropertyCard.tsx` - Component for displaying campus properties
- `components/CampusPropertyModal.tsx` - Modal for displaying campus property details
- `pages/index.tsx` - Main page that displays properties, including campus properties
- `data/campus-properties.json` - JSON file containing campus properties 