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
import { supabase } from '../../lib/supabase'
import { AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function Auth({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [isResetting, setIsResetting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMsg(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Account created! Please check your email to verify.')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email) {
      setErrorMsg('Please enter your email address.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    
    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('Password reset link sent to your email!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-8 left-4 md:left-8 text-zinc-500 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-indigo-500 mb-2">AGONIS</h1>
          <p className="text-zinc-400 text-sm font-medium">
            {isResetting ? 'Reset your password' : 'Track, rate, and discuss your games'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 pl-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors font-medium text-sm"
            />
          </div>

          {!isResetting && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 pl-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors font-medium text-sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            {isResetting ? (
              <>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/10"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(false)
                    setErrorMsg(null)
                    setSuccessMsg(null)
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl transition-colors text-sm border border-zinc-700"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm shadow-lg shadow-indigo-600/10"
                >
                  {loading ? 'Connecting...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm border border-zinc-700"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetting(true)
                    setErrorMsg(null)
                    setSuccessMsg(null)
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-bold mt-2 transition-colors"
                >
                  Forgot your password?
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}