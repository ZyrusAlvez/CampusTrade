'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function UserProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ listed: 0, sold: 0, bought: 0 })
  const [showImageModal, setShowImageModal] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single()
    if (data) setProfile(data)
  }

  const fetchStats = async () => {
    const { data: items } = await supabase
      .from('items')
      .select('id')
      .eq('seller_id', params.id)

    const { data: soldOrders } = await supabase
      .from('orders')
      .select('item_id')
      .eq('seller_id', params.id)

    const { data: boughtOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', params.id)

    setStats({
      listed: items?.length || 0,
      sold: soldOrders?.length || 0,
      bought: boughtOrders?.length || 0
    })
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
          <button onClick={() => router.back()} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-all cursor-pointer">
            Back
          </button>
        </div>
        <h2 className="text-3xl font-bold text-white mb-6">User Profile</h2>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img src={getProfilePicture()} alt="Profile" className="w-32 h-32 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowImageModal(true)} />
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

        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 cursor-pointer">
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
