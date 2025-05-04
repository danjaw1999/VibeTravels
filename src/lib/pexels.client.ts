import { createClient, type PhotosWithTotalResults } from "pexels";

// Pexels API key should be in your .env file
const PUBLIC_PEXELS_API_KEY = import.meta.env.PUBLIC_PEXELS_API_KEY || "your_pexels_api_key";

export const pexels = createClient(PUBLIC_PEXELS_API_KEY);

export interface PexelsImage {
  url: string;
  photographer: string;
  photographerUrl: string;
  source: string;
}

const MAX_REQUESTS_PER_HOUR = 200;
const requestTimes: number[] = [];

function canMakeRequest(): boolean {
  const now = Date.now();
  // Usuń requesty starsze niż godzina
  const oneHourAgo = now - 3600000;
  while (requestTimes.length > 0 && requestTimes[0] < oneHourAgo) {
    requestTimes.shift();
  }
  return requestTimes.length < MAX_REQUESTS_PER_HOUR;
}

export async function searchAttractionImage(query: string): Promise<PexelsImage | null> {
  try {
    if (!canMakeRequest()) {
      console.warn("Pexels API rate limit reached, skipping image search");
      return null;
    }

    requestTimes.push(Date.now());

    const searchResult = (await pexels.photos.search({
      query,
      per_page: 1,
      orientation: "landscape",
    })) as PhotosWithTotalResults;

    if (searchResult.photos && searchResult.photos.length > 0) {
      const photo = searchResult.photos[0];
      return {
        url: photo.src.large2x,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: `https://www.pexels.com/photo/${photo.id}`,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch image from Pexels:", error);
    return null;
  }
}
