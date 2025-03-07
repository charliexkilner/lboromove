import type { PrismaClient } from '@prisma/client';
const nodeFetch = require('cross-fetch');

async function testTopLetsApi() {
  try {
    console.log('Testing Top Lets API access...');

    // Try to discover WordPress REST API endpoints
    const response = await nodeFetch('https://www.top-lets.co.uk/wp-json/');
    const data = await response.json();

    console.log('API discovery response status:', response.status);
    console.log('API routes found:', Object.keys(data.routes || {}).length);

    // Look for property-related endpoints
    const propertyEndpoints = Object.keys(data.routes || {}).filter(
      (route) =>
        route.includes('propert') ||
        route.includes('listing') ||
        route.includes('house')
    );

    console.log('Property-related endpoints:', propertyEndpoints);

    // Try a few common WordPress API patterns for real estate
    const apiPatterns = [
      'https://www.top-lets.co.uk/wp-json/wp/v2/properties',
      'https://www.top-lets.co.uk/wp-json/wp/v2/posts?search=loughborough',
      'https://www.top-lets.co.uk/wp-json/toplets/v1/properties',
    ];

    for (const apiUrl of apiPatterns) {
      try {
        console.log(`Testing API endpoint: ${apiUrl}`);
        const apiResponse = await nodeFetch(apiUrl);
        const apiData = await apiResponse.json();

        console.log(`Response status: ${apiResponse.status}`);
        console.log(
          `Data type: ${Array.isArray(apiData) ? 'Array' : typeof apiData}`
        );
        console.log(
          `Data length: ${Array.isArray(apiData) ? apiData.length : 'N/A'}`
        );

        if (Array.isArray(apiData) && apiData.length > 0) {
          console.log(
            'First item sample:',
            JSON.stringify(apiData[0]).substring(0, 300)
          );
        }
      } catch (error) {
        console.log(`Error testing ${apiUrl}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error testing Top Lets API:', error);
  }
}

testTopLetsApi();
