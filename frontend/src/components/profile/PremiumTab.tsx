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

import { Crown, ListChecks, Image, Palette, BarChart3, DownloadCloud } from 'lucide-react'
import { PLAN_FEATURES } from '../../lib/plans'

const HIGHLIGHTS = [
  { icon: ListChecks, title: 'Unlimited custom lists', desc: 'Build as many "Top 10" or backlog lists as you want, no cap.' },
  { icon: Image, title: 'Watermark-free share cards', desc: 'Your review and post cards export clean, without Agonis branding.' },
  { icon: Palette, title: 'Custom profile accent color', desc: 'Pick a color that shows up on your username and profile header.' },
  { icon: BarChart3, title: 'Advanced stats', desc: 'Monthly activity, rating distribution, and platform breakdowns.' },
  { icon: DownloadCloud, title: 'Auto-import your library', desc: 'Pull your owned games straight from Steam.' },
]

interface PremiumTabProps {
  onUpgradeClick: () => void
}

export default function PremiumTab({ onUpgradeClick }: PremiumTabProps) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Go Premium</h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium max-w-md">
          Unlock unlimited lists, watermark-free share cards, and a custom profile accent color.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-4">Free vs Premium</h3>
        <div className="space-y-2">
          {PLAN_FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 gap-3">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">{feature.label}</span>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-zinc-500 w-24 text-right">{feature.free}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold w-24 text-right">{feature.premium}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onUpgradeClick}
        className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm px-6 py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
      >
        <Crown className="w-4 h-4" />
        Upgrade to Premium
      </button>
    </div>
  )
}
