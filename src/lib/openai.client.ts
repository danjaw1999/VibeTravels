import OpenAI from "openai";

if (!import.meta.env.PUBLIC_OPENAI_API_KEY) {
  throw new Error("PUBLIC_OPENAI_API_KEY environment variable is not set");
}

export const openai = new OpenAI({
  apiKey: import.meta.env.PUBLIC_OPENAI_API_KEY,
  organization: import.meta.env.OPENAI_ORGANIZATION_ID,
});
