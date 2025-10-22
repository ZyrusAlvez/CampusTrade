'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [chat, setChat] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && chat) {
      fetchMessages()
      
      // Subscribe to realtime messages
      const channel = supabase
        .channel(`chat-${params.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${params.id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, chat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    fetchChat(user.id)
  }

  const fetchChat = async (userId: string) => {
    const { data } = await supabase
      .from('chats')
      .select('*, items(name, images)')
      .eq('id', params.id)
      .single()

    if (data) {
      setChat(data)
      
      const otherUserId = data.buyer_id === userId ? data.seller_id : data.buyer_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', otherUserId)
        .single()
      
      setOtherUser(profile)
    }
  }

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', params.id)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    await supabase.from('messages').insert({
      chat_id: params.id,
      sender_id: user.id,
      message: newMessage.trim()
    })

    setNewMessage('')
  }

  if (!chat) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-700 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/messages')} className="text-white hover:text-green-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{chat.items.name}</h1>
              <p className="text-xs text-green-200">{otherUser?.email?.split('@')[0]}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'}`}>
                <p>{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={sendMessage} className="border-t border-slate-700 p-4 bg-slate-900">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all">
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
