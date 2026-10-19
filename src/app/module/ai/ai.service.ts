import { GoogleGenAI } from "@google/genai";

import httpStatus from "http-status";
import { AppError } from "../../utiles/appError";
import config from "../../config";

const apiKey = config.gemini_api_key;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const genAI = new GoogleGenAI({ apiKey });

const askAssistant = async (question: string) => {
  const prompt = `
You are the AI Assessment Assistant for DevAssess,
a developer assessment platform.

Help candidates with:
- Programming concepts and coding practice
- Assessment preparation strategies
- Technical interview preparation
- Web development and software engineering

Rules:
- Give clear, helpful, beginner-friendly answers.
- Use examples when useful.
- If the user asks a coding question, explain the solution.
- Do not claim to know private assessment answers.
- Keep the answer relevant to software development.

Candidate's question:
${question}
`;

  try {
    const response = await genAI.models.generateContent({
        model: "gemini-3.8-flash",
      contents: prompt,
    });

    const answer = response.text;

    if (!answer) {
      throw new AppError(httpStatus.BAD_GATEWAY, "AI did not return an answer");
    }

    return { answer };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Gemini API error:", error);

    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get a response from AI",
    );
  }
};

export const aiService = {
  askAssistant,
};
