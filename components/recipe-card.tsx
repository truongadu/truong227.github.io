'use client'

import { memo, useState } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { Clock, Heart } from 'lucide-react'
import { toast } from 'sonner'
import {
  addFavorite,
  getFavoriteEntries,
  getRankConfig,
  recipeFallbackImage,
  removeFavorite,
  type Recipe,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

const RecipeDetailDialog = dynamic(
  () => import('@/components/recipe-detail-dialog').then((m) => m.RecipeDetailDialog),
  { ssr: false },
)

export const RecipeCard = memo(function RecipeCard({ recipe, authorName }: { recipe: Recipe; authorName?: string }) {
  const { isAuthenticated, userId } = useAuth()
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: favoriteEntries, mutate: mutateFavs } = useSWR(
    isAuthenticated && userId ? ['fav-entries', userId] : null,
    () => getFavoriteEntries(userId!),
    { revalidateOnFocus: false },
  )

  const isFavorited =
    favoriteEntries?.some(
      (f) => String(f.recipeId) === String(recipe.recipeId),
    ) ?? false

  const imgSrc = recipe.imageUrl || recipeFallbackImage(recipe.recipeId)

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Đăng nhập để lưu món yêu thích')
      return
    }
    setSaving(true)
    if (isFavorited) {
      const ok = await removeFavorite({
        userId: userId!,
        recipeId: recipe.recipeId,
      })
      setSaving(false)
      if (ok) {
        toast.success('Đã xóa khỏi yêu thích')
        mutateFavs()
      } else {
        toast.error('Không thể xóa yêu thích')
      }
    } else {
      const ok = await addFavorite({
        userId: userId!,
        recipeId: recipe.recipeId,
      })
      setSaving(false)
      if (ok) {
        toast.success('Đã thêm vào yêu thích')
        mutateFavs()
      } else {
        toast.error('Không thể thêm vào yêu thích')
      }
    }
  }

  return (
    <>
      <div
        onClick={() => setDialogOpen(true)}
        className="group block cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-black/20"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={recipe.recipeName}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(
                recipe.recipeId,
              )
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {recipe.hasActiveProduct && recipe.sellerRank && (
            <div
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
              style={{ backgroundColor: getRankConfig(recipe.sellerRank).color }}
            >
              Đang bán
            </div>
          )}

          {recipe.cookingTime && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Clock className="size-3" />
              {recipe.cookingTime} phút
            </div>
          )}

          <button
            onClick={handleFavoriteToggle}
            disabled={saving}
            aria-label={isFavorited ? 'Xóa khỏi yêu thích' : 'Lưu vào yêu thích'}
            className={cn(
              'absolute right-3 top-3 flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-110',
              isFavorited
                ? 'bg-primary/90 text-primary-foreground'
                : 'bg-black/50 text-white hover:bg-black/70',
              saving && 'opacity-50',
            )}
          >
            <Heart
              className={cn('size-4', isFavorited && 'fill-current')}
            />
          </button>
        </div>

        <div className="p-5">
          <h3 className="line-clamp-1 font-serif text-lg font-semibold transition-colors group-hover:text-primary">
            {recipe.recipeName}
          </h3>
          {authorName && (
            <p className="mt-1 text-xs text-muted-foreground">
              {authorName}
            </p>
          )}
          {recipe.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {recipe.description}
            </p>
          )}
          {recipe.difficulty && (
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {recipe.difficulty}
              </span>
              {recipe.servings && (
                <span className="text-xs text-muted-foreground">
                  {recipe.servings} người
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <RecipeDetailDialog
        id={String(recipe.recipeId)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
})
