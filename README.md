# LboroMove

A platform for Loughborough students to find housing and connect with potential housemates.

## Features

- Property listings from multiple providers (Top Lets, Loc8me, Future Housing)
- Discussion forum for students
- Housemate matching
- Property search and filtering
- User profiles and authentication

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Configure your database connection and other settings

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Property Data Management

We've added scripts to help manage property data, particularly for fixing image issues and detecting duplicate properties.

### Available Scripts

#### 1. Fix Property Images

This script validates and fixes property images across all housing providers by identifying mismatched images and re-scraping from the original URLs.

```bash
npx ts-node scripts/fix-property-images.ts
```

#### 2. Detect Duplicate Properties

This script detects and optionally merges duplicate properties based on address and property details.

```bash
# Detect duplicates without making changes
npx ts-node scripts/detect-duplicate-properties.ts

# Detect and merge duplicates
npx ts-node scripts/detect-duplicate-properties.ts --apply
```

#### 3. Run All Property Fixes

To run both scripts in sequence:

```bash
./scripts/fix-all-property-issues.sh
```

For more details on these scripts, see the [scripts README](./scripts/README.md).

## Development

### Project Structure

- `/components` - React components
- `/pages` - Next.js pages
- `/prisma` - Prisma schema and migrations
- `/public` - Static assets
- `/scripts` - Utility scripts
- `/styles` - CSS and styling
- `/utils` - Utility functions

### Technologies Used

- Next.js
- React
- Prisma
- PostgreSQL
- Tailwind CSS
- TypeScript

## Campus Properties Integration

The application includes on-campus accommodation options from Loughborough University. These properties are scraped from the university's accommodation website and integrated into the main property listing.

### Scraping Campus Properties

To scrape the on-campus properties, run:

```bash
npx ts-node -P tsconfig.scripts.json scripts/scrape-campus-properties-direct.ts
```

This script fetches information from the Loughborough University accommodation website and saves it to `data/campus-properties.json`. The script extracts:

- Property title
- URL
- Image URL
- Price range
- Pricing options
- Location
- Catering type (Self-catered or Catered)
- Bathroom type (En-suite or Shared bathroom)

### Importing Campus Properties

To import the scraped campus properties into the database, run:

```bash
npx ts-node -P tsconfig.scripts.json scripts/migrate-campus-properties.ts
```

This script reads the properties from `data/campus-properties.json` and imports them into the database with the `keyFeatures.isCampusProperty` flag set to `true`.

### Displaying Campus Properties

Campus properties are displayed in the main property listing and can be filtered using the "on-campus" tab. They use the same card and modal components as other properties but display specific campus-related information like catering type and bathroom facilities instead of bedroom and bathroom counts.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 