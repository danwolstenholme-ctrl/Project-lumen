export default function VenueLibraryLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-3.5 w-64 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* Search */}
      <div className="skeleton h-10 w-72 rounded-lg mb-8" />

      {/* Show grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
            <div className="skeleton aspect-video w-full" style={{ borderRadius: 0 }} />
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-9 w-full rounded-lg mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
