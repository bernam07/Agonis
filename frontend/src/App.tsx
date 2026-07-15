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

import { useState, useEffect, lazy, Suspense } from 'react'
import { toast } from 'sonner'
import { supabase } from './lib/supabase'
import Auth from './components/auth/Auth'
import Footer from './components/common/Footer'
import Notifications from './components/notifications/Notifications'
import LandingPage from './components/common/LandingPage'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/common/PageTransition'
import { Sun, Moon, Crown, CreditCard } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserGames } from './hooks/useUserGames'
import { usePremiumStatus } from './hooks/usePremiumStatus'
import { startCheckout, openBillingPortal } from './lib/billing'

const GameSearch = lazy(() => import('./components/game/GameSearch'))
const MyLibrary = lazy(() => import('./components/library/MyLibrary'))
const Feed = lazy(() => import('./components/feed/Feed'))
const Profile = lazy(() => import('./components/profile/Profile'))
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'))
const FAQ = lazy(() => import('./components/legal/FAQ'))
const PremiumTab = lazy(() => import('./components/profile/PremiumTab'))

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'feed' | 'search' | 'library' | 'profile' | 'premium' | 'policy' | 'faq'
  >('feed')
  const [viewedUserId, setViewedUserId] = useState<string | null>(null)

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('agonis_theme') as 'dark' | 'light') || 'dark'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const queryClient = useQueryClient()
  const userId = session?.user?.id ?? null
  const { data: globalLibrary = [] } = useUserGames(userId)
  const { data: isPremium } = usePremiumStatus(userId)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded')
    if (upgraded === 'true') {
      toast.success('Payment successful! Your Premium features are activating and should appear within a few seconds.')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (upgraded === 'cancelled') {
      toast.info('Checkout cancelled — no charge was made.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }:any) => setSession(session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event:any, session:any) => {
      setSession(session)
      if (session) {
        setShowAuth(false)
      } else {
        queryClient.clear()
        setActiveTab('feed')
        setViewedUserId(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />
    }
    return <LandingPage onStart={() => setShowAuth(true)} />
  }

  const navItemClass = (tab: string) => `
    px-4 py-2 rounded-lg font-medium text-sm transition-all
    ${activeTab === tab && !viewedUserId ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}
  `

  const goToProfile = (userId: string) => {
    setViewedUserId(userId)
    setActiveTab('profile')
    setMobileMenuOpen(false)
  }

  const goToTab = (tab: typeof activeTab) => {
    setActiveTab(tab)
    setViewedUserId(null)
    setMobileMenuOpen(false)
  }

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('agonis_theme', newTheme)
      return newTheme
    })
  }

  const handlePremiumNavClick = async () => {
    if (isPremium) {
      try {
        await openBillingPortal()
      } catch (err: any) {
        toast.error(err.message || 'Something went wrong.')
      }
    } else {
      goToTab('premium')
    }
  }

  const handleUpgradeClick = async () => {
    try {
      await startCheckout()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.')
    }
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <nav className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-clip bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 mb-8 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <h1 className="text-xl font-black tracking-tighter text-indigo-600 dark:text-white shrink-0">
            AGONIS
          </h1>

          <div className="hidden md:flex items-center gap-1 min-w-0">
            <button onClick={() => goToTab('feed')} className={navItemClass('feed')}>
              Feed
            </button>
            <button onClick={() => goToTab('search')} className={navItemClass('search')}>
              Discover
            </button>
            <button onClick={() => goToTab('library')} className={navItemClass('library')}>
              Library
            </button>
            <button onClick={() => goToTab('profile')} className={navItemClass('profile')}>
              Profile
            </button>
            <button
              onClick={handlePremiumNavClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isPremium
                  ? navItemClass('premium')
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
            >
              {isPremium ? <CreditCard className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
              {isPremium ? 'Manage Subscription' : 'Premium'}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Notifications onUserClick={goToProfile} />

            <div className="hidden md:block w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-1"></div>

            <button
              onClick={() => supabase.auth.signOut()}
              className="hidden md:inline text-xs font-semibold text-rose-500 hover:text-rose-400 px-3 py-2 ml-1"
            >
              Log out
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 -mr-2 text-zinc-600 dark:text-zinc-300"
            >
              <div className="w-5 flex flex-col gap-1.5">
                <span
                  className={`h-0.5 w-full bg-current transition-transform duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
                ></span>
                <span
                  className={`h-0.5 w-full bg-current transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
                ></span>
                <span
                  className={`h-0.5 w-full bg-current transition-transform duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex flex-col gap-1 bg-white/95 dark:bg-zinc-950/95">
            <button onClick={() => goToTab('feed')} className={`${navItemClass('feed')} text-left`}>
              Feed
            </button>
            <button onClick={() => goToTab('search')} className={`${navItemClass('search')} text-left`}>
              Discover
            </button>
            <button onClick={() => goToTab('library')} className={`${navItemClass('library')} text-left`}>
              Library
            </button>
            <button onClick={() => goToTab('profile')} className={`${navItemClass('profile')} text-left`}>
              Profile
            </button>
            <button
              onClick={() => {
                handlePremiumNavClick()
                setMobileMenuOpen(false)
              }}
              className={`flex items-center gap-1.5 text-left px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isPremium
                  ? navItemClass('premium')
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
            >
              {isPremium ? <CreditCard className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
              {isPremium ? 'Manage Subscription' : 'Premium'}
            </button>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm font-semibold text-rose-500 hover:text-rose-400 px-4 py-2 text-left"
            >
              Log out
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 flex-1 w-full flex min-w-0">
        <Suspense fallback={<div className="w-full text-center py-20 text-zinc-500 font-medium">Loading...</div>}>
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <PageTransition keyProp="feed">
              <Feed
                library={globalLibrary}
                onUserClick={goToProfile}
              />
            </PageTransition>
          )}
          {activeTab === 'search' && (
            <PageTransition keyProp="search">
              <GameSearch
                onUserClick={goToProfile}
                library={globalLibrary}
              />
            </PageTransition>
          )}
          {activeTab === 'library' && (
            <PageTransition keyProp="library">
              <MyLibrary userId={userId} />
            </PageTransition>
          )}
          {activeTab === 'profile' && (
            <PageTransition keyProp="profile">
              <Profile
                userId={viewedUserId}
                onBack={() => {
                  setActiveTab('feed')
                  setViewedUserId(null)
                }}
                onUserClick={goToProfile}
              />
            </PageTransition>
          )}
          {activeTab === 'premium' && (
            <PageTransition keyProp="premium">
              <PremiumTab onUpgradeClick={handleUpgradeClick} />
            </PageTransition>
          )}
          {activeTab === 'policy' && (
            <PageTransition keyProp="policy">
              <PrivacyPolicy />
            </PageTransition>
          )}
          {activeTab === 'faq' && (
            <PageTransition keyProp="faq">
              <FAQ />
            </PageTransition>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab as any)
          setViewedUserId(null)
        }}
      />
      <Analytics />
    </div>
  )
}
