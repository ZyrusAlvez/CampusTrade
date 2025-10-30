'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  profile_picture: string | null
  approved: boolean
  role: string
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    setCurrentUserId(user.id)
    const response = await fetch(`/api/user-profile/${user.id}`)
    const profile = await response.json()
      
    if (profile?.role !== 'admin') {
      router.push('/')
      return
    }

    fetchUsers()
  }

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
      
      if (data) {
        const regularUsers = data.filter((user: UserProfile) => user.role === 'user')
        const adminUsers = data.filter((user: UserProfile) => user.role === 'admin')
        setUsers(regularUsers)
        setAdmins(adminUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }



  const handleApproval = async (userId: string, approved: boolean) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, approved })
    })

    if (response.ok) {
      fetchUsers()
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole })
    })

    if (response.ok) {
      fetchUsers()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to update role')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return (
    <div className="min-h-screen bg-black">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-slate-700 rounded"></div>
            <div>
              <div className="h-6 w-40 bg-slate-700 rounded mb-1"></div>
              <div className="h-3 w-32 bg-slate-700 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-24 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-800 rounded mb-4 animate-pulse"></div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex gap-3 animate-pulse">
            <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 w-40 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-56 bg-slate-700 rounded mb-1"></div>
              <div className="h-4 w-24 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
        <div>
          <div className="h-8 w-32 bg-slate-800 rounded mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 w-40 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-56 bg-slate-700 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Campus Trade Management</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto p-6">


        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-300">Administrators</h2>
          <div className="space-y-3">
            {admins.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-slate-500">
                No administrators found.
              </div>
            ) : (
              admins.map(admin => (
                <div key={admin.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    {admin.profile_picture ? (
                      <img src={admin.profile_picture} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{admin.first_name} {admin.last_name}</p>
                      <p className="text-sm text-gray-400">{admin.email}</p>
                      <p className="text-xs text-emerald-400 font-medium">● Administrator</p>
                    </div>
                  </div>
                  {admin.id !== currentUserId && (
                    <button
                      onClick={() => handleRoleChange(admin.id, 'user')}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      Revoke Admin
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-300">Users</h2>
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-slate-500">
                No users found.
              </div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-between items-center hover:border-slate-600 transition-all">
                  <div className="flex items-center gap-3">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          user.approved ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <p className={`text-sm ${
                          user.approved ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {user.approved ? 'Approved' : 'Pending Approval'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!user.approved && (
                      <button
                        onClick={() => handleApproval(user.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {user.approved && (
                      <button
                        onClick={() => handleApproval(user.id, false)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    )}
                    {user.approved && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
                      >
                        Make Admin
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
