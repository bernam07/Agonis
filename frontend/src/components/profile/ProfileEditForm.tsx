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
import { Download, AlertTriangle } from 'lucide-react'
import { ACCENT_COLORS } from '../../lib/plans'
import { exportUserData } from '../../lib/exportUserData'
import DeleteAccountModal from './DeleteAccountModal'
import { toast } from 'sonner'

interface ProfileEditFormProps {
  editUsername: string;
  setEditUsername: (val: string) => void;
  editBio: string;
  setEditBio: (val: string) => void;
  editAvatar: string;
  editIsPublic: boolean;
  setEditIsPublic: (val: boolean) => void;
  uploadingAvatar: boolean;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  saveProfile: () => void;
  onCancel: () => void;
  isPremium: boolean;
  accentColor: string | null;
  onSelectAccentColor: (color: string) => void;
  userId: string;
  username: string;
}

export default function ProfileEditForm({
  editUsername, setEditUsername, editBio, setEditBio, editAvatar,
  editIsPublic, setEditIsPublic, uploadingAvatar, handleAvatarUpload,
  saveProfile, onCancel, isPremium, accentColor, onSelectAccentColor,
  userId, username,
}: ProfileEditFormProps) {
  const [exporting, setExporting] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportUserData(userId)
    } catch {
      toast.error('Could not export your data. Please try again.')
    } finally {
      setExporting(false)
    }
  }
  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
      <h3 className="text-zinc-900 dark:text-white font-bold border-b border-zinc-200 dark:border-zinc-800 pb-2">Profile & Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
            {editAvatar && <img src={editAvatar} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 text-left">
            <label className="bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
              {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
            </label>
          </div>
        </div>
        <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm" />
        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about your gaming tastes..." rows={3} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm resize-none" />
      </div>
      <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 mt-2">
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Public Profile</span>
        <button onClick={() => setEditIsPublic(!editIsPublic)} className={`w-12 h-6 rounded-full p-1 transition-colors ${editIsPublic ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editIsPublic ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {isPremium && (
        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block mb-2">Accent Color</span>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Accent color ${color}`}
                onClick={() => onSelectAccentColor(color)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  accentColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-zinc-900 dark:ring-white scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button onClick={saveProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-4 py-2 rounded-lg font-bold text-sm">Save Changes</button>
        <button onClick={onCancel} className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg font-bold text-sm">Cancel</button>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2 flex flex-col gap-2">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Privacy & Data</span>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Preparing export...' : 'Export My Data'}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteAccount(true)}
          className="flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 p-3 rounded-lg border border-rose-200 dark:border-rose-500/30 text-sm font-bold text-rose-600 dark:text-rose-400 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {showDeleteAccount && (
        <DeleteAccountModal username={username} onClose={() => setShowDeleteAccount(false)} />
      )}
    </div>
  )
}
