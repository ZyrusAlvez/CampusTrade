'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    setUser(user)

    // Use API call to bypass RLS
    const response = await fetch(`/api/user-profile/${user.id}`)
    const profile = await response.json()
      
    if (profile?.role === 'admin') {
      router.push('/admin')
      return
    }

    setProfile(profile)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return <div className="p-8">Loading...</div>

  if (!profile?.approved) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="mb-8">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-3">Campus Trade</h1>
            <p className="text-green-400 text-lg mb-6">Student Marketplace</p>
            <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-700 text-yellow-200 px-6 py-5 rounded-xl mb-6">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold">Account Pending Approval</h2>
              </div>
              <p className="text-yellow-100">Your account is being reviewed by our admin team. You'll receive an email notification once approved to start trading!</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-700 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">Campus Trade</h1>
              <p className="text-xs text-green-200">Student Marketplace</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Sign Out
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Student!</h2>
          <p className="text-gray-400 mb-4">Browse, buy, and sell preloved items within your campus community</p>
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700 text-green-300 px-5 py-4 rounded-xl flex items-center">
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Your account is verified and active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 p-6 rounded-xl border border-green-700/50 hover:border-green-600 transition-all hover:shadow-xl hover:shadow-green-900/20">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Browse Items</h3>
            </div>
            <p className="text-gray-300">Explore preloved uniforms, books, and gadgets</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 p-6 rounded-xl border border-emerald-700/50 hover:border-emerald-600 transition-all hover:shadow-xl hover:shadow-emerald-900/20">
            <div className="flex items-center mb-4">
              <div className="bg-emerald-600 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Sell Items</h3>
            </div>
            <p className="text-gray-300">List your preloved items for sale</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 p-6 rounded-xl border border-red-700/50 hover:border-red-600 transition-all hover:shadow-xl hover:shadow-red-900/20">
            <div className="flex items-center mb-4">
              <div className="bg-red-600 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">My Orders</h3>
            </div>
            <p className="text-gray-300">Track your purchases and sales</p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 p-6 rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all hover:shadow-xl hover:shadow-slate-900/20">
            <div className="flex items-center mb-4">
              <div className="bg-slate-600 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">My Profile</h3>
            </div>
            <p className="text-gray-300">Manage your account settings</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-3">About Campus Trade</h3>
          <p className="text-gray-300 leading-relaxed">
            Campus Trade is your trusted campus marketplace for buying and selling preloved items. 
            From textbooks and uniforms to gadgets and school supplies, connect with fellow students 
            in a safe, organized, and convenient platform designed specifically for the university community.
          </p>
        </div>
      </div>
    </div>
  )
}