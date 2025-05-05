import { PEXELS_API_KEY } from "astro:env/server";

export interface PexelsImage {
  url: string;
  photographer: string;
  photographerUrl: string;
  source: string;
}

interface PexelsPhoto {
  id: number;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
  prev_page?: string;
  next_page?: string;
}

const MAX_REQUESTS_PER_HOUR = 200;
const requestTimes: number[] = [];

function canMakeRequest(): boolean {
  const now = Date.now();
  // Remove requests older than an hour
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

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as PexelsSearchResponse;

    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
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
