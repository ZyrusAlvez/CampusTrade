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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Account Pending Approval</h1>
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-6">
              ⏳ Your account is waiting for admin approval. You'll receive an email once approved.
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>
      
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.email}</h2>
          <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
            ✓ Your account is approved and active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center mb-3">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Profile</h3>
            </div>
            <p className="text-gray-400">Manage your account settings</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center mb-3">
              <div className="bg-purple-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Orders</h3>
            </div>
            <p className="text-gray-400">View your order history</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center mb-3">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.98 5.98 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-1.588-1.588A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.539-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.539a4.002 4.002 0 00-2.346.033L7.246 4.667z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Support</h3>
            </div>
            <p className="text-gray-400">Get help and support</p>
          </div>
        </div>
      </div>
    </div>
  )
}