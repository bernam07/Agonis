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
import { Trash2, AlertTriangle } from 'lucide-react'

interface ProfileActivityProps {
  myPosts: any[];
  isCurrentUser: boolean;
  deletePost: (id: string) => void;
}

export default function ProfileActivity({ myPosts, isCurrentUser, deletePost }: ProfileActivityProps) {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({})

  if (myPosts.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm font-medium">
        No activity yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {myPosts.map((post) => {
        const isSpoiler = post.has_spoilers && !revealedSpoilers[post.id]

        return (
          <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 relative">
            {isCurrentUser && (
              <button onClick={() => deletePost(post.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-rose-500 transition-colors" title="Delete Post">
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {post.game_name && (
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">{post.game_name}</div>
            )}

            {isSpoiler ? (
              <div className="bg-zinc-100/80 dark:bg-zinc-950/80 border border-amber-500/30 rounded-xl p-6 text-center my-3 backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-amber-600 dark:text-amber-500 font-bold text-sm mb-2">Spoiler Warning</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-4">This post contains story spoilers.</p>
                <button
                  onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [post.id]: true }))}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border border-amber-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  Reveal Spoiler
                </button>
              </div>
            ) : (
              <>
                <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed font-medium">{post.content}</p>
                {post.image_url && <img src={post.image_url} className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-h-64 object-cover" />}
              </>
            )}

            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-600 mt-4">
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}