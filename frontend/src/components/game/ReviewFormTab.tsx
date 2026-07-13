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

import { Lock } from 'lucide-react'

const STATUSES = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'playing', label: 'Playing' },
  { id: 'completed', label: 'Completed' },
  { id: 'dropped', label: 'Dropped' },
  { id: '100_percent', label: '100%' },
]

interface ReviewFormTabProps {
  status: string;
  setStatus: (s: string) => void;
  review: string;
  setReview: (r: string) => void;
  isReadOnly: boolean;
  myLists: any[];
  selectedListId: string;
  setSelectedListId: (id: string) => void;
  handleAddToList: () => void;
}

export default function ReviewFormTab({
  status, setStatus, review, setReview, isReadOnly,
  myLists, selectedListId, setSelectedListId, handleAddToList
}: ReviewFormTabProps) {
  
  if (isReadOnly) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <p className="text-zinc-400 text-sm font-bold">Viewing another user's log.</p>
        <p className="text-zinc-600 text-xs mt-1">Editing is disabled.</p>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Status
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 bg-zinc-950 p-1 border border-zinc-800 rounded-xl gap-1">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatus(s.id)}
              className={`py-2.5 px-2 text-center rounded-lg font-bold text-[11px] sm:text-xs transition-colors truncate ${
                status === s.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {myLists.length > 0 && (
        <div className="mb-6 bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
          <div className="flex-1 w-full min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Add to Custom List
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none truncate"
            >
              <option value="">Select a list...</option>
              {myLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddToList}
            disabled={!selectedListId}
            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
          Notes & Review
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your logs or thoughts here..."
          rows={5}
          className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 outline-none resize-none text-sm font-medium focus:border-indigo-500 transition-colors shadow-inner"
        />
      </div>
    </div>
  )
}