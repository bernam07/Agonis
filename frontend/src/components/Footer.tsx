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

export default function Footer({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <footer className="mt-16 py-10 border-t border-zinc-800/50 flex flex-col items-center">
      
      <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full text-center">
        <h3 className="text-white font-bold mb-2">Support Agonis ☕</h3>
        <p className="text-zinc-400 text-xs font-medium mb-4">
          Agonis is built and maintained by a solo developer. If you enjoy tracking your games here, consider buying me a coffee to keep the servers running!
        </p>
        <a 
          href="https://ko-fi.com/bernam07"
          target="_blank" 
          rel="noreferrer"
          className="inline-block w-full bg-zinc-100 hover:bg-white text-zinc-950 font-black text-sm py-3 px-4 rounded-xl transition-colors"
        >
          Donate
        </a>
      </div>

      <div className="flex justify-center gap-6 text-xs font-bold text-zinc-500 mb-6">
        <button onClick={() => onNavigate('policy')} className="hover:text-zinc-300 transition-colors">Privacy Policy</button>
        <a href="mailto:contact@agonis.gg" className="hover:text-zinc-300 transition-colors">Contact Us</a>
        <a href="https://github.com/bernam07/Agonis" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
      </div>
      
      <p className="text-zinc-600 text-xs font-medium mb-2">
        Game data and artwork provided by <a href="https://www.igdb.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">IGDB.com</a>.
      </p>
      
      <p className="text-zinc-700 text-[10px] mt-2 uppercase tracking-widest">
        © {new Date().getFullYear()} Agonis
      </p>
    </footer>
  )
}