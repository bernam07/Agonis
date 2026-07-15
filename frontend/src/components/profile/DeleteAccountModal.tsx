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
import { AlertTriangle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface DeleteAccountModalProps {
  username: string
  onClose: () => void
}

export default function DeleteAccountModal({ username, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== username || deleting) return
    setDeleting(true)
    const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirmUsername: confirmText } })
    if (error || data?.error) {
      setDeleting(false)
      toast.error(data?.error ?? 'Could not delete account. Please try again.')
      return
    }
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 py-8 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-rose-500/50 rounded-3xl p-6 m-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Delete Account
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
          This permanently deletes your profile, library, posts, lists, comments, and follows. This cannot be undone.
        </p>

        <p className="text-xs text-zinc-500 font-medium">
          Type <span className="font-bold text-zinc-800 dark:text-zinc-200">{username}</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={username}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 outline-none focus:border-rose-500 text-sm"
        />

        <button
          onClick={handleDelete}
          disabled={confirmText !== username || deleting}
          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
