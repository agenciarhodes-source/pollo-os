import path from "node:path";
import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/lib/legacy-redirects";

// O app mora em web/ dentro do repositório; a raiz do projeto é esta pasta.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  // Não permanentes: os endereços novos ainda podem mudar enquanto o produto se define.
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: false }));
  },
};

export default nextConfig;
