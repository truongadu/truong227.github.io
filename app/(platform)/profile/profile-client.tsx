'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { decodeUserId, encodeUserId } from '@/lib/user-hash'
import {
  ChefHat,
  Heart,
  Landmark,
  LogOut,
  Mail,
  Pencil,
  PlusCircle,
  User,
  Users,
  Camera,
  CheckCircle2,
  Loader2,
  X,
  Lock,
  Compass,
  Clock,
  Sparkles,
  Utensils,
  BookOpen,
  Flame,
} from 'lucide-react'
import {
  getFavorites,
  getRecipesByUser,
  getMembershipRank,
  getUserRank,
  getUser,
  getUsers,
  getAllRecipes,
  updateUser,
  recipeFallbackImage,
  createRecipe,
  getCategories,
  type Recipe,
} from '@/lib/api'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { calculateRecipeNutrition } from '@/lib/calorie-calculator'
import { getSynchronizedFeedPosts, getPostsForUser, getUserTotalLikes, type SocialPost } from '@/lib/feed-posts'
import { PostStatusModal } from '@/components/post-status-modal'
import { AvatarCircles } from '@/components/ui/avatar-circles'
import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RankAvatarFrame, RankProgress } from '@/components/rank-badge'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const RecipeDetailDialog = dynamic(
  () => import('@/components/recipe-detail-dialog').then((m) => m.RecipeDetailDialog),
  { ssr: false },
)

function initials(name?: string | null) {
  if (!name) return 'U'
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('')
}

type Tab = 'posts' | 'profile' | 'products' | 'favorites'

type SavedUserPost = {
  id: number
  authorName: string
  content: string
  imageUrl?: string
  timeAgo: string
  recipeName?: string
  initialLikes?: number
}

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const { isAuthenticated, isAdmin, userId, fullName, email, ready, signOut } = useAuth()

  const rawHash = (params?.id as string) || (searchParams ? searchParams.get('id') || searchParams.get('userId') : null)
  const tabParam = searchParams ? (searchParams.get('tab') as Tab | null) : null

  const decodedTargetId = rawHash ? decodeUserId(rawHash) : null

  const isOwnProfile = !decodedTargetId || String(decodedTargetId) === String(userId)
  const activeUserId = isOwnProfile
    ? userId
    : (decodedTargetId ? (isNaN(Number(decodedTargetId)) ? decodedTargetId : Number(decodedTargetId)) : userId)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState<Tab>('posts')

  useEffect(() => {
    if (tabParam && ['posts', 'profile', 'products', 'favorites'].includes(tabParam)) {
      if (tabParam === 'profile' && !isOwnProfile) {
        setActiveTab('posts')
      } else {
        setActiveTab(tabParam)
      }
    }
  }, [tabParam, isOwnProfile])

  // Saved user social posts from Feed & Live synchronized like counts
  const [mySocialPosts, setMySocialPosts] = useState<SavedUserPost[]>([])
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('facecook_feed_user_posts')
      if (saved) setMySocialPosts(JSON.parse(saved))
      const savedLikes = localStorage.getItem('facecook_feed_liked_map')
      if (savedLikes) setLikedMap(JSON.parse(savedLikes))
      const savedLikeCounts = localStorage.getItem('facecook_feed_like_count_map')
      if (savedLikeCounts) setLikeCountMap(JSON.parse(savedLikeCounts))
    } catch {}
  }, [])

  useEffect(() => {
    const handleSyncFeedData = () => {
      try {
        const savedLikes = localStorage.getItem('facecook_feed_liked_map')
        if (savedLikes) setLikedMap(JSON.parse(savedLikes))
        const savedLikeCounts = localStorage.getItem('facecook_feed_like_count_map')
        if (savedLikeCounts) setLikeCountMap(JSON.parse(savedLikeCounts))
        const savedPosts = localStorage.getItem('facecook_feed_user_posts')
        if (savedPosts) setMySocialPosts(JSON.parse(savedPosts))
      } catch {}
    }

    window.addEventListener('facecook_like_updated', handleSyncFeedData)
    window.addEventListener('facecook_post_created', handleSyncFeedData)
    window.addEventListener('storage', handleSyncFeedData)
    return () => {
      window.removeEventListener('facecook_like_updated', handleSyncFeedData)
      window.removeEventListener('facecook_post_created', handleSyncFeedData)
      window.removeEventListener('storage', handleSyncFeedData)
    }
  }, [])

  // Profile data & All Feed Posts
  const { data: allUsers } = useSWR('all-users', getUsers)
  const { data: allRecipes } = useSWR('feed-recipes', getAllRecipes)

  const { data: serverUser, mutate: mutateUser } = useSWR(
    activeUserId ? ['user-profile', activeUserId] : null,
    () => getUser(activeUserId!),
  )
  const { data: favorites, isLoading: loadingFavs } = useSWR(
    activeUserId ? ['favorites', activeUserId] : null,
    () => getFavorites(activeUserId!),
  )
  const { data: myRecipes, mutate: mutateMyRecipes } = useSWR(
    activeUserId ? ['my-recipes', activeUserId] : null,
    () => getRecipesByUser(activeUserId!),
  )
  const { data: userRank } = useSWR(
    activeUserId ? ['user-rank', activeUserId] : null,
    () => getUserRank(activeUserId!),
  )
  const { data: categories } = useSWR('categories', getCategories)

  const synchronizedPosts = getSynchronizedFeedPosts(allRecipes ?? [], allUsers ?? [], mySocialPosts as any)
  const allFeedPosts = synchronizedPosts.map((p) => {
    const customLikes = likeCountMap[p.id]
    return {
      ...p,
      initialLikes: customLikes !== undefined ? customLikes : p.initialLikes,
    }
  })
  const userFeedPosts = activeUserId ? getPostsForUser(activeUserId, allFeedPosts) : []
  const [activeStatusPost, setActiveStatusPost] = useState<SocialPost | null>(null)

  const totalLove = activeUserId ? getUserTotalLikes(activeUserId, allFeedPosts) : 0

  // Edit profile state
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Create new recipe form inside Products tab
  const [showCreateRecipe, setShowCreateRecipe] = useState(false)
  const [creatingRecipe, setCreatingRecipe] = useState(false)
  const [recipeForm, setRecipeForm] = useState({
    recipeName: '',
    description: '',
    categoryId: '1',
    cookingTime: '30',
    difficulty: 'Trung bình',
    servings: '2',
    imageUrl: '',
  })

  const [recipeIngredients, setRecipeIngredients] = useState<{ name: string; quantity: string }[]>([
    { name: 'Thịt bò', quantity: '200g' },
    { name: 'Phở tươi', quantity: '180g' },
  ])

  const liveNutrition = calculateRecipeNutrition(
    recipeForm.recipeName,
    recipeIngredients,
    parseInt(recipeForm.servings) || 1
  )

  // Dialog state
  const [dialogId, setDialogId] = useState<string | null>(null)

  const displayName = isOwnProfile
    ? (serverUser?.fullName || fullName || getVietnameseOrForeignName(userId))
    : getVietnameseOrForeignName(activeUserId, serverUser?.fullName)

  const displayEmail = isOwnProfile
    ? (serverUser?.email || email || 'user@facecook.com')
    : (serverUser?.email || `thanhvien_${activeUserId}@facecook.com`)

  const displayAvatar = serverUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUserId}`
  const rank = getMembershipRank(totalLove)

  const handleSignOut = () => {
    signOut()
    router.push('/login')
  }

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error('Tên không được để trống')
      return
    }
    setSavingProfile(true)
    const res = await updateUser(userId!, { fullName: newName.trim(), avatarUrl: avatarUrl || undefined })
    setSavingProfile(false)
    if (res.ok) {
      toast.success('Đã cập nhật thông tin')
      setEditingName(false)
      mutateUser()
      if (res.data?.fullName) localStorage.setItem('fullName', res.data.fullName)
    } else {
      toast.error(res.message || 'Cập nhật thất bại')
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    setSavingPassword(true)
    const res = await updateUser(userId!, {
      currentPassword,
      newPassword,
      confirmPassword,
    })
    setSavingPassword(false)
    if (res.ok) {
      toast.success('Đã đổi mật khẩu thành công')
      setChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(res.message || 'Đổi mật khẩu thất bại')
    }
  }

  const handleCreateRecipe = async () => {
    if (!recipeForm.recipeName.trim()) {
      toast.error('Vui lòng nhập tên công thức')
      return
    }
    setCreatingRecipe(true)
    const res = await createRecipe({
      recipeName: recipeForm.recipeName.trim(),
      description: recipeForm.description.trim(),
      categoryId: parseInt(recipeForm.categoryId) || 1,
      cookingTime: parseInt(recipeForm.cookingTime) || 30,
      difficulty: recipeForm.difficulty,
      servings: parseInt(recipeForm.servings) || 2,
      imageUrl: recipeForm.imageUrl.trim() || undefined,
      nutritionInfo: JSON.stringify(liveNutrition.perServing),
      status: 'approved',
      userId: Number(userId!),
    })
    setCreatingRecipe(false)
    if (res.ok) {
      toast.success('Đăng sản phẩm công thức mới thành công!')
      setShowCreateRecipe(false)
      setRecipeForm({
        recipeName: '',
        description: '',
        categoryId: '1',
        cookingTime: '30',
        difficulty: 'Trung bình',
        servings: '2',
        imageUrl: '',
      })
      mutateMyRecipes()
    } else {
      toast.error(res.message || 'Đăng bài thất bại')
    }
  }

  if (!mounted || !ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    )
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <User className="size-7" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold">Chưa đăng nhập</h1>
        <p className="mt-2 text-muted-foreground">Đăng nhập để xem hồ sơ cá nhân của bạn.</p>
        <Link href="/login" className={buttonVariants({ className: 'mt-6 rounded-full' })}>
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        {/* Cover Header */}
        <div className="relative h-36 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <img src="/hero-dish.png" alt="" className="size-full object-cover opacity-25" />
        </div>

        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <RankAvatarFrame totalLikes={totalLove}>
              <Avatar className="size-24 border-4 border-card">
                {displayAvatar ? <AvatarImage src={displayAvatar} alt={displayName} /> : null}
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
            </RankAvatarFrame>
            <div className="mb-1 flex flex-wrap gap-2">
              <Badge className="rounded-full" style={{ background: rank.color, color: '#000' }}>
                <ChefHat className="size-3 mr-1" />
                {rank.label}
              </Badge>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Quản trị viên
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold">{displayName}</h1>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setEditingName(true)
                    setNewName(displayName)
                    setAvatarUrl(displayAvatar)
                  }}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{displayEmail}</p>
          </div>

          {/* Edit Profile Form */}
          {editingName && (
            <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-background/40 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tên hiển thị</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl text-xs"
                  placeholder="Tên của bạn"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  <Camera className="inline size-3 mr-1" />
                  URL ảnh đại diện
                </Label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="rounded-xl text-xs"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full h-8 text-xs" onClick={handleSaveName} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Lưu thông tin
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full h-8 text-xs" onClick={() => setEditingName(false)}>
                  <X className="size-3.5" />
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {/* Love level progress */}
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Cấp độ tương tác — {totalLove} lượt tim bài viết
            </p>
            <RankProgress totalLikes={totalLove} />
          </div>

          {/* Overview Counters */}
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/40 p-3 text-center">
              <dt className="text-xs text-muted-foreground">Bài viết Bảng tin</dt>
              <dd className="mt-1 text-xl font-bold">{userFeedPosts.length}</dd>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/40 p-3 text-center">
              <dt className="text-xs text-muted-foreground">Công thức đã đăng</dt>
              <dd className="mt-1 text-xl font-bold">{myRecipes?.length ?? 0}</dd>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background/40 p-3 text-center">
              <dt className="text-xs text-muted-foreground">Món yêu thích</dt>
              <dd className="mt-1 text-xl font-bold">
                {loadingFavs ? <Skeleton className="mx-auto h-6 w-8" /> : favorites?.length ?? 0}
              </dd>
            </div>
          </dl>

          {/* Main Sequence Tabs */}
          <div className={cn('mt-6 grid rounded-xl bg-muted/50 p-1 gap-1', isOwnProfile ? 'grid-cols-4' : 'grid-cols-3')}>
            {(isOwnProfile
              ? [
                  { key: 'posts' as const, label: 'Bài viết', icon: Compass },
                  { key: 'profile' as const, label: 'Hồ sơ', icon: User },
                  { key: 'products' as const, label: 'Công thức', icon: ChefHat },
                  { key: 'favorites' as const, label: 'Yêu thích', icon: Heart },
                ]
              : [
                  { key: 'posts' as const, label: 'Bài viết', icon: Compass },
                  { key: 'products' as const, label: 'Công thức', icon: ChefHat },
                  { key: 'favorites' as const, label: 'Yêu thích', icon: Heart },
                ]
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                  activeTab === key
                    ? 'bg-background text-foreground shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: BÀI VIẾT */}
          {activeTab === 'posts' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  Bài viết Bảng tin đã đăng ({userFeedPosts.length})
                </h3>
                <Link href="/feed" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-8 rounded-full text-xs' })}>
                  <PlusCircle className="size-3.5" />
                  Đăng bài Bảng tin
                </Link>
              </div>

              {userFeedPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center space-y-3">
                  <Compass className="mx-auto size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Người dùng này chưa đăng bài viết nào trên Bảng tin.</p>
                  <Link href="/feed" className={buttonVariants({ size: 'sm', className: 'rounded-full text-xs font-semibold' })}>
                    Đến Bảng tin đăng bài
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userFeedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 border border-border/40">
                            <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                              {post.authorName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-foreground">{post.authorName}</p>
                            <span className="text-[10px] text-muted-foreground">{post.timeAgo}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">Đã đăng</Badge>
                      </div>

                      {post.content && (
                        <p
                          onClick={() => setActiveStatusPost(post)}
                          className="text-xs text-foreground leading-relaxed whitespace-pre-line cursor-pointer hover:text-primary transition-colors"
                        >
                          {post.content}
                        </p>
                      )}

                      {post.recipeName && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs font-medium text-primary flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChefHat className="size-4" />
                            <span>Đính kèm công thức: {post.recipeName}</span>
                          </div>
                          {post.attachedRecipeId && (
                            <Link href={`/recipe/${post.attachedRecipeId}`} className="text-[11px] font-bold underline">
                              Xem ➔
                            </Link>
                          )}
                        </div>
                      )}

                      {post.imageUrl && (
                        <div
                          onClick={() => setActiveStatusPost(post)}
                          className="relative aspect-video overflow-hidden rounded-xl bg-muted cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.imageUrl}
                            alt="Post Media"
                            className="size-full object-cover"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(post.id)
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                        <button
                          onClick={() => setActiveStatusPost(post)}
                          className={cn(
                            'flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer font-medium',
                            likedMap[post.id] && 'text-rose-500 font-bold',
                          )}
                        >
                          <Heart className={cn('size-3.5', likedMap[post.id] ? 'fill-rose-500 text-rose-500' : 'fill-rose-500/20 text-rose-500')} />
                          <span>{likedMap[post.id] ? 'Đã tim' : 'Thả tim'} ({post.initialLikes})</span>
                        </button>
                        <button onClick={() => setActiveStatusPost(post)} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer font-medium">
                          <Compass className="size-3.5" />
                          <span>Xem bài viết status ➔</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HỒ SƠ */}
          {activeTab === 'profile' && (
            <div className="mt-6 space-y-5">
              <dl className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
                  <User className="size-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Họ và tên</dt>
                    <dd className="font-medium">{displayName}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-4">
                  <Mail className="size-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Email đăng nhập</dt>
                    <dd className="font-medium">{displayEmail || 'Chưa cập nhật'}</dd>
                  </div>
                </div>
              </dl>

              {/* Change Password Section */}
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Lock className="size-4 text-primary" />
                    Cài đặt mật khẩu tài khoản
                  </div>
                  {!changingPassword && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 text-xs font-semibold"
                      onClick={() => setChangingPassword(true)}
                    >
                      Đổi mật khẩu
                    </Button>
                  )}
                </div>

                {changingPassword && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Mật khẩu cũ (hiện tại)</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl text-xs bg-card"
                        placeholder="Nhập mật khẩu hiện tại..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Mật khẩu mới</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl text-xs bg-card"
                        placeholder="•••••• (tối thiểu 6 ký tự)"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nhập lại mật khẩu mới</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl text-xs bg-card"
                        placeholder="Nhập lại mật khẩu mới..."
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="rounded-full h-8 text-xs font-semibold" onClick={handleChangePassword} disabled={savingPassword}>
                        {savingPassword ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                        Cập nhật mật khẩu
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 text-xs"
                        onClick={() => {
                          setChangingPassword(false)
                          setCurrentPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                        }}
                      >
                        <X className="size-3.5" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button variant="ghost" onClick={handleSignOut} className="rounded-full text-xs text-destructive hover:text-destructive">
                  <LogOut className="size-3.5" />
                  Đăng xuất tài khoản
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: CÔNG THỨC */}
          {activeTab === 'products' && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <ChefHat className="size-4 text-primary" />
                    Công thức món ăn đã đăng ({myRecipes?.length ?? 0})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Quản lý và đăng tải các món ăn của bạn.</p>
                </div>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateRecipe(!showCreateRecipe)}
                    className="rounded-full text-xs font-semibold gap-1.5"
                  >
                    <PlusCircle className="size-4" />
                    {showCreateRecipe ? 'Đóng khung' : 'Đăng công thức mới'}
                  </Button>
                )}
              </div>

              {/* Create Recipe Form Expandable */}
              {showCreateRecipe && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                    <h4 className="font-serif font-semibold text-base text-primary flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      Đăng sản phẩm công thức mới
                    </h4>
                    <button onClick={() => setShowCreateRecipe(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Tên món ăn / sản phẩm *</Label>
                      <Input
                        value={recipeForm.recipeName}
                        onChange={(e) => setRecipeForm({ ...recipeForm, recipeName: e.target.value })}
                        placeholder="VD: Phở Bò Tái Nạm Truyền Thống"
                        className="rounded-xl text-xs bg-card h-9 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">Danh mục món</Label>
                        <select
                          value={recipeForm.categoryId}
                          onChange={(e) => setRecipeForm({ ...recipeForm, categoryId: e.target.value })}
                          className="mt-1 flex h-9 w-full rounded-xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          {categories?.map((c) => (
                            <option key={c.categoryId} value={String(c.categoryId)}>
                              {c.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Thời gian nấu (phút)</Label>
                        <Input
                          type="number"
                          value={recipeForm.cookingTime}
                          onChange={(e) => setRecipeForm({ ...recipeForm, cookingTime: e.target.value })}
                          className="rounded-xl text-xs bg-card h-9 mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">Độ khó</Label>
                        <select
                          value={recipeForm.difficulty}
                          onChange={(e) => setRecipeForm({ ...recipeForm, difficulty: e.target.value })}
                          className="mt-1 flex h-9 w-full rounded-xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <option value="Dễ">Dễ</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Khó">Khó</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Khẩu phần (người)</Label>
                        <Input
                          type="number"
                          value={recipeForm.servings}
                          onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                          className="rounded-xl text-xs bg-card h-9 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Mô tả món ăn</Label>
                      <Textarea
                        value={recipeForm.description}
                        onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                        placeholder="Mô tả hương vị, đặc điểm hấp dẫn của món ăn..."
                        className="rounded-xl text-xs bg-card min-h-[70px] mt-1"
                      />
                    </div>

                    {/* Real-time Ingredient & Calorie Calculation Engine */}
                    <div className="space-y-2.5 rounded-2xl border border-primary/20 bg-background/60 p-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                          <Utensils className="size-3.5" />
                          Danh sách nguyên liệu & Tính Calo (kcal)
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setRecipeIngredients([...recipeIngredients, { name: '', quantity: '' }])}
                          className="h-7 text-[11px] rounded-full text-primary hover:text-primary"
                        >
                          <PlusCircle className="size-3 mr-1" />
                          Thêm nguyên liệu
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {recipeIngredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder="Tên nguyên liệu (VD: Thịt bò, Phở tươi...)"
                              value={ing.name}
                              onChange={(e) => {
                                const next = [...recipeIngredients]
                                next[idx].name = e.target.value
                                setRecipeIngredients(next)
                              }}
                              className="h-8 text-xs bg-card rounded-xl flex-1"
                            />
                            <Input
                              placeholder="Gam (VD: 50g)"
                              value={ing.quantity}
                              onChange={(e) => {
                                const next = [...recipeIngredients]
                                next[idx].quantity = e.target.value
                                setRecipeIngredients(next)
                              }}
                              className="h-8 text-xs bg-card rounded-xl w-36 sm:w-40 shrink-0"
                            />
                            {recipeIngredients.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}
                                className="text-muted-foreground hover:text-destructive p-1"
                              >
                                <X className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Live Calculation Results Card */}
                      <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Flame className="size-4 text-amber-500 animate-pulse" />
                            <span>Tự Động Tính Calo (Real-time):</span>
                          </div>
                          <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-xs rounded-full px-2.5">
                            ⚡ {liveNutrition.perServing.calories} kcal / khẩu phần
                          </Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-[11px] pt-1">
                          <div className="rounded-lg bg-background/80 p-1.5 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground">Protein</span>
                            <span className="font-bold text-foreground">{liveNutrition.perServing.protein}</span>
                          </div>
                          <div className="rounded-lg bg-background/80 p-1.5 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground">Carbs</span>
                            <span className="font-bold text-foreground">{liveNutrition.perServing.carbs}</span>
                          </div>
                          <div className="rounded-lg bg-background/80 p-1.5 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground">Fat</span>
                            <span className="font-bold text-foreground">{liveNutrition.perServing.fat}</span>
                          </div>
                          <div className="rounded-lg bg-background/80 p-1.5 border border-border/40">
                            <span className="block text-[10px] text-muted-foreground">Fiber</span>
                            <span className="font-bold text-foreground">{liveNutrition.perServing.fiber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">URL Hình ảnh món ăn</Label>
                      <Input
                        value={recipeForm.imageUrl}
                        onChange={(e) => setRecipeForm({ ...recipeForm, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="rounded-xl text-xs bg-card h-9 mt-1"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleCreateRecipe}
                        disabled={creatingRecipe}
                        className="rounded-full text-xs font-semibold px-5"
                      >
                        {creatingRecipe ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                        Đăng sản phẩm công thức
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCreateRecipe(false)}
                        className="rounded-full text-xs"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipe List */}
              <div>
                {!myRecipes ? (
                  <Skeleton className="h-24 w-full rounded-2xl" />
                ) : myRecipes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border py-12 text-center space-y-3">
                    <ChefHat className="mx-auto size-9 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Bạn chưa đăng sản phẩm công thức nào.</p>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateRecipe(true)}
                      className="rounded-full text-xs font-semibold"
                    >
                      <PlusCircle className="size-3.5 mr-1" />
                      Đăng sản phẩm ngay
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {myRecipes.map((r) => (
                      <div
                        key={r.recipeId}
                        onClick={() => setDialogId(String(r.recipeId))}
                        className="group cursor-pointer flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <img
                          src={r.imageUrl || recipeFallbackImage(r.recipeId)}
                          alt={r.recipeName}
                          className="size-16 shrink-0 rounded-xl object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(r.recipeId)
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{r.recipeName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{r.cookingTime ? `${r.cookingTime} phút` : ''}</span>
                            <span>•</span>
                            <span>{r.difficulty || 'Dễ'}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: YÊU THÍCH */}
          {activeTab === 'favorites' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Heart className="size-4 text-rose-500 fill-rose-500" />
                  Món ăn đã yêu thích ({favorites?.length ?? 0})
                </h3>
              </div>

              {loadingFavs ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              ) : !favorites || favorites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center space-y-3">
                  <Heart className="mx-auto size-9 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Bạn chưa lưu món ăn yêu thích nào.</p>
                  <Link href="/recipes" className={buttonVariants({ size: 'sm', className: 'rounded-full text-xs font-semibold' })}>
                    Khám phá kho công thức
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {favorites.map((fav) => (
                    <div
                      key={fav.recipeId}
                      onClick={() => setDialogId(String(fav.recipeId))}
                      className="group cursor-pointer flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 transition-all hover:border-rose-500/40 hover:shadow-sm"
                    >
                      <img
                        src={fav.imageUrl || recipeFallbackImage(fav.recipeId)}
                        alt={fav.recipeName}
                        className="size-16 shrink-0 rounded-xl object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(fav.recipeId)
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-rose-500 transition-colors">
                          {fav.recipeName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <Clock className="size-3" />
                          <span>{fav.cookingTime || 30} phút</span>
                          <span>•</span>
                          <span>{fav.servings || 2} người</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {dialogId && (
        <RecipeDetailDialog
          id={dialogId}
          open={!!dialogId}
          onOpenChange={(open) => {
            if (!open) setDialogId(null)
          }}
        />
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
    </div>
  )
}
