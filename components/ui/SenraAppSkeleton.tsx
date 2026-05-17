export default function SenraAppSkeleton() {
  return (
    <div className="flex h-screen w-full bg-bg-void overflow-hidden">
      {/* Map area */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <div className="skeleton h-7 w-36" />
          <div className="skeleton h-7 w-20" />
        </div>
        <div className="flex gap-2">
          {[100, 70, 90, 80, 110, 75].map((w, i) => (
            <div key={i} className="skeleton h-8 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="skeleton flex-1 rounded-2xl" style={{ minHeight: 400 }} />
      </div>
      {/* Side panel — hidden on mobile */}
      <div className="hidden lg:flex w-[380px] border-l border-border-subtle flex-col gap-5 p-6">
        <div className="skeleton h-8 w-3/5" />
        <div className="skeleton h-6 w-32 rounded-full" />
        <div className="skeleton w-24 h-24 rounded-full self-center" />
        {[85, 60, 75, 50, 90, 65, 55].map((w, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="skeleton h-3" style={{ width: `${w}%` }} />
            <div className="skeleton h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
