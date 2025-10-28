'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Campus Trade Logo" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Campus Trade</h1>
          <p className="text-green-400 text-lg mb-2">Student Marketplace</p>
          <p className="text-gray-400">Buy and sell preloved items within your campus</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}