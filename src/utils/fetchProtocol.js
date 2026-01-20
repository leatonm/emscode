/**
 * Fetches a protocol JSON from a URL
 * @param {string} url - URL to fetch protocol from
 * @returns {Promise<Object>} Parsed protocol JSON
 */
export async function fetchProtocol(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch protocol: ${res.statusText}`);
    }
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error fetching protocol:', error);
    throw error;
  }
}

