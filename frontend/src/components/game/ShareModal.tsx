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
import { Download, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { supabase } from '../../lib/supabase'
import StarDisplay from '../common/StarDisplay'

export default function ShareModal({ game, userGame, onClose }: any) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [username, setUsername] = useState<string>('user')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()
        if (data) {
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
        }
      }
    }
    fetchUserData()
  }, [])

  const handleExport = async () => {
    if (!cardRef.current) return
    setExporting(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#09090b',
        useCORS: true,
      })

      const image = canvas.toDataURL('image/jpeg', 0.9)
      const link = document.createElement('a')
      link.href = image
      link.download = `agonis-${game.name.replace(/\s+/g, '-').toLowerCase()}-review.jpg`
      link.click()
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Error generating image. Try again.')
    }

    setExporting(false)
  }

  const coverUrl = game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/98 backdrop-blur-xl">
      <div className="w-full max-w-[320px] sm:max-w-340px flex flex-col items-center">
        
        <div
          ref={cardRef}
          className="w-full relative rounded-4xl overflow-hidden bg-zinc-950 border border-zinc-800 flex flex-col shadow-2xl shrink-0"
        >
          {coverUrl && (
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center blur-xl scale-110"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          )}

          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/90 to-zinc-950" />

          <div className="relative z-10 pt-8 pb-4 px-6 flex flex-col items-center">
            <h1 className="text-xl font-black tracking-tighter text-indigo-500 mb-6 drop-shadow-md">
              AGONIS
            </h1>

            <div className="w-32 aspect-3/4 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 mb-4 bg-zinc-900">
              {coverUrl && <img src={coverUrl} alt={game.name} className="w-full h-full object-cover" crossOrigin="anonymous" />}
            </div>

            <h2 className="text-xl font-black text-white text-center leading-tight mb-2">
              {game.name}
            </h2>

            {userGame?.rating > 0 && (
              <div className="mb-4">
                <StarDisplay rating={userGame.rating} size={20} />
              </div>
            )}

            {userGame?.status && (
              <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 rounded-full text-[10px] font-bold text-zinc-300 uppercase tracking-widest backdrop-blur-md">
                {userGame.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {userGame?.review && (
            <div className="relative z-10 px-6 pb-6 pt-2 flex-1 flex flex-col justify-center">
              <div className="relative">
                <span className="absolute -top-4 -left-2 text-4xl text-zinc-700 font-serif">"</span>
                <p className="text-sm font-medium text-zinc-300 leading-relaxed text-center italic relative z-10 line-clamp-6">
                  {userGame.review}
                </p>
                <span className="absolute -bottom-4 -right-2 text-4xl text-zinc-700 font-serif">"</span>
              </div>
            </div>
          )}

          <div className="relative z-10 mt-auto p-6 flex items-center justify-between border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 text-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none">Review by</p>
                <p className="text-sm font-bold text-zinc-200 leading-tight">@{username}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-black text-indigo-400">agonis.xyz</p>
            </div>
          </div>
        </div>

        <div className="flex w-full gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg shrink-0"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            {exporting ? 'Generating...' : (
              <>
                <Download className="w-5 h-5" />
                Save to Device
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
