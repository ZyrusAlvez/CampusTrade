'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SellPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [myItems, setMyItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) fetchMyItems()
  }, [user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
  }

  const fetchMyItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) {
      const itemsWithBuyers = await Promise.all(
        data.map(async (item) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('item_id', item.id)
          
          const ordersWithProfiles = orders ? await Promise.all(
            orders.map(async (order) => {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('id', order.buyer_id)
                .single()
              return { ...order, user_profiles: profile }
            })
          ) : []
          return { ...item, interested_buyers: ordersWithProfiles }
        })
      )
      setMyItems(itemsWithBuyers)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return

    setUploading(true)

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, file)

      if (data) {
        const { data: urlData } = supabase.storage
          .from('item-images')
          .getPublicUrl(data.path)
        console.log('Uploaded URL:', urlData.publicUrl)
        setImages(prev => [...prev, urlData.publicUrl])
      } else {
        console.error('Upload error:', error)
      }
    }

    setUploading(false)
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Submitting images:', images)
      const { error } = await supabase
        .from('items')
        .insert({
          seller_id: user.id,
          name,
          price: parseFloat(price),
          category,
          description,
          images
        })

      if (error) throw error

      toast.success('Item listed successfully!')
      setShowForm(false)
      fetchMyItems()
      setName('')
      setPrice('')
      setCategory('')
      setDescription('')
      setImages([])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Campus Trade Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">Campus Trade</h1>
              <p className="text-xs text-green-200">Student Marketplace</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition-all cursor-pointer">
            Back to Home
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">My Listings</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'List New Item'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4 mb-6">
          <div>
            <label className="block text-white mb-2">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">Price (₱)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              required
            >
              <option value="">Select a category</option>
              <option value="Books">Books</option>
              <option value="Electronics">Electronics</option>
              <option value="Uniforms">Uniforms</option>
              <option value="Accessories">Accessories</option>
              <option value="Furniture">Furniture</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer mb-3 disabled:opacity-50"
            />
            {uploading && <p className="text-green-400 text-sm mb-3">Uploading images...</p>}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt={`Preview ${index + 1}`} className="max-w-xs max-h-64 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Listing...' : uploading ? 'Uploading images...' : 'List Item'}
          </button>
        </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-gray-400">You haven't listed any items yet.</p>
            </div>
          ) : (
            myItems.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                <div className="h-48 bg-slate-800 flex items-center justify-center">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <span className="text-green-400 font-bold">₱{item.price}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{item.category}</p>
                  <button onClick={() => setDeleteConfirm(item.id)} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-all text-sm cursor-pointer">
                    Delete Listing
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-2">Delete Listing?</h3>
              <p className="text-gray-400 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={async () => {
                  await supabase.from('items').delete().eq('id', deleteConfirm)
                  setDeleteConfirm(null)
                  fetchMyItems()
                  toast.success('Listing deleted')
                }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-all cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
