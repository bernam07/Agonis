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

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'feed' | 'search' | 'library' | 'profile'>('feed')
  const [globalLibrary, setGlobalLibrary] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return (
    <div className="dark bg-zinc-950 min-h-screen text-zinc-100 flex items-center justify-center">
      <Auth />
    </div>
  )

  const navItemClass = (tab: string) => `
    px-4 py-2 rounded-lg font-medium text-sm transition-all
    ${activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}
  `

  return (
    <div className="dark bg-zinc-950 min-h-screen text-zinc-100 font-sans selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter text-white">
            AGONIS
          </h1>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setActiveTab('feed')} className={navItemClass('feed')}>Feed</button>
            <button onClick={() => setActiveTab('search')} className={navItemClass('search')}>Discover</button>
            <button onClick={() => setActiveTab('library')} className={navItemClass('library')}>Library</button>
            <button onClick={() => setActiveTab('profile')} className={navItemClass('profile')}>Profile</button>
            
            <div className="w-px h-4 bg-zinc-800 mx-3"></div>
            
            <button onClick={() => supabase.auth.signOut()} className="text-xs font-semibold text-rose-500 hover:text-rose-400 px-3 py-2">
              Log out
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'search' && <GameSearch />}
        {activeTab === 'library' && <MyLibrary library={globalLibrary} setLibrary={setGlobalLibrary} />}
        {activeTab === 'profile' && <Profile library={globalLibrary} />}
      </main>
    </div>
  )
}