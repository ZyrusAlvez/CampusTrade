import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get all users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    // Update each user to confirm their email
    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      fixed: users.users.filter(u => !u.email_confirmed_at).length 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}