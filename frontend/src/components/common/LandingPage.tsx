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

import { useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Library, Star, Users, Trophy, DownloadCloud, Smartphone, Sparkles, ShieldCheck, Check } from 'lucide-react'
import Footer from './Footer'
import { PLAN_FEATURES, PREMIUM_PRICE } from '../../lib/plans'

const FEATURES = [
  {
    icon: Library,
    color: 'text-indigo-600 dark:text-indigo-400',
    title: 'Build your Library',
    desc: "Search a massive database to log what you've played. Organize your backlog, current playthroughs, and 100% completions.",
  },
  {
    icon: Star,
    color: 'text-amber-500 dark:text-amber-400',
    title: 'Rate & Review',
    desc: 'Score games out of 5 stars, write your thoughts, and log the exact date you finished them.',
  },
  {
    icon: Users,
    color: 'text-emerald-600 dark:text-emerald-400',
    title: 'Social Feed',
    desc: 'Follow friends, like posts, and tag specific games in your updates. Export beautiful review cards to share on Instagram or X.',
  },
  {
    icon: Trophy,
    color: 'text-amber-500 dark:text-amber-400',
    title: 'Masterpieces Showcase',
    desc: 'Every 5-star game you rate is automatically featured on your profile as a Masterpiece.',
  },
  {
    icon: DownloadCloud,
    color: 'text-purple-600 dark:text-purple-400',
    title: 'Import from Steam',
    desc: 'Premium members can pull their entire owned-games library straight from Steam in one click.',
  },
  {
    icon: Smartphone,
    color: 'text-rose-600 dark:text-rose-400',
    title: 'Install as an App',
    desc: 'Agonis is a PWA — install it on your phone or desktop and use it like a native app, even offline.',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5 },
}

const PrivacyPolicy = lazy(() => import('../legal/PrivacyPolicy'))
const FAQ = lazy(() => import('../legal/FAQ'))
const TermsOfService = lazy(() => import('../legal/TermsOfService'))

export default function LandingPage({ onStart }: { onStart: () => void }) {
  const [currentView, setCurrentView] = useState<'landing' | 'policy' | 'faq' | 'terms'>('landing')

  if (currentView === 'policy') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 flex flex-col items-center pt-12 transition-colors duration-300">
        <div className="w-full max-w-3xl">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <Suspense fallback={null}>
            <PrivacyPolicy />
          </Suspense>
        </div>
      </div>
    )
  }

  if (currentView === 'faq') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 flex flex-col items-center pt-12 transition-colors duration-300">
        <div className="w-full max-w-3xl">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <Suspense fallback={null}>
            <FAQ />
          </Suspense>
        </div>
      </div>
    )
  }

  if (currentView === 'terms') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 flex flex-col items-center pt-12 transition-colors duration-300">
        <div className="w-full max-w-3xl">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <Suspense fallback={null}>
            <TermsOfService />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col transition-colors duration-300">
      <nav className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/agonis.svg" alt="" className="w-8 h-8 rounded-lg" />
            <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">AGONIS</h1>
          </div>
          <button
            onClick={onStart}
            className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center text-center px-6 py-20">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white mb-6 leading-tight max-w-4xl">
          Track, rate, and discuss <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-500">
            every game you play.
          </span>
        </h2>

        <p className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mb-8 leading-relaxed">
          Your personal gaming diary. Build your library, write reviews, generate aesthetic share
          cards, and connect with a community of gamers.
        </p>

        <button
          onClick={onStart}
          className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 text-lg font-black px-8 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transform hover:-translate-y-1"
        >
          Join Agonis for Free
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs font-bold text-zinc-500 dark:text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Free to join
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Installable app
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Your data, your rules
          </span>
        </div>

        <motion.div
          {...fadeUp}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-28 text-left"
        >
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl">
              <div className={`mb-4 ${color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeUp} className="w-full max-w-3xl mt-28">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">Free to use. Better with Premium.</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium max-w-md">
              Every core feature is free, forever. A one-time <span className="font-bold text-amber-600 dark:text-amber-400">{PREMIUM_PRICE}</span> payment
              unlocks a few extras for anyone who wants to support the project — no subscription.
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-left">
            <div className="space-y-2">
              {PLAN_FEATURES.map((feature) => (
                <div key={feature.label} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 gap-3">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">{feature.label}</span>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-zinc-500 w-24 text-right">{feature.free}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold w-24 text-right flex items-center justify-end gap-1">
                      {feature.premium === 'Included' && <Check className="w-3 h-3" />}
                      {feature.premium}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="w-full max-w-2xl mt-28 pb-4">
          <div className="bg-linear-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 md:p-14 shadow-xl shadow-indigo-600/20">
            <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to start your game diary?</h3>
            <p className="text-indigo-100 text-sm font-medium mb-8 max-w-md mx-auto">
              Join Agonis and start tracking what you play in less than a minute.
            </p>
            <button
              onClick={onStart}
              className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg font-black px-8 py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1"
            >
              Join Agonis for Free
            </button>
          </div>
        </motion.div>
      </main>

      <Footer onNavigate={(tab) => setCurrentView(tab as any)} />
    </div>
  )
}
