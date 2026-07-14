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

interface GameScreenshotsTabProps {
  screenshots: any[];
  uploadingScreenshot: boolean;
  isLoading?: boolean;
  handleScreenshotUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function GameScreenshotsTab({ screenshots, uploadingScreenshot, isLoading, handleScreenshotUpload }: GameScreenshotsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Your Gallery</h4>
        <label className="text-xs font-bold text-zinc-800 dark:text-white bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl cursor-pointer transition-colors shadow-sm">
          {uploadingScreenshot ? 'Uploading...' : '+ Upload Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} disabled={uploadingScreenshot} />
        </label>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 text-xs font-bold text-center py-8 animate-pulse">Loading screenshots...</div>
      ) : screenshots.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-600 font-medium text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50">
          No screenshots yet. <br /> Upload one or attach an image to a feed post!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {screenshots.map((shot) => (
            <div key={shot.id} className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video bg-zinc-100 dark:bg-zinc-950 shadow-md">
              <img src={shot.url} alt="Game screenshot" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
