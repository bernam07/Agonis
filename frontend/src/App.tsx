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
import GameSearch from './components/GameSearch'
import Auth from './components/Auth'
import MyLibrary from './components/MyLibrary'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Footer from './components/Footer'
import PrivacyPolicy from './components/PrivacyPolicy'
import Notifications from './components/Notifications'
import LandingPage from './components/LandingPage'
import FAQ from './components/FAQ'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'search' | 'library' | 'profile' | 'policy' | 'faq'>('feed')
  const [globalLibrary, setGlobalLibrary] = useState<any[]>([])
  const [viewedUserId, setViewedUserId] = useState<string | null>(null)
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 mb-8 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter text-indigo-600 dark:text-white">AGONIS</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => { setActiveTab('feed'); setViewedUserId(null); }} className={navItemClass('feed')}>Feed</button>
            <button onClick={() => { setActiveTab('search'); setViewedUserId(null); }} className={navItemClass('search')}>Discover</button>
            <button onClick={() => { setActiveTab('library'); setViewedUserId(null); }} className={navItemClass('library')}>Library</button>
            <button onClick={() => { setActiveTab('profile'); setViewedUserId(null); }} className={navItemClass('profile')}>Profile</button>
            
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-2"></div>
            
            <button onClick={toggleTheme} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <Notifications onUserClick={goToProfile} />
            
            <button onClick={() => supabase.auth.signOut()} className="text-xs font-semibold text-rose-500 hover:text-rose-400 px-3 py-2 ml-1">Log out</button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-5xl mx-auto px-4 flex-1 w-full">
        {activeTab === 'feed' && <Feed library={globalLibrary} onUserClick={goToProfile} />}
        {activeTab === 'search' && <GameSearch />}
        {activeTab === 'library' && <MyLibrary library={globalLibrary} setLibrary={setGlobalLibrary} />}
        {activeTab === 'profile' && (
          <Profile 
            userId={viewedUserId} 
            onBack={() => { setActiveTab('feed'); setViewedUserId(null); }} 
            onUserClick={goToProfile} 
          />
        )}
        {activeTab === 'policy' && <PrivacyPolicy />}
        {activeTab === 'faq' && <FAQ />}
      </main>

      <Footer onNavigate={(tab) => { setActiveTab(tab as any); setViewedUserId(null); }} />
    </div>
  )
}