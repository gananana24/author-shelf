import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
