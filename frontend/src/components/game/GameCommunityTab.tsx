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

import { Star } from 'lucide-react'

interface GameCommunityTabProps {
  communityLoading: boolean;
  communityAvg: string;
  communityReviews: any[];
}

export default function GameCommunityTab({ communityLoading, communityAvg, communityReviews }: GameCommunityTabProps) {
  if (communityLoading) {
    return (
      <div className="text-zinc-500 text-xs font-bold text-center py-8 animate-pulse">Loading community insights...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Global Agonis Rating</span>
        <div className="text-5xl font-black text-amber-400 drop-shadow-md flex items-baseline gap-1">
          {communityAvg} <span className="text-2xl text-zinc-600">/ 5</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Community Reviews</h4>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        {communityReviews.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 font-medium text-sm border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
            No written reviews yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-3">
            {communityReviews.map((rev, idx) => (
              <div key={idx} className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                      {rev.profiles?.avatar_url ? (
                        <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                          {rev.profiles?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-zinc-200">@{rev.profiles?.username || 'unknown'}</span>
                  </div>
                  {rev.rating > 0 && (
                    <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3" fill={rev.rating >= star ? 'currentColor' : 'none'} strokeWidth={rev.rating >= star ? 0 : 2} />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">{rev.review}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
