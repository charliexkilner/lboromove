import type { RequestInfo, RequestInit } from 'node-fetch';
const nodeFetch = require('cross-fetch');
const cheerio = require('cheerio');

async function testTopLets() {
  try {
    console.log('Testing Top Lets website access...');

    const response = await nodeFetch(
      'https://www.top-lets.co.uk/loughborough-student-houses/',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        },
      }
    );

    const html = await response.text();
    console.log(`Received ${html.length} characters of HTML`);

    const $ = cheerio.load(html);

    // Try different selectors
    console.log(
      `Property cards (.property-card): ${$('.property-card').length}`
    );
    console.log(`Properties (.property): ${$('.property').length}`);
    console.log(
      `Property items (.property-item): ${$('.property-item').length}`
    );

    // Find all available properties
    const availableProperties: Array<{ title: string; link: string }> = [];

    $('.property-card, .property, .property-item').each((_, card: any) => {
      const title = $(card).find('h2, .property-title').text().trim();
      const status = $(card)
        .find('.property-status, .status, .availability')
        .text()
        .trim();
      console.log(`Property: ${title} - Status: ${status}`);

      if (status.toLowerCase() === 'available') {
        const link = $(card).find('a').first().attr('href');
        availableProperties.push({ title, link });
      }
    });

    console.log('Available properties:', availableProperties);
  } catch (error) {
    console.error('Error testing Top Lets website:', error);
  }
}

testTopLets();
