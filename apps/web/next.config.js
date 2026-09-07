/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.PORTFOLIO_EXPORT === "1" ? "export" : undefined,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: process.env.PORTFOLIO_EXPORT === "1",
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/projects/**", search: "?v=20260907-2" },
    ],
  },
};

export default nextConfig;
