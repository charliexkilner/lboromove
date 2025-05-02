interface Coordinates {
  lat: number;
  lng: number;
}

export async function getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
  try {
    // Add Loughborough to the address if not present
    const fullAddress = address.toLowerCase().includes('loughborough') 
      ? address 
      : `${address}, Loughborough, UK`;

    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Use OpenStreetMap's Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'LboroMove/1.0'
        }
      }
    );

    const data = await response.json();

    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
} 