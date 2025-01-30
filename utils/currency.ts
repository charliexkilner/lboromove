const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = 'GBP';

interface ExchangeRates {
  CNY: number;
  INR: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  // Return cached rates if they're still valid
  if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`
    );
    const data = await response.json();

    cachedRates = {
      CNY: data.conversion_rates.CNY,
      INR: data.conversion_rates.INR,
    };
    lastFetchTime = now;

    return cachedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Fallback rates if API fails
    return {
      CNY: 9.11,
      INR: 106.93,
    };
  }
}

export function formatPriceWithCurrency(
  amount: number,
  locale: string
): string {
  const gbpPrice = `£${amount}`;

  switch (locale) {
    case 'hi':
      return `${gbpPrice} / ₹${(amount * (cachedRates?.INR || 106.93)).toFixed(
        2
      )}`;
    case 'zh':
      return `${gbpPrice} / ¥${(amount * (cachedRates?.CNY || 9.11)).toFixed(
        2
      )}`;
    default:
      return gbpPrice;
  }
}
