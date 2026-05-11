export default function VenueTablesLoading() {
  return (
    <div className="px-8 py-8 max-w-4xl mx-auto w-full">
      <div className="skeleton h-7 w-24 rounded mb-1" />
      <div className="skeleton h-4 w-96 rounded mb-8" />

      <div className="skeleton h-20 w-full rounded-xl mb-8" />

      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-5 w-20 rounded" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
            <div className="skeleton w-2 h-2 rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded" />
            <div className="flex items-center gap-1">
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="skeleton h-8 w-8 rounded-lg" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
