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

import { Star } from 'lucide-react'

interface ProfileInsightsProps {
  statusData: { name: string; value: number; color: string }[]
  platformData: { name: string; count: number }[]
  maxPlatform: number
  ratingDistribution: { stars: number; count: number }[]
  maxRatingBucket: number
  monthlyActivity: { label: string; count: number }[]
  maxMonthly: number
  totalTracked: number
}

export default function ProfileInsights({
  statusData, platformData, maxPlatform, ratingDistribution, maxRatingBucket, monthlyActivity, maxMonthly, totalTracked,
}: ProfileInsightsProps) {
  if (totalTracked === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 font-medium text-sm">
        Track some games to see your insights here.
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Status breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Library Breakdown</h3>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800 mb-4">
          {statusData.map((s) => (
            <div
              key={s.name}
              title={`${s.name}: ${s.value}`}
              style={{ width: `${(s.value / totalTracked) * 100}%`, backgroundColor: s.color }}
              className="h-full first:rounded-l-full last:rounded-r-full border-r-2 border-white dark:border-zinc-900 last:border-r-0"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{s.name}</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating distribution */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {ratingDistribution
            .slice()
            .reverse()
            .map((r) => (
              <div key={r.stars} className="flex items-center gap-2.5 group">
                <span className="text-xs font-bold text-zinc-500 w-3 shrink-0 flex items-center gap-0.5">
                  {r.stars}
                  <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    title={`${r.count} game${r.count === 1 ? '' : 's'}`}
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(r.count / maxRatingBucket) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-zinc-500 w-5 text-right shrink-0">{r.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Top Platforms</h3>
        {platformData.length === 0 ? (
          <p className="text-xs text-zinc-500 font-medium">No platform data yet.</p>
        ) : (
          <div className="space-y-2">
            {platformData.slice(0, 6).map((p) => (
              <div key={p.name} className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 w-20 shrink-0 truncate">{p.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    title={`${p.count} game${p.count === 1 ? '' : 's'}`}
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(p.count / maxPlatform) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-zinc-500 w-5 text-right shrink-0">{p.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly activity */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Completed Per Month</h3>
        <div className="flex items-end justify-between gap-2 h-24">
          {monthlyActivity.map((m) => (
            <div key={m.label} className="flex-1 h-full flex flex-col items-center justify-end group relative">
              <span className="absolute -top-5 text-[10px] font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {m.count}
              </span>
              <div
                title={`${m.label}: ${m.count} completed`}
                className="w-full rounded-t-md bg-indigo-500 transition-all"
                style={{ height: `${Math.max((m.count / maxMonthly) * 100, m.count > 0 ? 6 : 2)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 mt-2">
          {monthlyActivity.map((m) => (
            <span key={m.label} className="flex-1 text-center text-[10px] font-bold text-zinc-500 uppercase">
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
