import { AIModelKey } from "./governance";

export type AIProvider = "gemini" | "vertex" | "sonet" | "local";
export type AIUsageMode = "mvp" | "pro" | "agent";

const VALID_PROVIDERS: AIProvider[] = ["gemini", "vertex", "sonet", "local"];
const VALID_MODES: AIUsageMode[] = ["mvp", "pro", "agent"];

function parseProvider(raw?: string): AIProvider {
  if (raw && VALID_PROVIDERS.includes(raw as AIProvider)) {
    return raw as AIProvider;
  }
  return "gemini";
}

function parseUsageMode(raw?: string): AIUsageMode {
  if (raw && VALID_MODES.includes(raw as AIUsageMode)) {
    return raw as AIUsageMode;
  }
  return "mvp";
}

const AI_PROVIDER = parseProvider(process.env.AI_PROVIDER);
const AI_USAGE_MODE = parseUsageMode(process.env.AI_USAGE_MODE);

const MODEL_MAP: Record<AIProvider, Record<AIModelKey, string>> = {
  gemini: {
    MATCH_ANALYSIS: "gemini-2.5-flash-lite",
    CV_CONVERTER: "gemini-2.5-flash-lite",
    COACH: "gemini-2.5-flash-lite",
  },
  vertex: {
    MATCH_ANALYSIS: "gemini-2.5-flash",
    CV_CONVERTER: "gemini-2.5-flash",
    COACH: "gemini-2.5-flash",
  },
  sonet: {
    MATCH_ANALYSIS: "sonet-1",
    CV_CONVERTER: "sonet-1",
    COACH: "sonet-1",
  },
  local: {
    MATCH_ANALYSIS: "local-small",
    CV_CONVERTER: "local-small",
    COACH: "local-small",
  },
};

const MODE_PROVIDER_OVERRIDE: Record<AIUsageMode, AIProvider | null> = {
  mvp: null,
  pro: null,
  agent: "sonet",
};

const EFFECTIVE_PROVIDER = MODE_PROVIDER_OVERRIDE[AI_USAGE_MODE] || AI_PROVIDER;

export function getAIProvider(): AIProvider {
  return EFFECTIVE_PROVIDER;
}

export function getAIUsageMode(): AIUsageMode {
  return AI_USAGE_MODE;
}

export function getModelId(modelKey: AIModelKey): string {
  const providerModelMap = MODEL_MAP[EFFECTIVE_PROVIDER] || MODEL_MAP.gemini;
  return providerModelMap[modelKey];
}

export function getAIKey(): string {
  switch (EFFECTIVE_PROVIDER) {
    case "gemini":
      return process.env.GEMINI_API_KEY || "";
    case "vertex":
      return process.env.VERTEX_API_KEY || process.env.GEMINI_API_KEY || "";
    case "sonet":
      return process.env.SONET_API_KEY || "";
    default:
      return process.env.GEMINI_API_KEY || "";
  }
}
