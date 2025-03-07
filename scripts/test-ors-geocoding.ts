const nodeFetch = require('node-fetch');
require('dotenv').config();

// Instead of using dotenv, get the API key directly from process.env
// Make sure to set the environment variable before running the script
// export ORS_API_KEY=your_api_key_here
async function testOrsGeocoding() {
  const address = 'Loughborough University, Loughborough, UK';
  const apiKey = process.env.ORS_API_KEY;

  console.log(
    `Using API key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'undefined'}`
  );

  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(
    address
  )}`;

  try {
    const response = await nodeFetch(url);
    const data = await response.json();

    console.log('API Response Status:', data.status || 'OK');

    if (data && data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      console.log('Coordinates:', lat, lon);
    } else {
      console.log('No results found');
    }

    console.log('Full Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing geocoding:', error);
  }
}

testOrsGeocoding();
