export default function BoostLoading() {
  return (
    <div className="px-8 py-8 max-w-3xl mx-auto w-full">
      {/* Back link + header */}
      <div className="skeleton h-3.5 w-28 rounded mb-6" />
      <div className="skeleton h-7 w-44 rounded mb-1" />
      <div className="skeleton h-4 w-72 rounded mb-10" />

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="skeleton w-7 h-7 rounded-full" />
            <div className="skeleton h-3 w-14 rounded" />
            {i < 2 && <div className="skeleton w-8 h-px rounded" />}
          </div>
        ))}
      </div>

      {/* Placement cards */}
      <div className="flex flex-col gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="flex items-start gap-4">
              <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-6 w-20 rounded" />
                </div>
                <div className="skeleton h-3.5 w-full rounded" />
                <div className="skeleton h-3.5 w-3/4 rounded mt-1" />
              </div>
            </div>
          </div>
        ))}
        <div className="skeleton h-12 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
}
