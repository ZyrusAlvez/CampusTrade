import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { users } } = await supabase.auth.admin.listUsers()
  
  const googleUsers = users
    ?.filter(u => u.app_metadata.provider === 'google')
    .map(u => ({
      email: u.email,
      user_metadata: u.user_metadata,
      raw_user_meta_data: u.raw_user_meta_data
    }))

  return NextResponse.json({ googleUsers })
}
