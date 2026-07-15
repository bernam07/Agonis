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

import { Coffee } from 'lucide-react'

export default function Footer({ onNavigate, showKofi = true }: { onNavigate: (tab: string) => void; showKofi?: boolean }) {
  return (
    <footer className="mt-16 py-10 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center">
      {showKofi && (
      <div className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full text-center">
        <h3 className="text-zinc-900 dark:text-white font-bold mb-2 flex items-center justify-center gap-2">
          Support Agonis <Coffee className="w-5 h-5 text-amber-600" />
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-4">
          Agonis is built and maintained by a solo developer. If you enjoy tracking your games here,
          consider buying me a coffee to keep the servers running!
        </p>
        <a
          href="https://ko-fi.com/bernam07"
          target="_blank"
          rel="noreferrer"
          className="inline-block w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-black text-sm py-3 px-4 rounded-xl transition-colors"
        >
          Donate
        </a>
      </div>
      )}

      <div className="flex justify-center gap-6 text-xs font-bold text-zinc-500 mb-6">
        <button onClick={() => onNavigate('faq')} className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
          FAQ
        </button>
        <button
          onClick={() => onNavigate('policy')}
          className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
        >
          Privacy Policy
        </button>
        <button
          onClick={() => onNavigate('terms')}
          className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
        >
          Terms of Service
        </button>
        <a href="mailto:contact@agonis.xyz" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
          Contact Us
        </a>
      </div>

      <p className="text-zinc-500 dark:text-zinc-600 text-xs font-medium mb-2">
        Game data and artwork provided by{' '}
        <a
          href="https://www.igdb.com"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          IGDB.com
        </a>
        .
      </p>

      <p className="text-zinc-400 dark:text-zinc-700 text-[10px] mt-2 uppercase tracking-widest">
        © {new Date().getFullYear()} Agonis
      </p>
    </footer>
  )
}
