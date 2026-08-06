'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { MOCK_100_RECIPES } from '@/lib/mock-data'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit2,
  Heart,
  ListOrdered,
  Loader2,
  MessageCircle,
  MoreHorizontal,
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
  type RecipeIngredientItem,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
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

export function RecipeDetail({ id }: { id: string }) {
  const router = useRouter()
  const { isAuthenticated, userId, fullName, avatarUrl, isAdmin } = useAuth()
  const userAvatar = avatarUrl || ''

  const { data: recipe, isLoading: loadingRecipe } = useSWR(
    ['recipe', id],
    () => getRecipe(id),
    { revalidateOnFocus: false },
  )

  const [commentPage, setCommentPage] = useState(1)
  const [allComments, setAllComments] = useState<Comment[]>([])
  const [totalComments, setTotalComments] = useState(0)
  const { data: commentData, mutate: mutateComments } = useSWR(
    ['comments', id, commentPage],
    () => getComments(id, commentPage, 10),
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
    ['rating', id],
    () => getRating(id),
    { revalidateOnFocus: false },
  )

  const { data: favoriteEntries, mutate: mutateFavEntries } = useSWR(
    isAuthenticated && userId ? ['fav-entries', userId] : null,
    () => getFavoriteEntries(userId!),
    { revalidateOnFocus: false },
  )

  const isFavorited = favoriteEntries?.some(
    (f) => String(f.recipeId) === String(id),
  ) ?? false

  const { data: currentRank } = useSWR(
    isAuthenticated && userId ? ['detail-rank', userId] : null,
    () => getUserRank(userId!),
  )
  const myTotalLikes = currentRank?.totalLikes ?? 0

  const { data: ingredientsData } = useSWR(
    ['recipe-ingredients-detail', id, recipe?.recipeName],
    () => getRecipeIngredientsWithNames(id, recipe?.recipeName),
    { revalidateOnFocus: false },
  )

  const fallbackIngredients: RecipeIngredientItem[] = useMemo(() => {
    if (!recipe) return []
    if (recipe.ingredients) {
      try {
        const parsed = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            recipeIngredientId: Number(id) * 100 + idx,
            recipeId: Number(id),
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
        r.recipeId === Number(id) ||
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
            recipeIngredientId: Number(id) * 100 + idx,
            recipeId: Number(id),
            ingredientId: idx + 1,
            ingredientName: item.name || item.ingredientName || '',
            quantity: item.quantity || '',
          }))
        }
      } catch {}
    }
    return []
  }, [id, recipe])

  const ingredients = (ingredientsData && ingredientsData.length > 0) ? ingredientsData : fallbackIngredients

  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [savingFav, setSavingFav] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [deletingRecipe, setDeletingRecipe] = useState(false)

  const parsedSteps: string[] = (() => {
    if (!recipe?.steps) return []
    try {
      return JSON.parse(recipe.steps)
    } catch {
      return []
    }
  })()

  const parsedNutrition: Record<string, string> = (() => {
    if (!recipe?.nutritionInfo) return {}
    try {
      const n = JSON.parse(recipe.nutritionInfo)
      if (typeof n === 'object' && n !== null) return n
      return {}
    } catch {
      return {}
    }
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
      recipeId: id,
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
    const ok = await postRating({ userId: userId!, recipeId: id, score })
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
      const ok = await removeFavorite({ userId: userId!, recipeId: id })
      setSavingFav(false)
      if (ok) {
        toast.success('Đã xóa khỏi yêu thích')
        mutateFavEntries()
      } else {
        toast.error('Không thể xóa yêu thích')
      }
    } else {
      const ok = await addFavorite({ userId: userId!, recipeId: id })
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

  const isCommentOwner = (c: Comment) => isAuthenticated && String(c.userId) === String(userId)

  const loadMoreComments = () => {
    setCommentPage(prev => prev + 1)
  }

  const handleDeleteRecipe = async () => {
    if (!confirm('Bạn có chắc muốn xóa món ăn này?')) return
    setDeletingRecipe(true)
    const ok = await deleteRecipe(id)
    setDeletingRecipe(false)
    if (ok) {
      toast.success('Đã xóa món ăn')
      router.push('/recipes')
    } else {
      toast.error('Không thể xóa món ăn')
    }
  }

  const handleEditRecipe = () => {
    router.push(`/submit?id=${id}`)
  }

  if (loadingRecipe) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-serif text-2xl font-bold">Không tìm thấy món ăn</p>
        <p className="mt-2 text-muted-foreground">
          Món ăn này không tồn tại hoặc đã bị xóa.
        </p>
        <Link href="/recipes" className={buttonVariants({ className: 'mt-6 rounded-full' })}>
          Quay lại thực đơn
        </Link>
      </div>
    )
  }

  const imgSrc = recipe.imageUrl || recipeFallbackImage(recipe.recipeId)
  const avg = rating?.averageRating
  const ratingCount = rating?.count ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </button>

      {/* Hero image */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={recipe.recipeName}
          className="aspect-[16/9] w-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(recipe.recipeId)
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Recipe info */}
      <div className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-bold sm:text-4xl text-balance">
              {recipe.recipeName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {recipe.cookingTime && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-4 text-primary" />
                  <span>{recipe.cookingTime} phút</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4 text-primary" />
                  <span>{recipe.servings} người</span>
                </div>
              )}
              {recipe.difficulty && (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    DIFFICULTY_COLORS[recipe.difficulty] || 'bg-secondary text-muted-foreground',
                  )}
                >
                  {recipe.difficulty}
                </span>
              )}
              {avg !== null && avg !== undefined ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-medium">{avg.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({ratingCount} đánh giá)
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canModifyRecipe && (
              <Button
                onClick={handleDeleteRecipe}
                disabled={deletingRecipe}
                variant="outline"
                className="rounded-full text-destructive border-destructive/40 hover:bg-destructive/15"
              >
                {deletingRecipe ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Xóa
              </Button>
            )}
            <Button
              onClick={handleFavoriteToggle}
              disabled={savingFav}
              variant={isFavorited ? 'default' : 'outline'}
              className="rounded-full"
            >
              <Heart className={cn('size-4', isFavorited && 'fill-current')} />
              {isFavorited ? 'Đã yêu thích' : 'Lưu yêu thích'}
            </Button>
          </div>
        </div>

        {recipe.description && (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
        )}
      </div>

      {/* Ingredients */}
      {ingredients && ingredients.length > 0 && (
        <>
          <div className="my-10 h-px bg-border/60" />
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-bold">I</span>
              Nguyên liệu
            </h2>
            <ul className="space-y-2">
              {ingredients.map((item) => (
                <li key={item.recipeIngredientId} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
                  <span className="size-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{item.ingredientName}</span>
                  {item.quantity && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Steps */}
      {parsedSteps.length > 0 && (
        <>
          <div className="my-10 h-px bg-border/60" />
          <section className="mb-10">
            <h2 className="mb-5 flex items-center gap-2 font-serif text-xl font-semibold">
              <ListOrdered className="size-5 text-primary" />
              Các bước thực hiện
            </h2>
            <ol className="space-y-4">
              {parsedSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-sm leading-relaxed">{step}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}



      {/* Nutrition */}
      {Object.keys(parsedNutrition).length > 0 && (
        <>
          <div className="my-10 h-px bg-border/60" />
          <section className="mb-10">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm font-bold">N</span>
              <h2 className="font-serif text-xl font-semibold">Giá trị dinh dưỡng</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {nutritionFields.map((f) => {
                const val = parsedNutrition[f.key]
                if (!val) return null
                return (
                  <div
                    key={f.key}
                    className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-4 text-center"
                  >
                    <span className={`text-2xl font-bold ${f.color}`}>{val}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{f.label}</span>
                    {f.unit && <span className="text-[10px] text-muted-foreground">{f.unit}</span>}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Divider */}
      <div className="my-10 h-px bg-border/60" />

      {/* Rating section */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold">
          <Star className="size-5 text-primary" />
          Đánh giá món ăn
        </h2>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Chọn số sao để đánh giá:
              </p>
              <StarRating value={myRating} onChange={handleRating} />
              {myRating > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="size-4" />
                  Bạn đã đánh giá {myRating} sao
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(avg || 0)} readonly />
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Đăng nhập
                </Link>{' '}
                để đánh giá món ăn này.
              </p>
            </div>
          )}
        </div>
      </section>



      {/* Unified Feed Comments Banner */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-center">
        <MessageCircle className="mx-auto size-8 text-primary/70" />
        <h3 className="mt-2 font-serif text-lg font-semibold">Thảo luận & Bình luận món ăn</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Bình luận và giao lưu về món ăn này hiện đã được thống nhất tại <Link href="/feed" className="text-primary font-medium hover:underline">Bảng tin (Feed)</Link>.
        </p>
        <div className="mt-4">
          <Link href="/feed" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Chuyển đến Bảng tin Feed
          </Link>
        </div>
      </section>
    </div>
  )
}
