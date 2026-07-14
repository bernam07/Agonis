/*
 Copyright 2026 Bernardo Miguel Fernandes Martins

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

export function GameSkeleton() {
  return (
    <div className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl p-3 flex flex-col animate-pulse">
      <div className="aspect-3/4 rounded-xl bg-zinc-300 dark:bg-zinc-800/50 mb-3 w-full"></div>
      <div className="h-4 bg-zinc-300 dark:bg-zinc-800/50 rounded w-3/4 mx-auto mt-auto"></div>
    </div>
  )
}

export function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: 10 }).map((_, i) => <GameSkeleton key={i} />)}
    </div>
  )
}

export function PostSkeleton() {
  return (
    <div className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-3xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-zinc-300 dark:bg-zinc-800/50 shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-zinc-300 dark:bg-zinc-800/50 rounded w-24"></div>
          <div className="h-2 bg-zinc-300 dark:bg-zinc-800/50 rounded w-16"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-zinc-300 dark:bg-zinc-800/50 rounded w-full"></div>
        <div className="h-3 bg-zinc-300 dark:bg-zinc-800/50 rounded w-5/6"></div>
        <div className="h-3 bg-zinc-300 dark:bg-zinc-800/50 rounded w-4/6"></div>
      </div>
    </div>
  )
}