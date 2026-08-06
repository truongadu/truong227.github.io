'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Heart } from 'lucide-react'
import { getFavorites } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { RecipeCard } from '@/components/recipe-card'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function FavoritesPage() {
  const { isAuthenticated, userId, ready } = useAuth()

  const { data, isLoading } = useSWR(
    isAuthenticated && userId ? ['favorites', userId] : null,
    () => getFavorites(userId!),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
          <Heart className="size-4 fill-primary" />
          Bộ sưu tập
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">
          Món ăn yêu thích
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground text-pretty">
          Tất cả công thức bạn đã lưu, sẵn sàng cho lần nấu tiếp theo.
        </p>
      </header>

      {ready && !isAuthenticated ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Heart className="size-7" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">
              Bạn chưa đăng nhập
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Đăng nhập để xem và lưu món ăn yêu thích.
            </p>
          </div>
          <Link href="/login" className={buttonVariants({ className: 'rounded-full' })}>
            Đăng nhập
          </Link>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((recipe) => (
            <RecipeCard key={recipe.recipeId} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Heart className="size-7" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">
              Chưa có món yêu thích
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Khám phá thực đơn và lưu lại những món bạn muốn thử.
            </p>
          </div>
          <Link href="/recipes" className={buttonVariants({ className: 'rounded-full' })}>
            Khám phá món ăn
          </Link>
        </div>
      )}
    </div>
  )
}
