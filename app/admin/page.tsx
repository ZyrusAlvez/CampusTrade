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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </div>
      
      <div className="mb-6 space-x-2">
        <button
          onClick={syncUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded"
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
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Fix Email Confirmations
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Administrators</h2>
        <div className="space-y-4">
          {admins.length === 0 ? (
            <p className="text-gray-500">No administrators found.</p>
          ) : (
            admins.map(admin => (
              <div key={admin.id} className="border p-4 rounded flex justify-between items-center bg-blue-50">
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-sm text-gray-500">Role: Admin</p>
                </div>
                <button
                  onClick={() => handleRoleChange(admin.id, 'user')}
                  className="bg-orange-500 text-white px-4 py-2 rounded"
                >
                  Revoke Admin
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-gray-500">No users found. Click "Sync Existing Users" to load existing accounts.</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Status: {user.approved ? 'Approved' : 'Pending'}
                  </p>
                </div>
                <div className="space-x-2">
                  {!user.approved && (
                    <button
                      onClick={() => handleApproval(user.id, true)}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Approve
                    </button>
                  )}
                  {user.approved && (
                    <button
                      onClick={() => handleApproval(user.id, false)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Revoke Access
                    </button>
                  )}
                  {user.approved && (
                    <button
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      className="bg-purple-500 text-white px-4 py-2 rounded"
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
  )
}