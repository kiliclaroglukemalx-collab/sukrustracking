/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/yatirim-performans", destination: "/raporlar/yatirim-performans", permanent: true },
      { source: "/raporlar/performans", destination: "/raporlar", permanent: true },
    ];
  },
}

export default nextConfig
