/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/yatirim-performans", destination: "/raporlar/yatirim-performans", permanent: true },
    ];
  },
}

export default nextConfig
