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

const STORAGE_KEY = 'agonis_cookie_consent'

export type CookieConsent = 'accepted' | 'rejected'

// Storing the choice itself in localStorage is strictly necessary to remember it and
// doesn't require consent — only the optional trackers it gates (Sentry, Vercel
// Analytics) do.
export function getCookieConsent(): CookieConsent | null {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'accepted' || value === 'rejected' ? value : null
}

export function setCookieConsent(value: CookieConsent) {
  localStorage.setItem(STORAGE_KEY, value)
}

export function clearCookieConsent() {
  localStorage.removeItem(STORAGE_KEY)
}
