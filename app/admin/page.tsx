'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  approved: boolean
  role: string
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [admins, setAdmins] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
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

    // Use API call to bypass RLS
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
      // Use API call to bypass RLS
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
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

  const syncUsers = async () => {
    const response = await fetch('/api/sync-users', { method: 'POST' })
    if (response.ok) {
      fetchUsers()
    }
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

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={syncUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sync Existing Users
          </button>
          <button
            onClick={async () => {
              const response = await fetch('/api/fix-users', { method: 'POST' })
              if (response.ok) {
                alert('Fixed unconfirmed emails')
              }
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Fix Email Confirmations
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <div className="bg-purple-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            Administrators
          </h2>
          <div className="space-y-3">
            {admins.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-400">
                No administrators found.
              </div>
            ) : (
              admins.map(admin => (
                <div key={admin.id} className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{admin.email}</p>
                    <p className="text-sm text-purple-400">Administrator</p>
                  </div>
                  <button
                    onClick={() => handleRoleChange(admin.id, 'user')}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Revoke Admin
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            Users
          </h2>
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-400">
                No users found. Click "Sync Existing Users" to load existing accounts.
              </div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{user.email}</p>
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
                  <div className="flex space-x-2">
                    {!user.approved && (
                      <button
                        onClick={() => handleApproval(user.id, true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {user.approved && (
                      <button
                        onClick={() => handleApproval(user.id, false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Revoke Access
                      </button>
                    )}
                    {user.approved && (
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
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