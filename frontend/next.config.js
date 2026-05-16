/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy all /backend/* calls to FastAPI — eliminates CORS entirely
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      { source: '/backend/:path*', destination: `${apiUrl}/:path*` },
    ]
  },
}

module.exports = nextConfig
