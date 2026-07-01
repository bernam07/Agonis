import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Success! You can now log in.')
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <form className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome to Agonis</h1>
        <p className="text-sm text-gray-500 text-center mb-4">Sign in to track your games</p>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded text-black outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded text-black outline-none focus:border-blue-500"
        />
        
        <div className="flex gap-2 mt-2">
          <button 
            onClick={handleLogin} 
            disabled={loading} 
            className="bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 transition"
          >
            Login
          </button>
          <button 
            onClick={handleSignUp} 
            disabled={loading} 
            className="bg-gray-200 text-black p-2 rounded w-full hover:bg-gray-300 transition"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  )
}