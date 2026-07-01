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

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'search' | 'library'>('library')
  const [darkMode, setDarkMode] = useState(true) // Começa em Dark Mode!

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return (
    <div className={darkMode ? 'dark' : ''}>
      <Auth />
    </div>
  )

  const btnClass = "px-6 py-2 rounded-xl font-bold transition-all shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#111827,-6px_-6px_12px_#374151]"
  const activeBtnClass = "px-6 py-2 rounded-xl font-bold transition-all text-blue-500 shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_#111827,inset_-4px_-4px_8px_#374151]"

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-sans pb-12 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
          
          <header className="px-8 py-6 mb-12 flex flex-col md:flex-row justify-between items-center rounded-3xl bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#111827,-8px_-8px_16px_#374151] gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-500">Agonis</h1>
            
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <button 
                onClick={() => setActiveTab('library')}
                className={activeTab === 'library' ? activeBtnClass : btnClass}
              >
                My Library
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={activeTab === 'search' ? activeBtnClass : btnClass}
              >
                Add Games
              </button>
              
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 mx-2"></div>
              
              <button onClick={() => setDarkMode(!darkMode)} className={`text-xl ${btnClass}`}>
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button onClick={() => supabase.auth.signOut()} className={`text-red-500 ${btnClass}`}>
                Logout
              </button>
            </div>
          </header>
          
          <main>
            {activeTab === 'search' ? <GameSearch /> : <MyLibrary />}
          </main>
        </div>
      </div>
    </div>
  )
}