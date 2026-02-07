import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Пустой turbopack config чтобы Next не ругался
  turbopack: {},
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Исключаем piper-tts из externals (не обрабатываем как модуль)
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
            if (request && request.includes('piper-tts')) {
              return callback(null, `commonjs ${request}`);
            }
            callback();
          }
        );
      }
    }
    return config;
  },
};

export default nextConfig;
