'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Search, UtensilsCrossed, X, UserCheck, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { getRecipes, getCategories, type Recipe } from '@/lib/api'
import { RecipeCard } from '@/components/recipe-card'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function normalizeVietnamese(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
}

export default function UserRecipesPage() {
  const [term, setTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const { data: categories } = useSWR('page-categories', getCategories)
  const { data: rawRecipes = [], isLoading } = useSWR('page-all-recipes', getRecipes, {
    revalidateOnFocus: false,
  })

  // Filter recipes created by users (where userId exists and > 0)
  const userRecipes = useMemo(() => {
    return rawRecipes.filter((r) => r.userId && Number(r.userId) > 0)
  }, [rawRecipes])

  // Filter ONLY by recipeName
  const filteredRecipes = useMemo(() => {
    if (!term.trim()) return userRecipes
    const searchNorm = normalizeVietnamese(term)
    return userRecipes.filter((r) => {
      const nameNorm = normalizeVietnamese(r.recipeName)
      return nameNorm.includes(searchNorm)
    })
  }, [userRecipes, term])

  const categoryMap = useMemo(() => {
    if (!categories || !filteredRecipes) return new Map<number, Recipe[]>()
    const map = new Map<number, Recipe[]>()
    categories.forEach((cat) => map.set(cat.categoryId, []))

    const uncategorized: Recipe[] = []
    filteredRecipes.forEach((r) => {
      if (r.categoryId && map.has(r.categoryId)) {
        map.get(r.categoryId)!.push(r)
      } else {
        uncategorized.push(r)
      }
    })

    if (uncategorized.length > 0 && categories.length > 0) {
      const firstCatId = categories[0].categoryId
      if (map.has(firstCatId)) {
        map.get(firstCatId)!.push(...uncategorized)
      }
    }

    return map
  }, [categories, filteredRecipes])

  const filteredCategories = useMemo(() => {
    if (!categories) return []
    return selectedCategory
      ? categories.filter((c) => c.categoryId === selectedCategory)
      : categories.filter((c) => (categoryMap.get(c.categoryId)?.length ?? 0) > 0)
  }, [categories, categoryMap, selectedCategory])

  const hasAnyMatches = filteredCategories.some(
    (c) => (categoryMap.get(c.categoryId)?.length ?? 0) > 0,
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
          <UserCheck className="size-4" />
          <span>Cộng đồng Facecook</span>
        </div>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
          Công thức người dùng
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">
          Khám phá những công thức nấu ăn độc đáo được sáng tạo và chia sẻ bởi cộng đồng người dùng Facecook.
        </p>
        <div className="mt-4">
          <Link
            href="/submit"
            className={buttonVariants({
              variant: 'default',
              size: 'sm',
              className: 'rounded-full font-medium gap-1.5 shadow-sm',
            })}
          >
            <PlusCircle className="size-4" />
            Đóng góp công thức mới
          </Link>
        </div>
      </header>

      {/* Instant Search by Dish Name */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nhập tên món ăn từ người dùng (vd: Bún bò, Cơm chiên...)..."
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

      {/* Category pills */}
      {categories && categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Tất cả
            </button>
          )}
          {categories.map((cat) => {
            const count = categoryMap.get(cat.categoryId)?.length ?? 0
            return (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCategory(cat.categoryId === selectedCategory ? null : cat.categoryId)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                  selectedCategory === cat.categoryId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {cat.categoryName}
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : hasAnyMatches ? (
        <div className="space-y-12">
          {filteredCategories.map((cat) => {
            const recipes = categoryMap.get(cat.categoryId) ?? []
            if (recipes.length === 0) return null
            return (
              <section key={cat.categoryId}>
                <h2 className="mb-5 flex items-center gap-2 font-serif text-2xl font-bold">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary text-sm">
                    {cat.categoryName[0]}
                  </span>
                  {cat.categoryName}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({recipes.length} món)
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((recipe) => (
                    <RecipeCard key={recipe.recipeId} recipe={recipe} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UtensilsCrossed className="size-7" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">Chưa có công thức người dùng nào {term ? `cho từ khóa "${term}"` : ''}</p>
            <p className="mt-1 text-sm text-muted-foreground">Hãy là người đầu tiên chia sẻ món ăn ngon của bạn với cộng đồng!</p>
          </div>
          <Link
            href="/submit"
            className={buttonVariants({ variant: 'default', className: 'rounded-full font-medium' })}
          >
            Đăng công thức đầu tiên
          </Link>
        </div>
      )}
    </div>
  )
}
