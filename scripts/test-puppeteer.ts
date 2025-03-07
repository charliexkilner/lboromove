import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('Testing Puppeteer installation...');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');

    const title = await page.title();
    console.log('Page title:', title);

    await browser.close();
    console.log('Puppeteer test successful!');
  } catch (error) {
    console.error('Puppeteer test failed:', error);
  }
}

testPuppeteer();
