export default function QuickPlayLoading() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="shrink-0 px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="skeleton h-9 w-24 rounded-lg" />
          <div className="h-6 w-px bg-white/[0.06]" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-full max-w-4xl flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="skeleton h-6 w-32 rounded-full" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="skeleton aspect-[2/1] w-full rounded-3xl" />
            <div className="flex flex-col gap-3">
              <div className="skeleton h-3 w-40 rounded" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton aspect-video rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="w-[300px] shrink-0 border-l border-white/[0.06] flex flex-col">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <div className="skeleton h-5 w-20 rounded" />
          </div>
          <div className="flex-1 py-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="skeleton w-2 h-2 rounded-full" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
                <div className="skeleton h-3 w-12 rounded" />
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col gap-4">
            <div className="skeleton h-6 w-full rounded" />
            <div className="skeleton h-6 w-full rounded" />
          </div>
        </aside>
      </div>
    </div>
  );
}
