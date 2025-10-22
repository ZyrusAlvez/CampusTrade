'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ listed: 0, sold: 0, bought: 0 })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
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
    fetchProfile(user.id)
    fetchStats(user.id)
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  const fetchStats = async (userId: string) => {
    const { data: items } = await supabase
      .from('items')
      .select('id')
      .eq('seller_id', userId)

    const { data: soldOrders } = await supabase
      .from('orders')
      .select('item_id')
      .eq('seller_id', userId)

    const { data: boughtOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', userId)

    setStats({
      listed: items?.length || 0,
      sold: soldOrders?.length || 0,
      bought: boughtOrders?.length || 0
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/profile.${fileExt}`

    await supabase.storage.from('item-images').remove([fileName])

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, file)

    if (data) {
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(data.path)

      const profilePictureUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture: profilePictureUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        console.log('User ID:', user.id)
        toast.error(updateError.message)
        setUploading(false)
      } else {
        await fetchProfile(user.id)
        toast.success('Profile picture updated')
        setUploading(false)
      }
    } else {
      toast.error(error?.message || 'Upload failed')
      setUploading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const getProfilePicture = () => {
    if (profile?.profile_picture) return profile.profile_picture
    return `https://ui-avatars.com/api/?name=${profile?.first_name}+${profile?.last_name}&background=059669&color=fff&size=200`
  }

  if (!profile) return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-slate-800 rounded"></div>
            <div>
              <div className="h-6 w-32 bg-slate-800 rounded mb-1"></div>
              <div className="h-3 w-24 bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-slate-800 rounded mb-6"></div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-slate-800 rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 w-48 bg-slate-800 rounded mb-2"></div>
              <div className="h-5 w-64 bg-slate-800 rounded mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-800 p-4 rounded-lg h-24"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="h-6 w-40 bg-slate-800 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-800 rounded-lg"></div>
            <div className="h-12 bg-slate-800 rounded-lg"></div>
            <div className="h-12 w-40 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">Campus Trade</h1>
              <p className="text-xs text-green-200">Student Marketplace</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-all">
            Back to Home
          </button>
        </div>
        <h2 className="text-3xl font-bold text-white mb-6">My Profile</h2>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              {uploading ? (
                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <img src={getProfilePicture()} alt="Profile" className="w-32 h-32 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowImageModal(true)} />
              )}
              <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full cursor-pointer z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" accept="image/*" onChange={handleProfilePictureUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white">{profile.first_name} {profile.last_name}</h3>
              <p className="text-gray-400 mb-4">{profile.email}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-400">{stats.listed}</div>
                  <div className="text-sm text-gray-400">Listed Items</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.sold}</div>
                  <div className="text-sm text-gray-400">Sold Items</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats.bought}</div>
                  <div className="text-sm text-gray-400">Bought Items</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              required
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all">
              Update Password
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
          <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all">
            Sign Out
          </button>
        </div>

        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={getProfilePicture()} alt="Profile" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </div>
  )
}
