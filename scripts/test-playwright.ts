import { chromium } from '@playwright/test';

async function testPlaywright() {
  console.log('Testing Playwright installation...');

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page title:', title);

    await browser.close();
    console.log('Playwright test successful!');
  } catch (error) {
    console.error('Playwright test failed:', error);
  }
}

testPlaywright();
