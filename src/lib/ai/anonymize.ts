// src/lib/ai/anonymize.ts — Strip PII from text before sending to LLM (Ley 21.719 compliance)

/** Patterns to detect and remove personally identifiable information */
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Email addresses
  { pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/gi, replacement: "[EMAIL]" },
  // Chilean RUT (with dots and dash)
  { pattern: /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g, replacement: "[RUT]" },
  // Chilean RUT (without dots)
  { pattern: /\b\d{7,8}-[\dkK]\b/g, replacement: "[RUT]" },
  // Phone numbers (Chilean format: +56 9 XXXX XXXX or 9 XXXX XXXX)
  { pattern: /(?:\+?56\s?)?9\s?\d{4}\s?\d{4}/g, replacement: "[TELÉFONO]" },
  // Generic phone numbers
  { pattern: /(?:\+\d{1,3}\s?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, replacement: "[TELÉFONO]" },
  // Dates of birth patterns (dd/mm/yyyy, dd-mm-yyyy)
  { pattern: /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}\b/g, replacement: "[FECHA]" },
  // Physical addresses (common Chilean patterns)
  { pattern: /(?:calle|av\.|avenida|pasaje|psje)\s+[\w\s]+\d+/gi, replacement: "[DIRECCIÓN]" },
  // URLs that might be personal (linkedin, github profiles)
  { pattern: /https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/gi, replacement: "[LINKEDIN]" },
  { pattern: /https?:\/\/(?:www\.)?github\.com\/[\w-]+/gi, replacement: "[GITHUB]" },
];

/**
 * Remove PII from CV/resume text before sending to external LLM.
 * Preserves professional content (skills, experience, education)
 * while stripping contact info, IDs, and personal identifiers.
 */
export function anonymizeForLLM(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
