/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_ORIGIN;

const nextConfig = {
  async rewrites() {
    if (!backendOrigin) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
