import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, approved, role } = await request.json()

    const supabaseAdmin = getSupabaseAdmin()

    // Prevent self-demotion from admin
    if (role === 'user') {
      const { data: { user: currentUser } } = await supabaseAdmin.auth.getUser()
      if (currentUser?.id === userId) {
        return NextResponse.json({ error: 'Cannot revoke your own admin privileges' }, { status: 400 })
      }
    }

    let updateData: any = {}
    if (approved !== undefined) updateData.approved = approved
    if (role !== undefined) updateData.role = role

    // Update user approval status or role
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) throw updateError

    if (approved === true) {
      // Get user email for approval notification
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (userError) throw userError

      // Send approval email notification
      await sendApprovalEmail(user.user?.email)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendApprovalEmail(email: string | undefined) {
  if (!email) return
  
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Send magic link email using the client-side method that actually sends emails
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false // Don't create new user, just send magic link
      }
    })
    
    if (error) {
      console.error('Failed to send magic link email:', error)
    } else {
      console.log(`Magic link email sent to approved user: ${email}`)
    }
    
  } catch (error) {
    console.error('Failed to send approval email:', error)
  }
}