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

import { createPortal } from 'react-dom'
import PremiumUsername from '../common/PremiumUsername'

interface FollowListModalProps {
  data: { title: string; users: any[] };
  onClose: () => void;
  onUserClick?: (id: string) => void;
}

export default function FollowListModal({ data, onClose, onUserClick }: FollowListModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{data.title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold">×</button>
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {data.users.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No users found.</div>
          ) : (
            data.users.map((u: any) => (
              <div key={u.id} onClick={() => { onClose(); if (onUserClick) onUserClick(u.id); }} className="flex items-center gap-3 p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{u.username?.charAt(0).toUpperCase()}</div>}
                </div>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                  <PremiumUsername username={u.username} isPremium={u.is_premium} accentColor={u.accent_color} />
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
