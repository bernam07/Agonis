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

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import GameSearch from './components/game/GameSearch'
import Auth from './components/auth/Auth'
import MyLibrary from './components/library/MyLibrary'
import Feed from './components/feed/Feed'
import Profile from './components/profile/Profile'
import Footer from './components/common/Footer'
import PrivacyPolicy from './components/legal/PrivacyPolicy'
import Notifications from './components/notifications/Notifications'
import LandingPage from './components/common/LandingPage'
import FAQ from './components/legal/FAQ'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/common/PageTransition'
import { Sun, Moon} from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'feed' | 'search' | 'library' | 'profile' | 'policy' | 'faq'
  >('feed')
  const [globalLibrary, setGlobalLibrary] = useState<any[]>([])
  const [viewedUserId, setViewedUserId] = useState<string | null>(null)

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('agonis_theme') as 'dark' | 'light') || 'dark'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const refreshLibrary = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('user_games').select('*').eq('user_id', user.id)

    if (error) {
      console.error('Erro a carregar biblioteca:', error)
      return
    }

    if (data) {
      if (data.length === 0) {
        setGlobalLibrary([])
        return
      }

      const gameIds = [...new Set(data.map((item: any) => item.igdb_id).filter(Boolean))]
      const { data: igdbGames, error: igdbError } = await supabase.functions.invoke('fetch-games', {
        body: { gameIds },
      })

      if (igdbError) {
        console.error('Erro a carregar metadados da IGDB:', igdbError)
        setGlobalLibrary(data)
        return
      }

      const formattedLibrary = data.map((item: any) => ({
        ...item,
        ...(igdbGames?.find((g: any) => g.id === item.igdb_id) ?? {}),
      }))

      setGlobalLibrary(
        formattedLibrary.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      )
    }
  }

  useEffect(() => {
    if (session) refreshLibrary()
  }, [session])

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
        setGlobalLibrary([])
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
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <PageTransition keyProp="feed">
              <Feed
                library={globalLibrary}
                onUserClick={goToProfile}
                onRefreshLibrary={refreshLibrary}
              />
            </PageTransition>
          )}
          {activeTab === 'search' && (
            <PageTransition keyProp="search">
              <GameSearch
                onUserClick={goToProfile}
                library={globalLibrary}
                onRefreshLibrary={refreshLibrary}
              />
            </PageTransition>
          )}
          {activeTab === 'library' && (
            <PageTransition keyProp="library">
              <MyLibrary library={globalLibrary} setLibrary={setGlobalLibrary} />
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
