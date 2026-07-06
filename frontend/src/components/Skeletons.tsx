export function GameSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-zinc-800/50 mb-3 w-full"></div>
      <div className="h-4 bg-zinc-800/50 rounded w-3/4 mx-auto mt-auto"></div>
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-zinc-800/50 shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-zinc-800/50 rounded w-24"></div>
          <div className="h-2 bg-zinc-800/50 rounded w-16"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
        <div className="h-3 bg-zinc-800/50 rounded w-5/6"></div>
        <div className="h-3 bg-zinc-800/50 rounded w-4/6"></div>
      </div>
    </div>
  )
}