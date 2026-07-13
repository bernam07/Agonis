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

interface GameDetailsTabProps {
  displayGame: any;
  detailsLoading: boolean;
}

export default function GameDetailsTab({ displayGame, detailsLoading }: GameDetailsTabProps) {
  if (detailsLoading) {
    return (
      <div className="text-zinc-500 text-xs font-bold text-center py-8 animate-pulse">
        Loading details...
      </div>
    )
  }

  return (
    <>
      {displayGame.summary && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              About
            </h4>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            {displayGame.summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayGame.platforms && displayGame.platforms.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
              Platforms
            </h4>
            <div className="flex flex-wrap gap-2">
              {displayGame.platforms.map((p: any) => (
                <span
                  key={p.id}
                  className="text-[11px] bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg font-bold shadow-sm"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
            Get this game
          </h4>
          <div className="flex gap-2">
            <a
              href={`https://store.steampowered.com/search/?term=${encodeURIComponent(displayGame.name || displayGame.game_name)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-[#171a21] hover:bg-[#2a475e] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Steam
            </a>
            <a
              href={`https://store.playstation.com/search/${encodeURIComponent(displayGame.name || displayGame.game_name)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-[#00439c] hover:bg-[#0070d1] text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              PlayStation
            </a>
          </div>
        </div>
      </div>
    </>
  )
}