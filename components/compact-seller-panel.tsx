'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, Package, Pencil, ShoppingBag, Store, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createOrder,
  createProduct,
  getProductByRecipe,
  updateProduct,
  type Product,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

type Props = {
  recipeId: number
  recipeOwnerId?: number | string
}

export function CompactSellerPanel({ recipeId, recipeOwnerId }: Props) {
  const { userId } = useAuth()
  const isOwner = userId && String(userId) === String(recipeOwnerId)

  const { data: product, mutate, isLoading } = useSWR(
    `csp-product-${recipeId}`,
    () => getProductByRecipe(recipeId),
  )

  const [showForm, setShowForm] = useState(false)
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [qty, setQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    const p = Number(price)
    if (!p || p <= 0) { toast.error('Giá phải lớn hơn 0'); return }
    setSaving(true)
    const res = await createProduct({ recipeId, userId: userId!, price: p, unit: 'phần', isAvailable: true })
    setSaving(false)
    if (res.ok) { toast.success('Đã đăng bán!'); setShowForm(false); mutate() }
    else toast.error(res.message || 'Lỗi')
  }

  async function handleToggle() {
    if (!product) return
    const ok = await updateProduct(product.productId!, { isAvailable: !product.isAvailable })
    if (ok) mutate()
  }

  if (isLoading) return null

  // Owner
  if (isOwner) {
    if (product) {
      return (
        <div className="rounded-xl border border-border/40 bg-card/50 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Đang bán</p>
            <p className="text-sm font-bold text-primary">{formatVND(product.price)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={product.isAvailable ? 'default' : 'secondary'} className="rounded-full text-[10px] h-5">
              {product.isAvailable ? 'Mở' : 'Tạm dừng'}
            </Badge>
            <button onClick={handleToggle} className="cursor-pointer text-muted-foreground hover:text-primary p-1">
              <Pencil className="size-3.5" />
            </button>
          </div>
        </div>
      )
    }
    return (
      <div>
        {showForm ? (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Giá bán (VND)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 text-xs rounded-xl"
            />
            <Button size="sm" className="rounded-full h-8 text-xs" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Store className="size-3" />}
              Đăng
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full h-8" onClick={() => setShowForm(false)}>
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full rounded-full text-xs h-8" onClick={() => setShowForm(true)}>
            <Store className="size-3" />
            Đăng bán món này
          </Button>
        )}
      </div>
    )
  }

  // Buyer
  if (!product || !product.isAvailable) return null

  async function handleOrder() {
    if (!product) return
    if (!userId) { toast.error('Vui lòng đăng nhập'); return }
    setSubmitting(true)
    const res = await createOrder({
      productId: product.productId!,
      buyerUserId: userId!,
      sellerUserId: recipeOwnerId!,
      quantity: qty,
      totalPrice: product.price * qty,
    })
    setSubmitting(false)
    if (res.ok) { toast.success('Đặt hàng thành công!'); setOrdering(false) }
    else toast.error(res.message || 'Lỗi')
  }

  if (ordering) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="size-6 rounded-full border border-border text-xs cursor-pointer">-</button>
          <span className="text-xs font-semibold w-5 text-center">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="size-6 rounded-full border border-border text-xs cursor-pointer">+</button>
        </div>
        <span className="text-xs font-bold text-primary">{formatVND(product.price * qty)}</span>
        <Button size="sm" className="rounded-full h-7 text-xs ml-auto" onClick={handleOrder} disabled={submitting}>
          {submitting ? <Loader2 className="size-3 animate-spin" /> : <Package className="size-3" />}
          Đặt
        </Button>
        <button onClick={() => setOrdering(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="size-3" />
        </button>
      </div>
    )
  }

  return (
    <Button size="sm" className="w-full rounded-full text-xs h-8" onClick={() => setOrdering(true)}>
      <ShoppingBag className="size-3" />
      Đặt mua · {formatVND(product.price)}
    </Button>
  )
}
