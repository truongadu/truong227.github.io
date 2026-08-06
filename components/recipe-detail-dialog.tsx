'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { MOCK_100_RECIPES } from '@/lib/mock-data'
import {
  CheckCircle2,
  Clock,
  Heart,
  ListOrdered,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addFavorite,
  deleteComment,
  deleteRecipe,
  getAllRecipes,
  getFavoriteEntries,
  getComments,
  getRating,
  getRecipe,
  getRecipeIngredientsWithNames,
  getUserRank,
  postComment,
  postRating,
  recipeFallbackImage,
  removeFavorite,
  updateComment,
  type Comment,
  type Recipe,
  type RecipeIngredientItem,
} from '@/lib/api'
import { scaleQuantity, suggestSideDishes } from '@/lib/ai-planner'
import { calculateRecipeNutrition } from '@/lib/calorie-calculator'
import { Minus, Plus, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { RankAvatarFrame } from '@/components/rank-badge'
import { SellerPanel } from '@/components/seller-panel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Xếp hạng">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          aria-label={`${s} sao`}
          className={cn(
            'transition-transform',
            !readonly && 'hover:scale-110',
            readonly && 'cursor-default',
          )}
        >
          <Star
            className={cn(
              'size-5',
              s <= (hover || value)
                ? 'fill-primary text-primary'
                : 'fill-muted text-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  )
}

const DIFFICULTY_COLORS: Record<string, string> = {
  'Dễ': 'bg-green-500/15 text-green-700 dark:text-green-400',
  'Trung bình': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  'Khó': 'bg-red-500/15 text-red-700 dark:text-red-400',
}

type Props = {
  id?: string | number | null
  recipeId?: string | number | null
  recipe?: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecipeDetailDialog({ id, recipeId, recipe: initialRecipe, open, onOpenChange }: Props) {
  const effectiveId = String(initialRecipe?.recipeId || recipeId || id || '')
  const { isAuthenticated, userId, fullName, avatarUrl, isAdmin } = useAuth()
  const userAvatar = avatarUrl || ''
  const isNavigatingRef = useRef(false)

  // Synchronize URL to /recipe/<id> when dialog opens
  useEffect(() => {
    if (open && effectiveId) {
      isNavigatingRef.current = false
      const targetPath = `/recipe/${effectiveId}`
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ recipeId: effectiveId }, '', targetPath)
      }
    } else if (!open && !isNavigatingRef.current && typeof window !== 'undefined' && window.location.pathname.startsWith('/recipe/')) {
      window.history.pushState(null, '', '/recipes')
    }
  }, [open, effectiveId])

  const { data: recipeData, isLoading: loadingRecipe, mutate: mutateRecipe } = useSWR(
    effectiveId ? ['recipe-dialog', effectiveId] : null,
    () => getRecipe(effectiveId),
    { revalidateOnFocus: false },
  )

  const recipe = recipeData || initialRecipe

  const { data: ingredientsData } = useSWR(
    ['recipe-ingredients', effectiveId, recipe?.recipeName],
    () => getRecipeIngredientsWithNames(effectiveId, recipe?.recipeName),
    { revalidateOnFocus: false },
  )

  const fallbackIngredients: RecipeIngredientItem[] = useMemo(() => {
    if (!recipe) return []
    if (recipe.ingredients) {
      try {
        const parsed = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            recipeIngredientId: Number(effectiveId) * 100 + idx,
            recipeId: Number(effectiveId),
            ingredientId: idx + 1,
            ingredientName: item.name || item.ingredientName || '',
            quantity: item.quantity || '',
          }))
        }
      } catch {}
    }
    const cleanName = (recipe.recipeName || '').trim().toLowerCase()
    const mockMatch = MOCK_100_RECIPES.find(
      (r) =>
        r.recipeId === Number(effectiveId) ||
        (cleanName &&
          (r.recipeName.toLowerCase() === cleanName ||
            cleanName.includes(r.recipeName.toLowerCase()) ||
            r.recipeName.toLowerCase().includes(cleanName))),
    )
    if (mockMatch && mockMatch.ingredients) {
      try {
        const parsed = JSON.parse(mockMatch.ingredients)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            recipeIngredientId: Number(effectiveId) * 100 + idx,
            recipeId: Number(effectiveId),
            ingredientId: idx + 1,
            ingredientName: item.name || item.ingredientName || '',
            quantity: item.quantity || '',
          }))
        }
      } catch {}
    }
    return []
  }, [effectiveId, recipe])

  const ingredients = (ingredientsData && ingredientsData.length > 0) ? ingredientsData : fallbackIngredients

  const [commentPage, setCommentPage] = useState(1)
  const [allComments, setAllComments] = useState<Comment[]>([])
  const [totalComments, setTotalComments] = useState(0)
  const { data: commentData, mutate: mutateComments } = useSWR(
    ['comments-dialog', effectiveId, commentPage],
    () => getComments(effectiveId, commentPage, 10),
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        if (commentPage === 1) {
          setAllComments(data.data)
        } else {
          setAllComments(prev => [...prev, ...data.data])
        }
        setTotalComments(data.total)
      },
    },
  )
  const hasMoreComments = allComments.length < totalComments

  const { data: rating, mutate: mutateRating } = useSWR(
    ['rating-dialog', effectiveId],
    () => getRating(effectiveId),
    { revalidateOnFocus: false },
  )

  const { data: favoriteEntries, mutate: mutateFavEntries } = useSWR(
    isAuthenticated && userId ? ['fav-entries-dialog', userId] : null,
    () => getFavoriteEntries(userId!),
    { revalidateOnFocus: false },
  )

  const { data: currentRank } = useSWR(
    isAuthenticated && userId ? ['dialog-rank', userId] : null,
    () => getUserRank(userId!),
  )
  const myTotalLikes = currentRank?.totalLikes ?? 0

  const isFavorited = favoriteEntries?.some(
    (f) => String(f.recipeId) === String(id),
  ) ?? false

  const [servingsCount, setServingsCount] = useState<number>(1)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [savingFav, setSavingFav] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [deletingRecipe, setDeletingRecipe] = useState(false)
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients')

  const { data: allRecipes = [] } = useSWR(
    open ? 'all-recipes-for-side' : null,
    getAllRecipes,
    { revalidateOnFocus: false },
  )

  const sideDishes = recipe ? suggestSideDishes(recipe, allRecipes, new Set<number>(), 2) : []

  const parsedSteps: string[] = (() => {
    if (!recipe?.steps) return []
    try {
      return JSON.parse(recipe.steps)
    } catch {
      return []
    }
  })()

  const parsedNutrition: Record<string, string> = (() => {
    if (recipe?.nutritionInfo) {
      try {
        const n = JSON.parse(recipe.nutritionInfo)
        if (typeof n === 'object' && n !== null) return n
      } catch {}
    }
    if (recipe) {
      const calc = calculateRecipeNutrition(
        recipe.recipeName,
        ingredients?.map((i) => ({ name: i.ingredientName, quantity: i.quantity })) || [],
        recipe.servings || 1
      )
      return calc.perServing
    }
    return {}
  })()

  const nutritionFields = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { key: 'protein', label: 'Protein', unit: '', color: 'text-red-500', bg: 'bg-red-500/10' },
    { key: 'carbs', label: 'Carbs', unit: '', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { key: 'fat', label: 'Chất béo', unit: '', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { key: 'fiber', label: 'Chất xơ', unit: '', color: 'text-green-500', bg: 'bg-green-500/10' },
  ] as const

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!isAuthenticated) {
      toast.error('Đăng nhập để bình luận')
      return
    }
    setPosting(true)
    const ok = await postComment({
      userId: userId!,
      recipeId: effectiveId,
      content: commentText.trim(),
      fullName: fullName || undefined,
    })
    setPosting(false)
    if (ok) {
      setCommentText('')
      toast.success('Đã gửi bình luận')
      mutateComments()
    } else {
      toast.error('Không thể gửi bình luận')
    }
  }

  const handleRating = async (score: number) => {
    if (!isAuthenticated) {
      toast.error('Đăng nhập để đánh giá')
      return
    }
    setMyRating(score)
    const ok = await postRating({ userId: userId!, recipeId: effectiveId, score })
    if (ok) {
      toast.success(`Đã đánh giá ${score} sao`)
      mutateRating()
    } else {
      toast.error('Không thể gửi đánh giá')
    }
  }

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Đăng nhập để lưu yêu thích')
      return
    }
    setSavingFav(true)
    if (isFavorited) {
      const ok = await removeFavorite({ userId: userId!, recipeId: effectiveId })
      setSavingFav(false)
      if (ok) {
        toast.success('Đã xóa khỏi yêu thích')
        mutateFavEntries()
      } else {
        toast.error('Không thể xóa yêu thích')
      }
    } else {
      const ok = await addFavorite({ userId: userId!, recipeId: effectiveId })
      setSavingFav(false)
      if (ok) {
        toast.success('Đã thêm vào yêu thích')
        mutateFavEntries()
      } else {
        toast.error('Không thể thêm vào yêu thích')
      }
    }
  }

  const startEdit = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditText(currentContent)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditText('')
  }

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim()) return
    const ok = await updateComment(commentId, editText.trim(), userId!)
    if (ok) {
      toast.success('Đã chỉnh sửa bình luận')
      cancelEdit()
      mutateComments()
    } else {
      toast.error('Không thể chỉnh sửa bình luận')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    const ok = await deleteComment(commentId, userId!)
    if (ok) {
      toast.success('Đã thu hồi bình luận')
      mutateComments()
      setCommentPage(1)
      setAllComments([])
    } else {
      toast.error('Không thể thu hồi bình luận')
    }
  }

  const isOwner = isAuthenticated && String(recipe?.userId) === String(userId)
  const canModifyRecipe = isOwner || isAdmin

  const handleDeleteRecipe = async () => {
    if (!confirm('Bạn có chắc muốn xóa món ăn này?')) return
    setDeletingRecipe(true)
    const ok = await deleteRecipe(effectiveId)
    setDeletingRecipe(false)
    if (ok) {
      toast.success('Đã xóa món ăn')
      onOpenChange(false)
    } else {
      toast.error('Không thể xóa món ăn')
    }
  }

  const handleEditRecipe = () => {
    onOpenChange(false)
    window.location.href = `/submit?id=${effectiveId}`
  }

  const imgSrc = recipe?.imageUrl || recipeFallbackImage(effectiveId)
  const avg = rating?.averageRating
  const ratingCount = rating?.count ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[1280px] p-0 gap-0 overflow-hidden rounded-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {recipe?.recipeName || 'Chi tiết món ăn'}
        </DialogTitle>

        {loadingRecipe ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !recipe ? (
          <div className="p-12 text-center">
            <p className="font-serif text-xl font-bold">Không tìm thấy món ăn</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:aspect-[16/9]">
            {/* Left: Image */}
            <div className="relative w-full md:w-[480px] lg:w-[560px] shrink-0">
              <img
                src={imgSrc}
                alt={recipe.recipeName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  ; (e.currentTarget as HTMLImageElement).src = recipeFallbackImage(recipe.recipeId)
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent" />

              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <X className="size-5" />
              </button>

              {/* Recipe name overlay on mobile */}
              <div className="absolute bottom-4 left-4 right-4 md:hidden">
                <h2 className="font-serif text-2xl font-bold text-white text-shadow">
                  {recipe.recipeName}
                </h2>
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="overflow-y-auto p-6 pb-0">
                {/* Title + Actions */}
                <div className="mb-4 hidden md:block">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-2xl font-bold">
                      {recipe.recipeName}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canModifyRecipe && (
                        <button
                          onClick={handleDeleteRecipe}
                          disabled={deletingRecipe}
                          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                          title="Xóa"
                        >
                          {deletingRecipe ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={handleFavoriteToggle}
                        disabled={savingFav}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-full transition-colors',
                          isFavorited
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        title={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
                      >
                        <Heart className={cn('size-4', isFavorited && 'fill-current')} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    {recipe.cookingTime && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="size-3.5 text-primary" />
                        <span>{recipe.cookingTime} phút</span>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="size-3.5 text-primary" />
                        <span>{recipe.servings} người</span>
                      </div>
                    )}
                    {recipe.difficulty && (
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', DIFFICULTY_COLORS[recipe.difficulty] || 'bg-secondary text-muted-foreground')}>
                        {recipe.difficulty}
                      </span>
                    )}
                    {avg !== null && avg !== undefined ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="font-medium">{typeof avg === 'number' ? avg.toFixed(1) : avg}</span>
                        <span className="text-muted-foreground">({ratingCount})</span>
                      </div>
                    ) : null}
                  </div>

                  {recipe.description && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {recipe.description}
                    </p>
                  )}
                </div>

                {/* Tabs: Ingredients / Steps / Nutrition */}
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1 mb-4">
                  {[
                    { key: 'ingredients' as const, label: 'Nguyên liệu' },
                    { key: 'steps' as const, label: 'Các bước' },
                    { key: 'nutrition' as const, label: 'Dinh dưỡng' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                        activeTab === tab.key
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="min-h-[120px]">
                  {activeTab === 'ingredients' && (
                    <div className="space-y-3">
                      {/* Portion Scaler */}
                      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Users className="size-4 text-primary" />
                          <span>Tính khẩu phần theo số người:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setServingsCount((v) => Math.max(1, v - 1))}
                            className="flex size-7 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-bold">
                            {servingsCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setServingsCount((v) => v + 1)}
                            className="flex size-7 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <span className="text-xs text-muted-foreground">người</span>
                        </div>
                      </div>

                      {ingredients && ingredients.length > 0 ? (
                        <ul className="space-y-1.5">
                          {ingredients.map((item) => {
                            const scaledQty = scaleQuantity(
                              item.quantity,
                              servingsCount,
                              recipe.servings || 1,
                            )
                            return (
                              <li key={item.recipeIngredientId} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-sm">
                                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                                <span className="font-medium">{item.ingredientName}</span>
                                {scaledQty && (
                                  <span className="ml-auto font-mono text-xs font-semibold text-primary">{scaledQty}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Không có nguyên liệu nào.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'steps' && (
                    <div>
                      {parsedSteps.length > 0 ? (
                        <ol className="space-y-3">
                          {parsedSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                {i + 1}
                              </span>
                              <div className="flex-1 rounded-xl border border-border/40 bg-card/50 p-3">
                                <p className="text-sm leading-relaxed">{step}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          Không có hướng dẫn nào.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'nutrition' && (
                    <div>
                      {Object.keys(parsedNutrition).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {nutritionFields.map((f) => {
                            const val = parsedNutrition[f.key]
                            if (!val) return null
                            return (
                              <div key={f.key} className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                                <span className={`text-lg font-bold ${f.color}`}>{val}</span>
                                <span className="mt-0.5 text-xs text-muted-foreground">{f.label}</span>
                                {f.unit && <span className="text-[10px] text-muted-foreground">{f.unit}</span>}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            Chưa có thông tin dinh dưỡng.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Side Dish Suggestions */}
                {sideDishes.length > 0 && (
                  <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" />
                      AI Gợi ý món ăn đi kèm
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {sideDishes.map((side) => (
                        <div
                          key={side.recipeId}
                          className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 p-2 transition-colors hover:bg-muted/60"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={side.imageUrl || recipeFallbackImage(side.recipeId)}
                            alt={side.recipeName}
                            className="size-9 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{side.recipeName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {side.cookingTime ? `${side.cookingTime} phút` : 'Món gợi ý'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="mb-4 mt-2">
                  <div className="rounded-xl border border-border/40 bg-card/50 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Đánh giá món ăn</p>
                    {isAuthenticated ? (
                      <div className="flex items-center gap-2">
                        <StarRating value={myRating} onChange={handleRating} />
                        {myRating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <CheckCircle2 className="size-3" />
                            {myRating} sao
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(typeof avg === 'number' ? avg : 0)} readonly />
                        <span className="text-xs text-muted-foreground">Đăng nhập để đánh giá</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments - Unified to Feed */}
                <div className="mb-4 rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                  <MessageCircle className="mx-auto size-5 text-primary/70 mb-1" />
                  <p className="text-xs font-medium">Bình luận & Thảo luận món ăn</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Bình luận đã được thống nhất tại <a href="/feed" className="text-primary font-medium hover:underline">Bảng tin (Feed)</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
