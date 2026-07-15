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

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { X, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface SteamImportModalProps {
  onClose: () => void
  onImported: () => void
}

export default function SteamImportModal({ onClose, onImported }: SteamImportModalProps) {
  const [steamId, setSteamId] = useState('')
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (!steamId.trim() || importing) return
    setImporting(true)
    const { data, error } = await supabase.functions.invoke('import-steam', { body: { steamId: steamId.trim() } })
    setImporting(false)

    if (error) {
      toast.error('Steam import failed. Check the Steam ID/profile URL and try again.')
      return
    }
    if (data?.error) {
      toast.error(data.error)
      return
    }
    if (data.message) {
      toast.info(data.message)
      return
    }

    const parts = [`${data.imported} new game${data.imported === 1 ? '' : 's'} imported`]
    if (data.alreadyTracked) parts.push(`${data.alreadyTracked} already in your library`)
    if (data.unmatched) parts.push(`${data.unmatched} couldn't be matched`)
    toast.success(parts.join(' · '))

    if (data.debug) {
      console.error('[import-steam] IGDB matching diagnostic:', data.debug)
      toast.error(`Matching diagnostic (see console): ${data.debug}`, { duration: 15000 })
    }
    if (data.insertError) {
      console.error('[import-steam] Insert error:', data.insertError)
      toast.error(`Save error (see console): ${data.insertError}`, { duration: 15000 })
    }

    if (data.imported > 0) onImported()
    if (!data.debug && !data.insertError) onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 py-8 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 m-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            Import from Steam
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="Steam ID, vanity name, or profile URL"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 text-sm"
        />
        <p className="text-xs text-zinc-500 font-medium">
          Your Steam profile and game details must be public. New games are added to your backlog — games you already track are never overwritten. Large libraries can take up to a minute.
        </p>

        <button
          onClick={handleImport}
          disabled={!steamId.trim() || importing}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
        >
          {importing ? 'Importing...' : 'Import Library'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
