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

import { useRef } from 'react'
import * as htmlToImage from 'html-to-image'

export default function SharePostModal({ post, onClose }: any) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (cardRef.current) {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = `agonis-post-${post.profiles.username}.png`
      link.href = dataUrl
      link.click()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* O Card que será exportado */}
        <div 
          ref={cardRef} 
          className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-xl text-zinc-500">{post.profiles?.username?.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div>
              <div className="font-black text-white text-base">@{post.profiles.username}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Agonis Post</div>
            </div>
          </div>

          <p className="text-zinc-200 text-base leading-relaxed font-medium mb-4 whitespace-pre-wrap">
            {post.content}
          </p>

          {post.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden aspect-video border border-zinc-800">
              <img src={post.image_url} className="w-full h-full object-cover" />
            </div>
          )}

          {post.game_name && (
            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-xl mt-4">
              {post.game_cover && <img src={post.game_cover.replace('t_thumb', 't_cover_small')} className="w-8 h-10 object-cover rounded-md" />}
              <span className="text-xs font-bold text-indigo-400">{post.game_name}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-colors">Cancel</button>
          <button onClick={handleDownload} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors">Download Story</button>
        </div>
      </div>
    </div>
  )
}