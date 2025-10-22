import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}