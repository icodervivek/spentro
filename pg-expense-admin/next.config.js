/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:5000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
