export function BackgroundPattern() {
  return (
    <section
      className="absolute inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 h-full w-full 
      bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px]"
      ></div>
    </section>
  );
}
