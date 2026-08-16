import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as matchAnalysis from '../match-analysis';

// Mock dependencies (GCP, Gemini, etc.)
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: async () => ({
          response: {
            text: () => JSON.stringify({
              score: 80,
              summary: 'Buen candidato',
              strengths: ['Experiencia relevante'],
              gaps: ['Falta de inglés'],
              recommendation: 'Entrevistar',
            }),
          },
        }),
      };
    }
  },
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn().mockImplementation(() => ({
    bucket: () => ({
      file: () => ({
        download: async () => [Buffer.from('CV text')],
      }),
    }),
  })),
}));

vi.mock('../anonymize', () => ({
  anonymizeForLLM: (txt: string) => txt,
}));

// Basic test for analyzeWithAI

describe('analyzeWithAI', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });
  it('should return a valid MatchAnalysis object', async () => {
    const result = await matchAnalysis.analyzeWithAI(
      'CV text',
      'Desarrollador',
      'Desarrollar aplicaciones',
      'Mensaje del candidato'
    );
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('recommendation');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
