import { Content, GoogleGenerativeAI } from "@google/generative-ai";
import { AIModelKey } from "./governance";
import { getAIKey, getModelId, getAIProvider, getAIUsageMode } from "./model-selection";

let aiClient: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  if (aiClient) return aiClient;

  const apiKey = getAIKey();
  if (!apiKey) {
    throw new Error("AI key is not configured for the current provider.");
  }

  aiClient = new GoogleGenerativeAI(apiKey);
  return aiClient;
}

export function getActiveProvider(): string {
  return getAIProvider();
}

export function getActiveUsageMode(): string {
  return getAIUsageMode();
}

export function getGenerativeModel(modelKey: AIModelKey) {
  return getAIClient().getGenerativeModel({ model: getModelId(modelKey) });
}

export async function generateText(modelKey: AIModelKey, prompt: string) {
  const model = getGenerativeModel(modelKey);
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function generateTextWithContents(modelKey: AIModelKey, contents: Content[]) {
  const model = getGenerativeModel(modelKey);
  const result = await model.generateContent({ contents });
  return result.response.text().trim();
}
