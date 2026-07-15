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

import { AnimatePresence, motion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'

export default function CookieConsentBanner() {
  const { consent, accept, reject } = useCookieConsent()

  return (
    <AnimatePresence>
      {consent === null && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 inset-x-0 z-70 p-4"
        >
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Cookie className="w-6 h-6 text-indigo-500 shrink-0 hidden sm:block" />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium flex-1">
              We use essential storage to run Agonis, and optional error/analytics tools (Sentry,
              Vercel Analytics) to fix bugs and understand usage. No advertising or cross-site
              tracking. See our Privacy Policy for details.
            </p>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={reject}
                className="flex-1 sm:flex-none bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={accept}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
