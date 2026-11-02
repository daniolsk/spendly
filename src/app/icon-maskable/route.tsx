import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/components/app-icon";

// Full-bleed (square, no transparent corners) home-screen icon for the manifest.
// Android crops it to its own shape, so the green fills the whole icon instead of
// sitting on a white plate; the smaller glyph stays inside the maskable safe zone.
export function GET() {
  return new ImageResponse(<AppIconArtwork size={512} glyphScale={0.5} />, { width: 512, height: 512 });
}
