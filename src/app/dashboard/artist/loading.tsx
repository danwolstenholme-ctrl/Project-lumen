export default function ArtistStudioLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Artist header card */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <div className="skeleton w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-3.5 w-72 rounded" />
          <div className="skeleton h-3 w-36 rounded mt-1" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg shrink-0" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-5 w-14 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Show list header */}
      <div className="skeleton h-4 w-24 rounded mb-4" />

      {/* Show rows */}
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="skeleton w-20 h-[52px] rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="skeleton h-3.5 w-48 rounded" />
              <div className="skeleton h-2.5 w-20 rounded" />
            </div>
            <div className="skeleton h-6 w-20 rounded shrink-0" />
            <div className="skeleton h-3 w-16 rounded shrink-0" />
            <div className="skeleton h-7 w-12 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
