export default function HeroGlow() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
    >
      <div
        className="h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px] animate-glow-pulse"
      />
    </div>
  );
}
