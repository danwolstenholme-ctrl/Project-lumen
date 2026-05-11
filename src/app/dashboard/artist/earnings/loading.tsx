export default function EarningsLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-6 w-28 rounded" />
          <div className="skeleton h-3.5 w-56 rounded" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-5 w-20 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 mb-8">
        <div className="skeleton h-4 w-36 rounded mb-5" />
        <div className="flex items-end gap-3 h-44">
          {[60, 30, 80, 45, 100, 55, 70, 40, 90, 65, 50, 75].map((h, i) => (
            <div key={i} className="skeleton flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-3.5 flex-1 rounded" />
              <div className="skeleton h-3.5 w-16 rounded" />
              <div className="skeleton h-3.5 w-16 rounded" />
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Payout settings */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <div className="skeleton h-4 w-32 rounded mb-1" />
        <div className="skeleton h-3 w-64 rounded mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeleton h-10 rounded-lg" />
          <div className="skeleton h-10 rounded-lg md:col-span-2" />
        </div>
        <div className="skeleton h-10 w-40 rounded-lg mt-5" />
      </div>
    </div>
  );
}
