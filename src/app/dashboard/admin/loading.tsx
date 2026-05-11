export default function AdminLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="skeleton h-7 w-36 rounded mb-1" />
      <div className="skeleton h-4 w-56 rounded mb-8" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-5 w-12 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Review queue table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="skeleton w-14 h-9 rounded shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="skeleton h-3.5 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
