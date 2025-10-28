import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('\n=== CALLBACK ROUTE HIT ===')
  console.log('Full URL:', request.url)
  
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const response = NextResponse.redirect(`${origin}${next}`)
  
  console.log('Search params:', Object.fromEntries(searchParams))
  console.log('Code:', code)
  console.log('Hash:', hash)
  console.log('Origin:', origin)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  if (code) {
    console.log('✓ Code found, exchanging for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Exchange result - Error:', error)
    console.log('Exchange result - User:', data?.user?.email)
    
    if (!error && data.user) {
      console.log('✓ Session created, upserting profile...')
      const user = data.user
      const metadata = user.user_metadata
      
      console.log('User metadata:', metadata)
      
      const fullName = metadata.full_name || metadata.name || ''
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''
      const profilePic = metadata.avatar_url || metadata.picture || ''
      
      console.log('Extracted data:', { firstName, lastName, profilePic })
      
      await supabaseAdmin.from('user_profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        profile_picture: profilePic,
        approved: true
      }, { onConflict: 'id' })
      
      console.log('✓ Profile upserted successfully')
    } else {
      console.log('✗ No user data or error occurred')
    }
    
    return response
  }

  console.log('✗ No code found, checking existing session...')
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    console.log('✓ Session found in cookies, upserting profile...')
    const user = session.user
    const metadata = user.user_metadata
    
    const fullName = metadata.full_name || metadata.name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''
    const profilePic = metadata.avatar_url || metadata.picture || ''
    
    await supabaseAdmin.from('user_profiles').upsert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      profile_picture: profilePic,
      approved: true
    }, { onConflict: 'id' })
    
    console.log('✓ Profile upserted from session')
    return response
  }
  
  return NextResponse.redirect(`${origin}/auth`)
}