// src/lib/validators/corporate-email.ts
// Validates that an email uses a corporate domain (not a free/consumer email provider).
// This reduces the risk of fake job postings while keeping friction low.

const FREE_EMAIL_DOMAINS = new Set([
  // Global
  "gmail.com",
  "yahoo.com",
  "yahoo.es",
  "yahoo.com.mx",
  "yahoo.com.ar",
  "yahoo.com.br",
  "yahoo.com.co",
  "hotmail.com",
  "hotmail.es",
  "hotmail.com.mx",
  "hotmail.com.ar",
  "hotmail.com.br",
  "outlook.com",
  "outlook.es",
  "live.com",
  "live.com.mx",
  "live.com.ar",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "mail.ru",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "sohu.com",
  // LATAM common
  "terra.com",
  "terra.com.br",
  "terra.com.mx",
  "terra.es",
  "bol.com.br",
  "uol.com.br",
  "ig.com.br",
  "r7.com",
  "globo.com",
  "globomail.com",
  "oi.com.br",
  "personal.com.ar",
  "fibertel.com.ar",
  "speedy.com.ar",
  "ciudad.com.ar",
  "arnet.com.ar",
  "mandic.com.br",
  "netvirtua.com.br",
  "virtua.com.br",
]);

export function isCorporateEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex < 0 || atIndex === normalized.length - 1) return false;
  const domain = normalized.slice(atIndex + 1);
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export function getCorporateEmailError(email: string): string {
  return `El email ${email} no parece ser corporativo. Usa el email de tu empresa (ej: nombre@empresa.com) para publicar ofertas.`;
}
