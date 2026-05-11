export default function AdminShowsLoading() {
  return (
    <div className="px-8 py-8 max-w-5xl mx-auto w-full">
      <div className="skeleton h-7 w-36 rounded mb-1" />
      <div className="skeleton h-4 w-72 rounded mb-8" />

      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 flex items-start gap-4">
            <div className="skeleton w-32 h-20 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
              <div className="skeleton h-3 w-full rounded mt-2" />
              <div className="skeleton h-3 w-5/6 rounded" />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <div className="skeleton h-9 w-28 rounded-lg" />
              <div className="skeleton h-9 w-28 rounded-lg" />
              <div className="skeleton h-7 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
