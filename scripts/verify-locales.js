const fs = require('fs');
const path = require('path');

console.log('Verifying locale files...');

const localesPath = path.join(process.cwd(), 'public', 'locales');

if (!fs.existsSync(localesPath)) {
  console.error('ERROR: public/locales directory does not exist!');
  process.exit(1);
}

const locales = fs.readdirSync(localesPath);
console.log(`Found locales: ${locales.join(', ')}`);

// Verify English locale exists
if (!locales.includes('en')) {
  console.error('ERROR: English locale not found!');
  process.exit(1);
}

// Verify common.json exists for each locale
let hasErrors = false;
locales.forEach(locale => {
  const commonJsonPath = path.join(localesPath, locale, 'common.json');
  if (!fs.existsSync(commonJsonPath)) {
    console.error(`ERROR: common.json missing for locale '${locale}'!`);
    hasErrors = true;
  } else {
    try {
      // Verify the file is valid JSON
      const content = fs.readFileSync(commonJsonPath, 'utf8');
      JSON.parse(content);
      console.log(`✓ ${locale}/common.json is valid`);
    } catch (e) {
      console.error(`ERROR: Invalid JSON in ${locale}/common.json`);
      hasErrors = true;
    }
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log('All locale files verified successfully.'); 