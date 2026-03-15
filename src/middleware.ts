// src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Next.js internals (_next/...)
  // - Static files (favicon.ico, logo.svg, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
