import path from "node:path";
import type { NextConfig } from "next";

// O app mora em web/ dentro do repositório; a raiz do projeto é esta pasta.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;
