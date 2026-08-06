'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Search, UtensilsCrossed, X } from 'lucide-react'
import {
  getRecipes,
  getUsers,
  type Recipe,
  type FavoriteEntry,
} from '@/lib/api'
import { RecipeCard } from '@/components/recipe-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function normalizeVietnamese(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

function sortByFavorites(
  recipes: Recipe[],
  favEntries: FavoriteEntry[] | undefined,
): Recipe[] {
  if (!favEntries) return recipes
  // Count favorites per recipe
  const countMap: Record<number, number> = {}
  for (const f of favEntries) {
    countMap[f.recipeId] = (countMap[f.recipeId] ?? 0) + 1
  }
  return [...recipes].sort(
    (a, b) => (countMap[b.recipeId] ?? 0) - (countMap[a.recipeId] ?? 0),
  )
}

export function RecipeGrid({
  showSearch = true,
  limit,
  sortByLikes = false,
}: {
  showSearch?: boolean
  limit?: number
  sortByLikes?: boolean
}) {
  const [term, setTerm] = useState('')

  const { data: rawRecipes = [], isLoading } = useSWR<Recipe[]>(
    'recipes-grid-all',
    () => getRecipes(),
    { revalidateOnFocus: false },
  )

  // Instant filter by dish name (recipeName)
  const filteredRaw = useMemo(() => {
    if (!term.trim()) return rawRecipes
    const searchNorm = normalizeVietnamese(term)
    return rawRecipes.filter((r) => {
      const nameNorm = normalizeVietnamese(r.recipeName)
      return nameNorm.includes(searchNorm)
    })
  }, [rawRecipes, term])

  // Fetch all favorite entries to get per-recipe counts
  const { data: allFavEntries } = useSWR<FavoriteEntry[]>(
    sortByLikes ? 'all-fav-entries-for-sort' : null,
    async () => {
      // Call the general /favorites endpoint for counts
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5206/api'}/favorites`,
      )
      if (!response.ok) return []
      return response.json()
    },
    { revalidateOnFocus: false },
  )

  const TASTE_TAGS = ['Tất cả', 'Cay', 'Không cay', 'Bắc', 'Trung', 'Nam', 'Healthy', 'Eat Clean', 'Chay', 'Keto', 'Low Carb']
  const [selectedTag, setSelectedTag] = useState('Tất cả')

  const sorted = sortByLikes && filteredRaw
    ? sortByFavorites(filteredRaw, allFavEntries)
    : filteredRaw

  const filteredByTag = sorted?.filter((r) => {
    if (selectedTag === 'Tất cả') return true
    const text = (r.recipeName + ' ' + (r.description || '') + ' ' + (r.difficulty || '')).toLowerCase()
    const tagLower = selectedTag.toLowerCase()

    if (selectedTag === 'Cay') return text.includes('cay') || text.includes('ớt') || text.includes('sa tế')
    if (selectedTag === 'Không cay') return !text.includes('cay') && !text.includes('ớt')
    if (selectedTag === 'Chay') {
      const nonVeg = ['thịt', 'gà', 'bò', 'heo', 'tôm', 'cá', 'chả']
      return !nonVeg.some((kw) => text.includes(kw))
    }
    return text.includes(tagLower)
  })

  const recipes = limit ? filteredByTag?.slice(0, limit) : filteredByTag

  // Fetch users for author name display
  const { data: allUsers } = useSWR(
    recipes && recipes.length > 0 ? 'grid-users' : null,
    () => getUsers(),
    { revalidateOnFocus: false },
  )
  const userMap = new Map((allUsers || []).map(u => [Number(u.userId), u.fullName || u.email]))

  return (
    <div className="space-y-8">
      {showSearch && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Nhập tên món ăn (vd: Phở bò, Cơm tấm...)..."
                className="h-12 rounded-full pl-11 pr-10 text-base"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Taste & Diet filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khẩu vị:</span>
            {TASTE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.recipeId} recipe={recipe} authorName={userMap.get(Number(recipe.userId))} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UtensilsCrossed className="size-7" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">
              Không tìm thấy món ăn nào
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử từ khóa khác hoặc khám phá toàn bộ thực đơn.
            </p>
          </div>
          {term && (
            <Button
              variant="outline"
              onClick={() => {
                setTerm('')
              }}
            >
              Xem tất cả món ăn
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
