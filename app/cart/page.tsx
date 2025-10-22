'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data: cart } = await supabase
      .from('cart')
      .select('*, items(*)')
      .eq('user_id', user.id)

    if (cart) {
      const itemsWithSeller = await Promise.all(
        cart.map(async (cartItem) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', cartItem.items.seller_id)
            .single()
          return { ...cartItem, seller_email: profile?.email }
        })
      )
      setCartItems(itemsWithSeller)
    }
    setLoading(false)
  }

  const removeFromCart = async (cartId: string) => {
    await supabase.from('cart').delete().eq('id', cartId)
    fetchCart()
  }

  const buyNow = async (item: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      item_id: item.items.id,
      seller_id: item.items.seller_id
    })

    if (!error) {
      await supabase.from('cart').delete().eq('id', item.id)
      alert('Order placed successfully!')
      fetchCart()
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>

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
        <h2 className="text-3xl font-bold text-white mb-6">My Cart</h2>

        {cartItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
                <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.items.images && item.items.images.length > 0 ? (
                    <img src={item.items.images[0]} alt={item.items.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{item.items.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{item.items.category} • {item.seller_email?.split('@')[0]}</p>
                  <p className="text-2xl font-bold text-green-400">${item.items.price}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => buyNow(item)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all">
                    Buy Now
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
