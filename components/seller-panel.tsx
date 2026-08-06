'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  BadgeCheck,
  ChefHat,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Store,
  ToggleLeft,
  ToggleRight,
  Truck,
  X,
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

type Props = {
  recipeId: number
  recipeOwnerId?: number | string
}

export function SellerPanel({ recipeId, recipeOwnerId }: Props) {
  const { userId } = useAuth()
  const isOwner = userId && String(userId) === String(recipeOwnerId)

  const { data: product, mutate, isLoading } = useSWR(
    `product-recipe-${recipeId}`,
    () => getProductByRecipe(recipeId),
  )

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ price: '', unit: 'phần', description: '' })
  const [saving, setSaving] = useState(false)

  // Order state
  const [ordering, setOrdering] = useState(false)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openEdit(p?: Product | null) {
    setForm({
      price: p ? String(p.price) : '',
      unit: p?.unit ?? 'phần',
      description: p?.description ?? '',
    })
    setEditing(true)
  }

  async function handleSave() {
    const price = Number(form.price)
    if (!price || price <= 0) {
      toast.error('Giá phải lớn hơn 0')
      return
    }
    setSaving(true)
    try {
      if (product) {
        const res = await updateProduct(product.productId!, {
          price,
          unit: form.unit,
          description: form.description,
        })
        if (res.ok) { toast.success('Đã cập nhật sản phẩm'); setEditing(false); mutate() }
        else toast.error(res.message || 'Lỗi cập nhật')
      } else {
        const res = await createProduct({
          recipeId,
          userId: userId!,
          price,
          unit: form.unit,
          description: form.description,
          isAvailable: true,
        })
        if (res.ok) { toast.success('Đã đăng bán món ăn!'); setEditing(false); mutate() }
        else toast.error(res.message || 'Lỗi tạo sản phẩm')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAvailable() {
    if (!product) return
    const res = await updateProduct(product.productId!, { isAvailable: !product.isAvailable })
    if (res.ok) mutate()
    else toast.error('Lỗi cập nhật trạng thái')
  }

  async function handleOrder() {
    if (!userId) { toast.error('Vui lòng đăng nhập để đặt hàng'); return }
    if (!product) return
    setSubmitting(true)
    try {
      const res = await createOrder({
        productId: product.productId!,
        buyerUserId: userId!,
        sellerUserId: recipeOwnerId!,
        quantity: qty,
        totalPrice: product.price * qty,
        note: note.trim() || undefined,
      })
      if (res.ok) {
        toast.success('Đặt hàng thành công! Người bán sẽ liên hệ với bạn.')
        setOrdering(false)
        setQty(1)
        setNote('')
      } else {
        toast.error(res.message || 'Lỗi đặt hàng')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang tải thông tin bán hàng...
      </div>
    )
  }

  // Owner view — manage product
  if (isOwner) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
          <Store className="size-4 text-primary" />
          <span className="text-sm font-semibold">Quản lý bán hàng</span>
        </div>

        {editing ? (
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Giá bán (VND)</label>
              <Input
                type="number"
                placeholder="VD: 150000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Đơn vị</label>
              <Input
                placeholder="phần, hộp, kg..."
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mô tả (tùy chọn)</label>
              <Textarea
                placeholder="Ghi chú thêm về sản phẩm..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none rounded-xl text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Lưu
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>
                <X className="size-4" />
                Hủy
              </Button>
            </div>
          </div>
        ) : product ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{formatVND(product.price)}</p>
                <p className="text-xs text-muted-foreground">/ {product.unit}</p>
              </div>
              <Badge
                variant={product.isAvailable ? 'default' : 'secondary'}
                className="rounded-full"
              >
                {product.isAvailable ? 'Đang bán' : 'Tạm dừng'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3">
              <ShoppingBag className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Đã bán:</span>
              <span className="text-sm font-semibold">{product.totalSold ?? 0} {product.unit}</span>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => openEdit(product)}
              >
                <Pencil className="size-4" />
                Chỉnh sửa
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleToggleAvailable}
                title={product.isAvailable ? 'Tạm dừng bán' : 'Mở bán lại'}
              >
                {product.isAvailable
                  ? <ToggleRight className="size-5 text-primary" />
                  : <ToggleLeft className="size-5 text-muted-foreground" />
                }
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <ChefHat className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bạn chưa đăng bán món này. Hãy bắt đầu kinh doanh ngay!
            </p>
            <Button className="rounded-full" onClick={() => openEdit(null)}>
              <Store className="size-4" />
              Đăng bán ngay
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Buyer view
  if (!product || !product.isAvailable) return null

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
        <ShoppingBag className="size-4 text-primary" />
        <span className="text-sm font-semibold">Đặt mua món này</span>
        <Badge variant="secondary" className="ml-auto rounded-full text-xs">
          <BadgeCheck className="size-3 mr-1" />
          Đã bán {product.totalSold ?? 0}
        </Badge>
      </div>

      {ordering ? (
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Số lượng</span>
            <div className="flex items-center gap-3">
              <button
                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button
                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng tiền</span>
            <span className="font-bold text-primary">{formatVND(product.price * qty)}</span>
          </div>
          <Textarea
            placeholder="Ghi chú cho người bán (địa chỉ, thời gian giao hàng...)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none rounded-xl text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-full"
              onClick={handleOrder}
              disabled={submitting}
            >
              {submitting
                ? <Loader2 className="size-4 animate-spin" />
                : <Truck className="size-4" />
              }
              Xác nhận đặt hàng
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setOrdering(false)}
            >
              <X className="size-4" />
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-primary">{formatVND(product.price)}</p>
            <p className="mb-1 text-sm text-muted-foreground">/ {product.unit}</p>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
          <Button
            className="w-full rounded-full"
            size="lg"
            onClick={() => {
              if (!userId) { toast.error('Vui lòng đăng nhập để đặt hàng'); return }
              setOrdering(true)
            }}
          >
            <Package className="size-4" />
            Đặt hàng ngay
          </Button>
        </div>
      )}
    </div>
  )
}
