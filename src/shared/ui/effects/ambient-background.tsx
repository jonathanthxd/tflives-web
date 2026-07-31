export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-20 bg-background"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary) / 0.15), transparent), " +
          "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "auto, 32px 32px",
      }}
    />
  );
}
