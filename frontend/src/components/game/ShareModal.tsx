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

import { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { supabase } from '../../lib/supabase'
import { Star } from 'lucide-react'

export default function ShareModal({ game, userGame, onClose }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userGame.user_id)
        .single()
      if (data) setUsername(data.username)
    }
    fetchUser()
  }, [userGame.user_id])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = `agonis-${game.name.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      alert('Failed to generate image')
    }
    setDownloading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div
          ref={cardRef}
          className="w-full aspect-[4/5] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-between p-8"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.7), rgba(9, 9, 11, 1)), url(${game.cover?.url?.replace('t_thumb', 't_1080p')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-black tracking-tighter text-indigo-500">AGONIS</h1>
            <span className="text-zinc-400 font-bold text-xs bg-zinc-950/50 px-3 py-1 rounded-full backdrop-blur-md border border-zinc-800/50">
              @{username}
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-4 mt-auto relative z-10">
            <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-zinc-700/50">
              {game.cover?.url && (
                <img
                  src={game.cover.url.replace('t_thumb', 't_cover_big')}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black text-white leading-tight mb-1">{game.name}</h2>
              <div className="flex justify-center gap-1 text-amber-400 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5"
                    fill={userGame.rating >= star ? 'currentColor' : 'none'}
                    strokeWidth={userGame.rating >= star ? 0 : 2}
                  />
                ))}
              </div>
            </div>

            {userGame.review && (
              <p className="text-zinc-300 text-sm font-medium line-clamp-4 bg-zinc-950/40 p-4 rounded-2xl backdrop-blur-md border border-zinc-800/50 w-full">
                "{userGame.review}"
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors flex justify-center items-center gap-2"
          >
            {downloading ? 'Generating...' : 'Download Card'}
          </button>
        </div>
      </div>
    </div>
  )
}
