'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ItemPage() {
  const [item, setItem] = useState<any>(null)
  const [sellerEmail, setSellerEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    fetchItem()
  }, [])

  const fetchItem = async () => {
    const { data: itemData } = await supabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .single()

    if (itemData) {
      setItem(itemData)
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', itemData.seller_id)
        .single()
      
      if (profile) setSellerEmail(profile.email)
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>

  if (!item) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Item not found</div></div>

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-gradient-to-r from-green-900 to-emerald-900 border-b border-green-700 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">Campus Trade</h1>
              <p className="text-xs text-green-200">Student Marketplace</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-all">
            Back to Home
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt={item.name} className="w-full h-96 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-96 bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {item.images && item.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {item.images.slice(1).map((img: string, index: number) => (
                    <img key={index} src={img} alt={`${item.name} ${index + 2}`} className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-4">{item.name}</h1>
              <p className="text-4xl font-bold text-green-400 mb-4">${item.price}</p>
              
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Category</p>
                <p className="text-white">{item.category}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Seller</p>
                <p className="text-white">{sellerEmail?.split('@')[0] || 'Unknown'}</p>
              </div>

              {item.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Description</p>
                  <p className="text-white">{item.description}</p>
                </div>
              )}

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-all font-medium">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
