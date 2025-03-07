import fetch from 'cross-fetch';

interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocode(address: string): Promise<GeocodeResult> {
  const apiKey =
    process.env.OPENROUTE_API_KEY || process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
  if (!apiKey) {
    console.error('Environment variables:', {
      hasOpenRouteKey: !!process.env.OPENROUTE_API_KEY,
      hasNextPublicKey: !!process.env.NEXT_PUBLIC_OPENROUTE_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error(
      'OpenRouteService API key not found. Please check your .env file.'
    );
  }

  // Clean up the address
  const cleanAddress = address
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*,\s*/g, ',') // Clean up commas
    .replace(/\s+LE11\s+/g, ' ') // Remove duplicate postcodes
    .trim();

  const searchAddress = `${cleanAddress}, Loughborough, UK`;

  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(
    searchAddress
  )}&boundary.country=GBR&size=1`;

  try {
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      // Retry with just the street name and postcode
      const simplifiedAddress =
        address.split(',')[0].trim() + ', Loughborough, LE11';
      throw new Error(
        `No results found, try simplified address: ${simplifiedAddress}`
      );
    }

    const [lng, lat] = data.features[0].geometry.coordinates;
    return { lat, lng };
  } catch (error) {
    console.error(`Failed to geocode address: ${address}`, error);
    throw error;
  }
}
