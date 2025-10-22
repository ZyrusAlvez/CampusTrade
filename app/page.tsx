'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showChats, setShowChats] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const fetchItems = async () => {
      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (itemsData) {
        const itemsWithSeller = await Promise.all(
          itemsData.map(async (item) => {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('email')
              .eq('id', item.seller_id)
              .single()
            return { ...item, seller_email: profile?.email }
          })
        )
        setItems(itemsWithSeller)
      }
    }

    const fetchChats = async () => {
      if (!user) return
      const { data } = await supabase
        .from('chats')
        .select('*, items(name)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      
      if (data) {
        const chatsWithUsers = await Promise.all(
          data.map(async (chat) => {
            const otherUserId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('email')
              .eq('id', otherUserId)
              .single()
            return { ...chat, other_user: profile }
          })
        )
        setChats(chatsWithUsers)
      }
    }

    if (profile) {
      fetchItems()
      fetchChats()
    }
  }, [profile, user])

  useEffect(() => {
    if (selectedChat) {
      fetchMessages()
      scrollToBottom()
      
      const channel = supabase
        .channel(`chat-${selectedChat.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`
        }, (payload) => {
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev
            setTimeout(scrollToBottom, 100)
            return [...prev, payload.new]
          })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', selectedChat.id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const messageText = newMessage.trim()
    setNewMessage('')

    const { data } = await supabase.from('messages').insert({
      chat_id: selectedChat.id,
      sender_id: user.id,
      message: messageText
    }).select().single()

    if (data) {
      setMessages(prev => [...prev, data])
      setTimeout(scrollToBottom, 100)
    }
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
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowChats(!showChats)} className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>
            <button onClick={() => router.push('/sell')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Sell
            </button>
            <button className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {['Books', 'Electronics', 'Uniforms', 'Accessories', 'Furniture', 'Other'].map(category => {
            const categoryItems = items.filter(item => 
              item.category === category &&
              (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            
            if (categoryItems.length === 0) return null
            
            return (
              <div key={category}>
                <h2 className="text-2xl font-bold text-white mb-4">{category}</h2>
                <div className="relative group">
                  {categoryItems.length > 4 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`carousel-${category}`)
                        if (container) container.scrollBy({ left: -300, behavior: 'smooth' })
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div id={`carousel-${category}`} className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                      {categoryItems.map(item => (
                        <div key={item.id} onClick={() => router.push(`/item/${item.id}`)} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-green-600 transition-all cursor-pointer" style={{ width: '280px', flexShrink: 0 }}>
                          <div className="h-48 bg-slate-800 flex items-center justify-center">
                            {item.images && item.images.length > 0 ? (
                              <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-bold text-white">{item.name}</h3>
                              <span className="text-green-400 font-bold">${item.price}</span>
                            </div>
                            <p className="text-sm text-gray-400">{item.seller_email?.split('@')[0] || 'Unknown'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {categoryItems.length > 4 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`carousel-${category}`)
                        if (container) container.scrollBy({ left: 300, behavior: 'smooth' })
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {items.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-gray-400">No items found. Be the first to list an item!</p>
            </div>
          )}
        </div>

        {/* Floating Chat */}
        {showChats && (
          <div className="fixed bottom-4 right-4 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-4 rounded-t-xl flex justify-between items-center">
              <h3 className="text-white font-bold">Messages</h3>
              <button onClick={() => { setShowChats(false); setSelectedChat(null) }} className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {!selectedChat ? (
              <div className="h-96 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">No messages</div>
                ) : (
                  chats.map(chat => (
                    <div key={chat.id} onClick={() => setSelectedChat(chat)} className="p-4 hover:bg-slate-800 cursor-pointer border-b border-slate-700">
                      <p className="text-white font-medium">{chat.items.name}</p>
                      <p className="text-sm text-gray-400">{chat.other_user?.email?.split('@')[0]}</p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col h-96">
                <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                  <button onClick={() => setSelectedChat(null)} className="text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <p className="text-white text-sm font-medium">{selectedChat.items.name}</p>
                    <p className="text-xs text-gray-400">{selectedChat.other_user?.email?.split('@')[0]}</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.sender_id === user?.id ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={sendMessage} className="p-3 border-t border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none"
                    />
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}