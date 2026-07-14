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

interface CreatePostFormProps {
  library: any[];
  content: string;
  setContent: (val: string) => void;
  hasSpoilers: boolean;
  setHasSpoilers: (val: boolean) => void;
  selectedGame: any;
  setSelectedGame: (val: any) => void;
  showPicker: boolean;
  setShowPicker: (val: boolean) => void;
  imageFile: File | null;
  setImageFile: (val: File | null) => void;
  loading: boolean;
  uploading: boolean;
  createPost: (e: React.FormEvent) => void;
}

export default function CreatePostForm({
  library, content, setContent, hasSpoilers, setHasSpoilers,
  selectedGame, setSelectedGame, showPicker, setShowPicker,
  imageFile, setImageFile, loading, uploading, createPost
}: CreatePostFormProps) {

  return (
    <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-sm">
      <form onSubmit={createPost} className="flex flex-col gap-3">
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasSpoilers}
            onChange={(e) => setHasSpoilers(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
          />
          <span className="text-xs font-bold text-amber-500">Mark as Spoiler</span>
        </label>
        {selectedGame && (
          <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-xl w-max pr-4">
            {selectedGame.cover?.url && (
              <img
                src={selectedGame.cover.url.replace('t_thumb', 't_cover_small')}
                alt={selectedGame.name}
                className="w-8 h-10 object-cover rounded-md"
              />
            )}
            <span className="text-xs font-bold text-zinc-300">{selectedGame.name}</span>
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              className="ml-2 text-zinc-500 hover:text-rose-500 font-bold px-2"
            >
              ×
            </button>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you playing? Share your thoughts or screenshots..."
          rows={3}
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 outline-none resize-none text-sm font-medium mt-1"
        />

        {imageFile && (
          <div className="relative inline-block w-max mt-2">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="h-32 rounded-lg border border-zinc-800 object-cover"
            />
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {showPicker && (
          <div className="mt-2 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            {library.length === 0 ? (
              <p className="text-zinc-500 text-xs font-medium text-center py-4">
                Add games to your library first to tag them!
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {library.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => {
                      setSelectedGame(game)
                      setShowPicker(false)
                    }}
                    className="shrink-0 w-16 group flex flex-col items-center"
                  >
                    <div className="w-14 h-20 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800 group-hover:border-indigo-500 transition-colors">
                      {game.cover?.url && (
                        <img
                          src={game.cover.url.replace('t_thumb', 't_cover_small')}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 mt-2 truncate w-full text-center group-hover:text-zinc-300">
                      {game.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50 mt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                showPicker
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              + Tag Game
            </button>

            <label className="text-xs font-bold text-zinc-400 hover:text-indigo-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-indigo-500 transition-colors cursor-pointer flex items-center gap-2">
              Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || uploading || (!content.trim() && !imageFile)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}
