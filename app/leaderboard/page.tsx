'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  Award,
  ChefHat,
  Flame,
  Heart,
  Loader2,
  Medal,
  Star,
  Trophy,
  TrendingUp,
  Users,
  Utensils,
} from 'lucide-react'
import {
  getLeaderboardFavorites,
  getMasterChef,
  getLeaderboardRatings,
  getAllRecipes,
  getUsers,
  recipeFallbackImage,
  type LeaderboardFavoriteEntry,
  type LeaderboardEntry,
  type MasterChefEntry,
} from '@/lib/api'
import { getSynchronizedFeedPosts, getUserTotalLikes } from '@/lib/feed-posts'
import { encodeUserId } from '@/lib/user-hash'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RankBadge, RankAvatarFrame } from '@/components/rank-badge'
import { PostStatusModal } from '@/components/post-status-modal'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

type Tab = 'ratings' | 'favorites' | 'master-chef'

const TABS: { key: Tab; label: string; icon: typeof Star }[] = [
  { key: 'ratings',     label: 'Đánh giá',           icon: Star },
  { key: 'favorites',   label: 'Nhiều tim nhất',      icon: Heart },
  { key: 'master-chef', label: 'Bảng xếp hạng MasterChef', icon: TrendingUp },
]

type Period = 'all' | 'week' | 'month' | 'year'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all',   label: 'Tất cả' },
  { key: 'week',  label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year',  label: 'Năm' },
]

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function RankIcon({ position, size = 'size-6' }: { position: number; size?: string }) {
  if (position === 1) return <Trophy className={`${size} text-yellow-500`} />
  if (position === 2) return <Medal className={`${size} text-slate-400`} />
  if (position === 3) return <Award className={`${size} text-amber-600`} />
  return (
    <span className={`flex ${size} items-center justify-center text-sm font-bold text-muted-foreground`}>
      {position}
    </span>
  )
}

function Podium({
  items,
  getImage,
  getLabel,
  getSub,
  getInitial,
  onSelect,
}: {
  items: any[]
  getImage: (item: any) => string | undefined
  getLabel: (item: any) => string
  getSub: (item: any) => string
  getInitial?: (item: any) => string
  onSelect?: (item: any) => void
}) {
  if (items.length < 3) return null
  const [first, second, third] = items
  const renderImg = (item: any, cls: string) => {
    const src = getImage(item)
    if (src) return <img src={src} alt="" className={cls} />
    const initial = getInitial?.(item)
    return <div className={`${cls} flex items-center justify-center bg-primary/10 text-lg font-bold text-primary`}>{initial ?? '?'}</div>
  }
  return (
    <div className="mb-8 grid grid-cols-3 gap-3">
      <div
        onClick={() => onSelect?.(second)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-50/50 dark:bg-slate-900/20 p-4 text-center order-1",
          onSelect && "cursor-pointer hover:border-primary/40 transition-colors"
        )}
      >
        <Medal className="size-7 text-slate-400" />
        {renderImg(second, 'size-16 rounded-xl object-cover')}
        <p className="text-xs font-medium truncate w-full">{getLabel(second)}</p>
        <span className="text-xs text-muted-foreground line-clamp-1">{getSub(second)}</span>
      </div>
      <div
        onClick={() => onSelect?.(first)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border border-yellow-300/60 bg-yellow-50/50 dark:bg-yellow-900/20 p-4 text-center order-2 -mt-4 shadow-sm",
          onSelect && "cursor-pointer hover:border-yellow-400/80 transition-colors"
        )}
      >
        <Trophy className="size-8 text-yellow-500" />
        {renderImg(first, 'h-24 w-24 rounded-2xl object-cover shadow-lg')}
        <p className="text-xs font-semibold truncate w-full">{getLabel(first)}</p>
        <span className="text-xs text-muted-foreground line-clamp-1">{getSub(first)}</span>
      </div>
      <div
        onClick={() => onSelect?.(third)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/20 p-4 text-center order-3",
          onSelect && "cursor-pointer hover:border-primary/40 transition-colors"
        )}
      >
        <Award className="size-7 text-amber-600" />
        {renderImg(third, 'size-16 rounded-xl object-cover')}
        <p className="text-xs font-medium truncate w-full">{getLabel(third)}</p>
        <span className="text-xs text-muted-foreground line-clamp-1">{getSub(third)}</span>
      </div>
    </div>
  )
}

// --- Rows ---

function RatingRow({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  return (
    <Link
      href={`/recipe/${entry.recipeId}`}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm',
        position === 1 && 'border-yellow-300/60 bg-yellow-50/30 dark:bg-yellow-900/10',
        position === 2 && 'border-slate-300/60 bg-slate-50/30 dark:bg-slate-900/10',
        position === 3 && 'border-amber-300/60 bg-amber-50/30 dark:bg-amber-900/10',
      )}
    >
      <div className="flex w-8 shrink-0 items-center justify-center">
        <RankIcon position={position} />
      </div>
      <div className="relative shrink-0 overflow-hidden rounded-xl">
        <img src={entry.imageUrl || recipeFallbackImage(entry.recipeId)} alt="" className="h-16 w-16 rounded-xl object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = recipeFallbackImage(entry.recipeId) }} />
        {position <= 3 && <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/20" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate group-hover:text-primary transition-colors">{entry.recipeName}</p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChefHat className="size-3" />
            {entry.sellerName ?? 'Ẩn danh'}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            {entry.averageRating != null ? entry.averageRating.toFixed(1) : '--'}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end text-primary font-bold">
          <Star className="size-4" />
          {entry.ratingCount.toLocaleString('vi-VN')}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">đánh giá</p>
      </div>
    </Link>
  )
}

function FavoritePostRow({ post, position, onSelect }: { post: any; position: number; onSelect: (post: any) => void }) {
  const authorUserId = post.authorId || ((post.id % 1523) + 1)
  const displayAuthor = post.authorName
  const displayAvatar = post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUserId}`
  const userTotalLikes = getUserTotalLikes(authorUserId)

  return (
    <div
      onClick={() => onSelect(post)}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer',
        position === 1 && 'border-yellow-300/60 bg-yellow-50/30 dark:bg-yellow-900/10',
        position === 2 && 'border-slate-300/60 bg-slate-50/30 dark:bg-slate-900/10',
        position === 3 && 'border-amber-300/60 bg-amber-50/30 dark:bg-amber-900/10',
      )}
    >
      <div className="flex w-8 shrink-0 items-center justify-center">
        <RankIcon position={position} />
      </div>

      {/* Author Avatar & Frame */}
      <RankAvatarFrame totalLikes={userTotalLikes}>
        <Avatar className="size-12 shrink-0 border border-primary/20">
          <AvatarImage src={displayAvatar} alt={displayAuthor} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold">
            {displayAuthor[0]}
          </AvatarFallback>
        </Avatar>
      </RankAvatarFrame>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">
            {displayAuthor}
          </span>
          <RankBadge totalLikes={userTotalLikes} size="sm" />
        </div>
        <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5 font-normal">
          {post.content || post.recipeName || 'Bài viết chia sẻ ẩm thực'}
        </p>
        {post.recipeName && (
          <span className="inline-flex items-center gap-1 text-[11px] text-primary mt-1 font-medium bg-primary/10 px-2 py-0.5 rounded-full">
            <Utensils className="size-3" />
            {post.recipeName}
          </span>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end text-red-500 font-bold text-base">
          <Heart className="size-4 fill-current" />
          {(post.initialLikes || 0).toLocaleString('vi-VN')}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">lượt tim bài viết</p>
      </div>
    </div>
  )
}

function MasterChefRow({ entry, position }: { entry: any; position: number }) {
  const recipesCount = entry.totalRecipes || 1
  const calculatedScore = Number((((recipesCount * 10) + entry.totalLikes) / recipesCount).toFixed(1))

  return (
    <Link
      href={`/profile/${encodeUserId(entry.userId)}`}
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 group',
        position === 1 && 'border-yellow-300/60 bg-yellow-50/30 dark:bg-yellow-900/10',
        position === 2 && 'border-slate-300/60 bg-slate-50/30 dark:bg-slate-900/10',
        position === 3 && 'border-amber-300/60 bg-amber-50/30 dark:bg-amber-900/10',
      )}
    >
      <div className="flex w-8 shrink-0 items-center justify-center">
        <RankIcon position={position} />
      </div>
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 overflow-hidden">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-primary">{entry.fullName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">{entry.fullName}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span><ChefHat className="size-3 inline mr-0.5 text-primary" />{recipesCount} công thức</span>
          <span><Heart className="size-3 inline mr-0.5 text-red-500 fill-red-500" />{entry.totalLikes} tim bài viết</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end text-primary font-bold">
          <TrendingUp className="size-4" />
          {calculatedScore}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">điểm trung bình</p>
      </div>
    </Link>
  )
}

// --- Empty state ---
function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-20 text-center">
      <Icon className="mx-auto size-10 text-muted-foreground" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

export default function LeaderboardPage() {
  const { userId, fullName, avatarUrl } = useAuth()
  const [tab, setTab] = useState<Tab>('ratings')
  const [period, setPeriod] = useState<Period>('all')
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})
  const [activeStatusPost, setActiveStatusPost] = useState<any>(null)

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem('facecook_feed_user_posts')
      if (savedPosts) setUserPosts(JSON.parse(savedPosts))
      const savedLikes = localStorage.getItem('facecook_feed_like_count_map')
      if (savedLikes) setLikeCountMap(JSON.parse(savedLikes))
    } catch {}
  }, [])

  const { data: allUsers } = useSWR('all-users', getUsers)
  const { data: allRecipes } = useSWR('feed-recipes', getAllRecipes)

  const showPeriod = tab === 'ratings' || tab === 'master-chef'

  const { data: ratings, isLoading: loadingRatings } = useSWR(
    tab === 'ratings' ? ['leaderboard-ratings', period] : null,
    () => getLeaderboardRatings(period === 'all' ? undefined : period),
    { revalidateOnFocus: false },
  )
  const { data: rawFavorites, isLoading: loadingFavs } = useSWR(
    tab === 'favorites' ? ['leaderboard-favorites'] : null,
    () => getLeaderboardFavorites(),
    { revalidateOnFocus: false },
  )
  const { data: rawMasterChef, isLoading: loadingMaster } = useSWR(
    tab === 'master-chef' ? ['leaderboard-master', period] : null,
    () => getMasterChef(period === 'all' ? undefined : period),
    { revalidateOnFocus: false },
  )

  // Construct synchronized feed posts to calculate live likes per user
  const synchronizedPosts = getSynchronizedFeedPosts(allRecipes ?? [], allUsers ?? [], userPosts)
  const allFeedPosts = synchronizedPosts.map((p) => {
    const customLikes = likeCountMap[p.id]
    return {
      ...p,
      initialLikes: customLikes !== undefined ? customLikes : p.initialLikes,
    }
  })

  // Synchronize MasterChef likes with live user total likes
  const masterChef: MasterChefEntry[] = (rawMasterChef || []).map((entry) => {
    const liveLikes = getUserTotalLikes(entry.userId, allFeedPosts)
    return {
      ...entry,
      totalLikes: liveLikes > 0 ? liveLikes : entry.totalLikes,
    }
  }).sort((a, b) => {
    const recipesA = a.totalRecipes || 1
    const recipesB = b.totalRecipes || 1
    const scoreA = ((recipesA * 10) + a.totalLikes) / recipesA
    const scoreB = ((recipesB * 10) + b.totalLikes) / recipesB
    return scoreB - scoreA
  })

  // Synchronize Favorites list sorted by post likes
  const favoritePosts = [...allFeedPosts].sort((a, b) => b.initialLikes - a.initialLikes)

  const isLoading = loadingRatings || loadingFavs || loadingMaster

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Flame className="size-4" />
          Bảng xếp hạng
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">
          {tab === 'ratings' && 'Món ăn được đánh giá cao nhất'}
          {tab === 'favorites' && 'Bài viết & Món ăn nhiều tim nhất'}
          {tab === 'master-chef' && 'Bảng xếp hạng Master Chef'}
        </h1>
        <p className="mt-2 text-muted-foreground text-xs leading-relaxed max-w-md mx-auto">
          {tab === 'ratings' && 'Dựa trên điểm đánh giá trung bình và tổng số lượt đánh giá của cộng đồng.'}
          {tab === 'favorites' && 'Dựa trên tổng số lượt thả tim trên Bảng tin mạng xã hội.'}
          {tab === 'master-chef' && 'Xếp hạng Đầu bếp dựa trên Điểm tương tác Bảng tin và Số lượng công thức đã đóng góp.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-xl bg-muted/50 p-1 gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer',
              tab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5 text-primary" />
            {label}
          </button>
        ))}
      </div>

      {/* Period filter */}
      {showPeriod && (
        <div className="mb-6 flex rounded-xl bg-muted/50 p-1 gap-1 max-w-xs mx-auto">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer',
                period === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Top 3 Podium */}
      {tab === 'ratings' && !loadingRatings && ratings && ratings.length >= 3 && (
        <Podium
          items={ratings}
          getImage={(e: LeaderboardEntry) => e.imageUrl || recipeFallbackImage(e.recipeId)}
          getLabel={(e: LeaderboardEntry) => e.recipeName}
          getSub={(e: LeaderboardEntry) => `${e.averageRating?.toFixed(1) ?? '--'}⭐ (${e.ratingCount} đánh giá)`}
        />
      )}

      {tab === 'favorites' && favoritePosts && favoritePosts.length >= 3 && (
        <Podium
          items={favoritePosts}
          getImage={(p: any) => p.authorAvatar || p.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`}
          getLabel={(p: any) => p.authorName}
          getSub={(p: any) => `❤️ ${p.initialLikes} tim · ${p.recipeName || 'Bài viết Bảng tin'}`}
          onSelect={(p: any) => setActiveStatusPost(p)}
        />
      )}

      {tab === 'master-chef' && !loadingMaster && masterChef && masterChef.length >= 3 && (
        <Podium
          items={masterChef}
          getImage={(e: MasterChefEntry) => e.avatarUrl || undefined}
          getLabel={(e: MasterChefEntry) => e.fullName}
          getSub={(e: MasterChefEntry) => `${(((e.totalRecipes || 1) * 10 + e.totalLikes) / (e.totalRecipes || 1)).toFixed(1)} điểm · ❤️${e.totalLikes} tim`}
          getInitial={(e: MasterChefEntry) => e.fullName.charAt(0).toUpperCase()}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground text-xs">
          <Loader2 className="size-5 animate-spin text-primary" />
          Đang tải bảng xếp hạng...
        </div>
      ) : tab === 'ratings' && (!ratings || ratings.length === 0) ? (
        <EmptyState icon={Star} title="Chưa có dữ liệu đánh giá" desc="Bảng xếp hạng sẽ hiển thị khi có đánh giá từ người dùng." />
      ) : tab === 'favorites' && (!favoritePosts || favoritePosts.length === 0) ? (
        <EmptyState icon={Heart} title="Chưa có dữ liệu thả tim" desc="Bảng xếp hạng sẽ hiển thị khi có lượt tim bài viết." />
      ) : tab === 'master-chef' && (!masterChef || masterChef.length === 0) ? (
        <EmptyState icon={Users} title="Chưa có dữ liệu" desc="Bảng xếp hạng sẽ hiển thị khi có các đầu bếp đăng công thức." />
      ) : (
        <div className="space-y-3">
          {tab === 'ratings' && ratings!.map((e, i) => <RatingRow key={e.recipeId} entry={e} position={i + 1} />)}
          {tab === 'favorites' && favoritePosts.map((p, i) => <FavoritePostRow key={p.id} post={p} position={i + 1} onSelect={(post) => setActiveStatusPost(post)} />)}
          {tab === 'master-chef' && masterChef!.map((e, i) => <MasterChefRow key={e.userId} entry={e} position={i + 1} />)}
        </div>
      )}

      <PostStatusModal
        open={Boolean(activeStatusPost)}
        onOpenChange={(op) => !op && setActiveStatusPost(null)}
        post={activeStatusPost}
        allUsers={allUsers}
        currentUserId={userId ? Number(userId) : undefined}
        currentUserName={fullName ?? undefined}
        currentUserAvatar={avatarUrl ?? undefined}
      />
    </main>
  )
}
