'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthLoading() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const user = session.user
        const metadata = user.user_metadata
        
        if (metadata.iss || metadata.provider_id) {
          const fullName = metadata.full_name || metadata.name || ''
          const nameParts = fullName.split(' ')
          const firstName = nameParts[0] || 'User'
          const lastName = nameParts.slice(1).join(' ') || ''
          const profilePic = metadata.avatar_url || metadata.picture || ''
          
          fetch('/api/sync-oauth-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              firstName,
              lastName,
              profilePic
            })
          })
        }
        
        router.push('/')
      } else {
        router.push('/auth')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Signing you in...</h2>
        <p className="text-gray-400">Please wait a moment</p>
      </div>
    </div>
  )
}
