'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ItemPage() {
  const [item, setItem] = useState<any>(null)
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    setLoading(true)
    checkUser()
  }, [])

  useEffect(() => {
    if (chat) {
      fetchMessages()
      scrollToBottom()
      
      const channel = supabase
        .channel(`chat-${chat.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`
        }, (payload) => {
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev
            setTimeout(scrollToBottom, 100)
            return [...prev, payload.new]
          })
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const otherUsers = Object.values(state).filter((presence: any) => 
            presence[0]?.user_id !== user.id
          )
          setOtherUserTyping(otherUsers.some((u: any) => u[0]?.typing))
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: user.id, typing: false })
          }
        })

      return () => {
        channel.untrack()
        supabase.removeChannel(channel)
      }
    }
  }, [chat])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      fetchItem()
    }
  }

  const fetchItem = async () => {
    const { data: itemData } = await supabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .single()

    if (itemData) {
      setItem(itemData)
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, profile_picture, last_seen')
        .eq('id', itemData.seller_id)
        .single()
      
      if (profile) setSellerProfile(profile)
    }
    setLoading(false)
  }

  if (loading || !item) return (
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
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <div className="w-full h-96 bg-slate-800 rounded-lg"></div>
            </div>
            <div>
              <div className="h-10 w-3/4 bg-slate-800 rounded mb-4"></div>
              <div className="h-12 w-32 bg-slate-800 rounded mb-4"></div>
              <div className="h-6 w-24 bg-slate-800 rounded mb-2"></div>
              <div className="h-6 w-32 bg-slate-800 rounded mb-6"></div>
              <div className="h-6 w-24 bg-slate-800 rounded mb-2"></div>
              <div className="h-6 w-40 bg-slate-800 rounded mb-6"></div>
              <div className="h-12 w-full bg-slate-800 rounded-lg"></div>
            </div>
          </div>
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
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-all cursor-pointer">
            Back to Home
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              {item.images && item.images.length > 0 ? (
                <img 
                  src={item.images[selectedImage]} 
                  alt={item.name} 
                  className="w-full h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => setShowLightbox(true)}
                />
              ) : (
                <div className="w-full h-96 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {item.images && item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {item.images.map((img: string, index: number) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`${item.name} ${index + 1}`} 
                      className={`w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-all ${
                        selectedImage === index ? 'ring-2 ring-green-500' : ''
                      }`}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-4">{item.name}</h1>
              <p className="text-4xl font-bold text-green-400 mb-4">₱{item.price}</p>
              
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Category</p>
                <p className="text-white">{item.category}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Seller</p>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/user/${item.seller_id}`)}>
                  {sellerProfile?.profile_picture ? (
                    <img src={sellerProfile.profile_picture} alt="Seller" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <p className="text-white">{sellerProfile ? `${sellerProfile.first_name} ${sellerProfile.last_name}` : 'Unknown'}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Posted</p>
                <p className="text-white">{new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {item.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Description</p>
                  <p className="text-white">{item.description}</p>
                </div>
              )}

              {user?.id === item.seller_id ? (
                <button className="w-full bg-slate-700 text-white py-3 rounded-lg font-medium cursor-not-allowed" disabled>
                  Your Listing
                </button>
              ) : (
                <button onClick={async () => {
                  if (!user) return
                  
                  const { data: existingChat } = await supabase
                    .from('chats')
                    .select('*, items(name)')
                    .eq('item_id', item.id)
                    .eq('buyer_id', user.id)
                    .single()
                  
                  if (existingChat) {
                    setChat(existingChat)
                  } else {
                    const { data: newChat } = await supabase
                      .from('chats')
                      .insert({
                        item_id: item.id,
                        buyer_id: user.id,
                        seller_id: item.seller_id
                      })
                      .select('*, items(name)')
                      .single()
                    
                    if (newChat) setChat(newChat)
                  }
                  setShowChat(true)
                }} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-all font-medium cursor-pointer">
                  Message Seller
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Lightbox */}
        {showLightbox && item.images && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
            <button onClick={() => setShowLightbox(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 cursor-pointer">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {item.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage - 1 + item.images.length) % item.images.length) }} 
                  className="absolute left-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 cursor-pointer"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage + 1) % item.images.length) }} 
                  className="absolute right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 cursor-pointer"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <img src={item.images[selectedImage]} alt={item.name} className="max-w-full max-h-[90vh] object-contain" />
              {item.images.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {item.images.map((_: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                        selectedImage === index ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Chat */}
        {showChat && chat && (
          <div className="fixed bottom-4 right-4 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50">
            <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-3 rounded-t-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="cursor-pointer" onClick={() => router.push(`/user/${item.seller_id}`)}>
                  {sellerProfile?.profile_picture ? (
                    <img src={sellerProfile.profile_picture} alt="Seller" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/user/${item.seller_id}`)}>
                  <p className="text-white font-bold text-sm">{chat.items.name}</p>
                  <p className="text-xs text-green-200">{sellerProfile ? `${sellerProfile.first_name} ${sellerProfile.last_name}` : 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-100 flex items-center justify-end gap-1">
                    {(() => {
                      if (!sellerProfile?.last_seen) return 'Offline'
                      const diff = new Date().getTime() - new Date(sellerProfile.last_seen).getTime()
                      const minutes = Math.floor(diff / 60000)
                      if (minutes < 5) return <><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>Active now</>
                      if (minutes < 60) return `Active ${minutes}m ago`
                      const hours = Math.floor(minutes / 60)
                      if (hours < 24) return `Active ${hours}h ago`
                      const days = Math.floor(hours / 24)
                      return `Active ${days}d ago`
                    })()}
                  </p>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-300 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                    <div 
                      onClick={() => setClickedMessageId(clickedMessageId === msg.id ? null : msg.id)}
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-opacity ${msg.sender_id === user?.id ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}
                    >
                      {msg.message}
                    </div>
                    {clickedMessageId === msg.id && (
                      <div className="text-xs text-gray-400 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 px-4 py-2 rounded-lg flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={sendMessage} className="p-3 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={async (e) => {
                      setNewMessage(e.target.value)
                      
                      const channel = supabase.channel(`chat-${chat.id}`)
                      await channel.track({ user_id: user.id, typing: e.target.value.length > 0 })
                      
                      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                      typingTimeoutRef.current = setTimeout(async () => {
                        await channel.track({ user_id: user.id, typing: false })
                      }, 1000)
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  />
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const messageText = newMessage.trim()
    setNewMessage('')

    const { data } = await supabase.from('messages').insert({
      chat_id: chat.id,
      sender_id: user.id,
      message: messageText
    }).select().single()

    if (data) {
      setMessages(prev => [...prev, data])
      setTimeout(scrollToBottom, 100)
    }
  }
}
