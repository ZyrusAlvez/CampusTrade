'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MessagesPage() {
  const [chats, setChats] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const [loading, setLoading] = useState(true)

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    await fetchChats(user.id)
    setLoading(false)
  }

  const fetchChats = async (userId: string) => {
    const { data } = await supabase
      .from('chats')
      .select('*, items(name, images), user_profiles!buyer_id(email), seller:user_profiles!seller_id(email)')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (data) setChats(data)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto p-6 animate-pulse">
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 w-48 bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto p-6">
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
        <h2 className="text-3xl font-bold text-white mb-6">Messages</h2>

        {chats.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map(chat => (
              <div key={chat.id} onClick={() => router.push(`/chat/${chat.id}`)} className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-green-600 transition-all cursor-pointer flex gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex-shrink-0">
                  {chat.items.images?.[0] ? (
                    <img src={chat.items.images[0]} alt={chat.items.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{chat.items.name}</h3>
                  <p className="text-sm text-gray-400">
                    {user?.id === chat.buyer_id ? chat.seller?.email?.split('@')[0] : chat.user_profiles?.email?.split('@')[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
