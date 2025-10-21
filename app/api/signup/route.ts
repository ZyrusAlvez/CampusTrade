import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const supabaseAdmin = getSupabaseAdmin()

    // Create user with admin client (bypasses email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { approved: false }
    })

    if (error) throw error

    // Profile will be created automatically by the database trigger

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}