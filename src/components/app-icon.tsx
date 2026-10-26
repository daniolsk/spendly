// Shared artwork for the generated favicon / home-screen icons.
export function AppIconArtwork({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1baf7a 0%, #0f7a55 100%)",
        color: "white",
        fontSize: size * 0.58,
        fontWeight: 700,
        fontFamily: "sans-serif",
      }}
    >
      zł
    </div>
  );
}
