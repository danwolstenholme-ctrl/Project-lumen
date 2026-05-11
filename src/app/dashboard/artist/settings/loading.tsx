export default function SettingsLoading() {
  return (
    <div className="px-8 py-8 max-w-2xl mx-auto w-full">
      <div className="skeleton h-7 w-40 rounded mb-8" />

      {/* Avatar section */}
      <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="skeleton h-3.5 w-16 rounded mb-4" />
        <div className="flex items-center gap-5 mb-5">
          <div className="skeleton w-16 h-16 rounded-full shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="skeleton h-9 w-36 rounded-lg" />
            <div className="skeleton h-3 w-28 rounded" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 mb-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Slug section */}
      <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="skeleton h-3.5 w-36 rounded mb-4" />
        <div className="skeleton h-10 w-full rounded-lg" />
        <div className="skeleton h-3 w-56 rounded mt-1.5" />
      </div>

      {/* Notifications */}
      <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="skeleton h-3.5 w-28 rounded mb-4" />
        <div className="flex items-center gap-3">
          <div className="skeleton w-5 h-5 rounded shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3.5 w-56 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>
        </div>
      </div>

      <div className="skeleton h-11 w-36 rounded-lg" />
    </div>
  );
}
