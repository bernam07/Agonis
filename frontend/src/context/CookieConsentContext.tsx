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

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { type CookieConsent, getCookieConsent, setCookieConsent, clearCookieConsent } from '../lib/cookieConsent'
import { initSentryIfConsented } from '../lib/sentry'

interface CookieConsentContextValue {
  consent: CookieConsent | null
  accept: () => void
  reject: () => void
  openSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => getCookieConsent())

  const accept = () => {
    setCookieConsent('accepted')
    setConsent('accepted')
    initSentryIfConsented()
  }

  const reject = () => {
    setCookieConsent('rejected')
    setConsent('rejected')
  }

  // Lets a user revisit the choice later (e.g. from a "Cookie Settings" footer link)
  // without needing to clear their browser storage manually.
  const openSettings = () => {
    clearCookieConsent()
    setConsent(null)
  }

  return (
    <CookieConsentContext.Provider value={{ consent, accept, reject, openSettings }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  return context
}
