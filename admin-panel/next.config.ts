import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";

// En desarrollo reutiliza las credenciales públicas de la app móvil.
// En producción se configuran como variables NEXT_PUBLIC_* en el hosting.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "",
  },
};

export default nextConfig;
