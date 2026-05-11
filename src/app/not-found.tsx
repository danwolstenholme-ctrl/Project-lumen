import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#09090B] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(217,70,239,0.10) 0%, transparent 60%), " +
            "radial-gradient(ellipse 70% 50% at 90% 100%, rgba(168,85,247,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        <span
          className="text-[8rem] leading-none font-bold tracking-tighter"
          style={{
            fontFamily: "var(--font-raleway)",
            background: "linear-gradient(135deg, #D946EF, #A855F7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </span>

        <div className="flex flex-col gap-2">
          <p
            className="text-zinc-900 dark:text-white text-xl tracking-wide"
            style={{ fontFamily: "var(--font-raleway)", fontWeight: 600 }}
          >
            This scene doesn't exist.
          </p>
          <p className="text-zinc-500 dark:text-[#52525B] text-sm">
            The page you're looking for has left the stage.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 px-6 py-3 rounded-lg text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-raleway)",
            background: "linear-gradient(90deg, #D946EF, #A855F7)",
          }}
        >
          Back to Lumen
        </Link>
      </div>
    </div>
  );
}
