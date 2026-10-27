// Shared artwork for the generated favicon / home-screen icons: the logo tile
// (brand gradient + Lucide "wallet" glyph) used in the header and sidebar.
export function AppIconArtwork({ size, rounded = false }: { size: number; rounded?: boolean }) {
  const glyph = size * 0.58;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1baf7a 0%, #0f7a55 100%)",
        // Browsers show favicons as-is, so round them like the logo; iOS masks home-screen icons itself.
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    </div>
  );
}
