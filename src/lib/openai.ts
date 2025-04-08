import OpenAI from "openai";

// Initialize the OpenAI client with proper environment variable handling
const apiKey = import.meta.env.PUBLIC_OPENAI_API_KEY;

console.log(apiKey, "xdd");

if (!apiKey) {
  throw new Error("PUBLIC_OPENAI_API_KEY environment variable is required");
}

export const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export type TravelPoint = {
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type TravelPlan = {
  title: string;
  description: string;
  points: TravelPoint[];
  mapsUrl: string;
};

export async function generateTravelPlan(
  location: string,
  notes?: string
): Promise<TravelPlan> {
  const prompt = `Create a travel plan for ${location}. ${
    notes ? `Additional preferences: ${notes}` : ""
  }
  Please provide the response in JSON format with the following structure:
  {
    "title": "Trip title",
    "description": "Brief trip description",
    "points": [
      {
        "name": "Point of interest name",
        "description": "Point description",
        "location": {
          "lat": latitude_number,
          "lng": longitude_number
        }
      }
    ]
  }
  Make the response detailed but concise, and ensure all coordinates are realistic for the location.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("No response from OpenAI");

    const parsedResponse = JSON.parse(response) as Omit<TravelPlan, "mapsUrl">;

    // Create the final response with the main mapsUrl using the first point
    const finalResponse: TravelPlan = {
      ...parsedResponse,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${parsedResponse.points[0].location.lat},${parsedResponse.points[0].location.lng}`,
    };

    return finalResponse;
  } catch (error) {
    console.error("Error generating travel plan:", error);
    throw new Error("Failed to generate travel plan");
  }
}
