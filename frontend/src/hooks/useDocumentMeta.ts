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

import { useEffect } from 'react'

const DEFAULT_TITLE = 'Agonis'

// Client-side only: updates the tab title/meta description while a page is mounted, and restores
// the defaults on unmount. This does NOT make content crawlable by search engines or link-preview
// bots (they don't execute JS) — true SEO for these pages needs server-side rendering/prerendering.
export function useDocumentMeta(title: string | undefined, description?: string) {
  useEffect(() => {
    if (!title) return
    const previousTitle = document.title
    document.title = `${title} · Agonis`

    const metaDescription = document.querySelector('meta[name="description"]')
    const previousDescription = metaDescription?.getAttribute('content') ?? null
    if (description && metaDescription) {
      metaDescription.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle || DEFAULT_TITLE
      if (metaDescription && previousDescription !== null) {
        metaDescription.setAttribute('content', previousDescription)
      }
    }
  }, [title, description])
}
