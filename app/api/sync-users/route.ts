import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
    if (profileError) throw profileError

    const existingIds = new Set(existingProfiles?.map(p => p.id) || [])

    // Insert missing profiles
    const missingUsers = authUsers.users.filter(user => !existingIds.has(user.id))
    
    if (missingUsers.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert(
          missingUsers.map(user => ({
            id: user.id,
            email: user.email || '',
            approved: false,
            role: 'user'
          }))
        )
      if (insertError) throw insertError
    }

    return NextResponse.json({ 
      success: true, 
      synced: missingUsers.length 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}