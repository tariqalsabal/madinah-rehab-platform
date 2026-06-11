/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // فحص ESLint والأنواع يجري في خط CI منفصلاً؛ لا نُفشل بناء الإنتاج بسببها.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // ربط الـ API الخلفي (ORDS) عبر متغير بيئة
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_API_URL}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
