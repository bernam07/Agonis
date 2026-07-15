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
import { Flag, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const REASONS = ['Spam', 'Harassment or hate speech', 'Inappropriate content', 'Impersonation', 'Other']

interface ReportModalProps {
  targetType: 'post' | 'user'
  targetId: string
  reporterId: string
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, reporterId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      toast.error('Could not submit report. Please try again.')
      return
    }
    toast.success('Report submitted. Thanks for helping keep Agonis safe.')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 py-8 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 m-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-500" />
            Report {targetType === 'post' ? 'Post' : 'User'}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                reason === r
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-rose-500" />
              {r}
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)"
          rows={3}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 outline-none focus:border-rose-500 text-sm resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors text-white px-4 py-3 rounded-xl font-bold text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
