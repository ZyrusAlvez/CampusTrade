'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    // Handle OAuth callback tokens in URL fragment
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session) {
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}