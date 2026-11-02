import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spendly",
    short_name: "Spendly",
    description: "Personal expense tracker",
    // Keep the id the old start_url gave the app, so existing installs stay the same app.
    id: "/",
    // Installed app opens straight on the current month (proxy sends signed-out users to "/").
    start_url: "/m",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-maskable", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
