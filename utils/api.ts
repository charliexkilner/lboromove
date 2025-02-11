export async function fetchAPI(url: string, options: RequestInit = {}) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const attemptFetch = async (attempt: number = 0): Promise<any> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      // First check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the raw text first
      const text = await response.text();

      // Log the response for debugging
      console.log('Response text:', text.substring(0, 200)); // Log first 200 chars

      // Check if we got an empty response
      if (!text) {
        return [];
      }

      try {
        const data = JSON.parse(text);
        return data || [];
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Response text:', text.substring(0, 200));

        if (attempt < MAX_RETRIES) {
          console.log(`Attempt ${attempt + 1}: Parse error, retrying...`);
          await wait(RETRY_DELAY);
          return attemptFetch(attempt + 1);
        }

        throw new Error(
          `Failed to parse server response: ${parseError.message}`
        );
      }
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(`Attempt ${attempt + 1}: Retrying after error...`);
        await wait(RETRY_DELAY);
        return attemptFetch(attempt + 1);
      }
      throw error;
    }
  };

  try {
    return await attemptFetch();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
