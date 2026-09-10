import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {},
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] }];
  },
  webpack(config, { isServer, webpack }) {
    if (isServer) return config;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      https: false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:(fs|https)$/,
        (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, "");
        },
      ),
    );

    return config;
  },
};

export default nextConfig;
