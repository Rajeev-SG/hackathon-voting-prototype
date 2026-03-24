/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const sgtmUpstreamOrigin = process.env.SGTM_UPSTREAM_ORIGIN;

    if (!sgtmUpstreamOrigin) {
      return [];
    }

    const upstreamOrigin = sgtmUpstreamOrigin.endsWith("/")
      ? sgtmUpstreamOrigin.slice(0, -1)
      : sgtmUpstreamOrigin;

    return [
      {
        source: "/metrics/:path*",
        destination: `${upstreamOrigin}/:path*`
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
