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

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-white">AGONIS</h1>
          <button 
            onClick={onStart}
            className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight max-w-4xl">
          Track, rate, and discuss <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            every game you play.
          </span>
        </h2>
        
        <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl mb-10 leading-relaxed">
          Your personal gaming diary. Build your library, write reviews, generate aesthetic share cards, and connect with a community of gamers.
        </p>
        
        <button 
          onClick={onStart}
          className="bg-white text-zinc-950 hover:bg-zinc-200 text-lg font-black px-8 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transform hover:-translate-y-1"
        >
          Join Agonis for Free
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-32 text-left">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Build your Library</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Search a massive database to log what you've played. Organize your backlog, current playthroughs, and 100% completions.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">Rate & Review</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Score games out of 5 stars, write your thoughts, and showcase your absolute Masterpieces on your public profile.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-white mb-2">Social Feed</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Follow friends, like posts, and tag specific games in your updates. Export beautiful review cards to share on Instagram or X.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-zinc-800/50 text-center">
        <p className="text-zinc-600 text-xs font-medium mb-2">
          Game data and artwork provided by <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">IGDB.com</a>.
        </p>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} Agonis
        </p>
      </footer>
    </div>
  )
}