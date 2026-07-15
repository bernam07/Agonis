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

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Crown, ListChecks, Image, Palette, BarChart3, DownloadCloud, Copy, Check, HeartHandshake } from 'lucide-react'
import { PLAN_FEATURES } from '../../lib/plans'
import { supabase } from '../../lib/supabase'
import { useCurrentUserId } from '../../hooks/useCurrentUserId'

const KOFI_URL = 'https://ko-fi.com/bernam07'

const HIGHLIGHTS = [
  { icon: ListChecks, title: 'Unlimited custom lists', desc: 'Build as many "Top 10" or backlog lists as you want, no cap.' },
  { icon: Image, title: 'Watermark-free share cards', desc: 'Your review and post cards export clean, without Agonis branding.' },
  { icon: Palette, title: 'Custom profile accent color', desc: 'Pick a color that shows up on your username and profile header.' },
  { icon: BarChart3, title: 'Advanced stats', desc: 'Monthly activity, rating distribution, and platform breakdowns.' },
  { icon: DownloadCloud, title: 'Auto-import your library', desc: 'Pull your owned games straight from Steam.' },
]

interface PremiumTabProps {
  isPremium: boolean
}

export default function PremiumTab({ isPremium }: PremiumTabProps) {
  const { data: userId } = useCurrentUserId()
  const [copied, setCopied] = useState(false)

  const { data: username } = useQuery({
    queryKey: ['premium-tab-username', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('username').eq('id', userId as string).single()
      return data?.username as string | undefined
    },
    enabled: !!userId,
  })

  const handleCopyUsername = async () => {
    if (!username) return
    try {
      await navigator.clipboard.writeText(username)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select and copy your username manually.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
          {isPremium ? "You're Premium!" : 'Go Premium'}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium max-w-md">
          {isPremium
            ? 'Thanks for supporting Agonis. All Premium features below are unlocked on your account.'
            : 'Unlock unlimited lists, watermark-free share cards, and a custom profile accent color with a one-time payment.'}
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

      {!isPremium && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider">How to unlock Premium</h3>
          <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 font-medium list-decimal list-inside">
            <li>Make a one-time payment on our Ko-fi page (any amount).</li>
            <li>
              In the support message, write your Agonis username:{' '}
              {username ? (
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  @{username}
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="font-bold">your username (find it on your profile)</span>
              )}
              .
            </li>
            <li>Premium unlocks automatically on your account, usually within a minute.</li>
          </ol>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm px-6 py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <HeartHandshake className="w-4 h-4" />
            Support on Ko-fi
          </a>
          <p className="text-[11px] text-zinc-500 font-medium">
            If Premium doesn't unlock within a few minutes, double-check the username in your message and{' '}
            <a href="mailto:contact@agonis.xyz" className="text-indigo-600 dark:text-indigo-400 hover:underline">contact us</a>.
          </p>
        </div>
      )}

      {isPremium && (
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer"
          className="text-center text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          Want to support Agonis again? Visit our Ko-fi page.
        </a>
      )}
    </div>
  )
}
