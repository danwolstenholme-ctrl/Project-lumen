export default function UploadLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="skeleton h-7 w-40 rounded mb-1" />
      <div className="skeleton h-4 w-64 rounded mb-8" />

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="skeleton h-3.5 w-24 rounded" />
            {i < 2 && <div className="skeleton h-px w-12 rounded" />}
          </div>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Left form */}
        <div className="flex-1 max-w-xl flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-11 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-28 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="flex gap-2 flex-wrap">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="skeleton h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
          <div className="skeleton h-12 w-full rounded-lg mt-4" />
        </div>

        {/* Right spec panel */}
        <div className="hidden xl:flex w-[320px] flex-col gap-4">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
