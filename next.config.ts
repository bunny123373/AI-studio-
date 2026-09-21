import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Emits `.next/standalone` (plus a minimal `server.js`) so the app can run
   * from a small self-hosted Docker image — see `Dockerfile` and `render.yaml`.
   * That image is what makes the REAL local audio pipeline (Python +
   * faster-whisper + FFmpeg + yt-dlp) available on a public URL.
   * Vercel ignores this flag and builds/deploys the app its own way.
   */
  output: "standalone",
};

export default nextConfig;
