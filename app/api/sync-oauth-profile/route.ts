import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { userId, email, firstName, lastName, profilePic } = await request.json()

  const { data: existing } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existing) {
    await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      profile_picture: profilePic,
      approved: true
    })
  }

  return NextResponse.json({ success: true })
}
