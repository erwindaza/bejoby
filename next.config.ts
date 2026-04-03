import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "bejoby.com" }],
        destination: "https://www.bejoby.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
