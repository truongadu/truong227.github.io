'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import {
  ArrowRight,
  Bell,
  ChefHat,
  ChevronDown,
  Compass,
  Flame,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Sparkles,
  User as UserIcon,
  UserPlus,
  Users,
  Check,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { RankAvatarFrame } from '@/components/rank-badge'
import { getUserRank, getUsers } from '@/lib/api'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { encodeUserId, encodePostId } from '@/lib/user-hash'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dock, DockIcon } from '@/components/ui/dock'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RecipeDetailDialog } from '@/components/recipe-detail-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SocialNotification {
  id: number | string
  type: 'like' | 'comment' | 'friend' | 'system'
  actorName: string
  actorAvatar?: string
  text: string
  timeAgo: string
  unread: boolean
  recipeId?: number | string
}

const MOCK_NOTIFICATIONS: SocialNotification[] = []

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isAdmin, fullName, avatarUrl, userId, ready, signOut } = useAuth()
  const { data: allUsers } = useSWR('all-users', getUsers)
  const userAvatar = avatarUrl || ''
  const [communityOpen, setCommunityOpen] = useState(false)
  const communityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [recipesOpen, setRecipesOpen] = useState(false)
  const recipesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<SocialNotification[]>(MOCK_NOTIFICATIONS)
  const [dialogRecipeId, setDialogRecipeId] = useState<string | null>(null)

  const getPostLikesCount = (postId: number | string): number => {
    const numId = Number(postId)
    try {
      const rawMap = localStorage.getItem('facecook_feed_like_count_map')
      if (rawMap) {
        const map = JSON.parse(rawMap)
        if (map[numId] !== undefined) return Number(map[numId])
      }
    } catch {}
    if (numId === 9001) return 520
    if (numId === 9002) return 345
    return 1
  }

  const loadNotifications = () => {
    try {
      const activeId = userId ? String(userId) : '1'
      const raw = localStorage.getItem('facecook_feed_notifications')
      if (raw) {
        const parsed: any[] = JSON.parse(raw)
        const myNotifs = parsed.filter((n) => {
          const r = String(n.recipientUserId || '1')
          return r === activeId
        })
        const mapped: SocialNotification[] = myNotifs.map((n: any, idx: number) => {
          const rawActorId = n.actorUserId ? String(n.actorUserId) : '1'
          const isCurrentActiveActor = rawActorId === activeId

          let resolvedActorName = ''
          let resolvedActorAvatar = ''

          if (isCurrentActiveActor) {
            resolvedActorName = fullName || (typeof window !== 'undefined' ? localStorage.getItem('fullName') : null) || 'Vivian'
            resolvedActorAvatar = avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('avatarUrl') : null) || n.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawActorId}`
          } else {
            const dbUser = allUsers?.find((u) => String(u.userId) === rawActorId)
            if (dbUser && dbUser.fullName) {
              resolvedActorName = dbUser.fullName
              resolvedActorAvatar = dbUser.avatarUrl || n.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawActorId}`
            } else if (n.actorName && !/^\d+$/.test(n.actorName) && n.actorName !== 'Trần Minh Đức') {
              resolvedActorName = n.actorName
              resolvedActorAvatar = n.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawActorId}`
            } else {
              resolvedActorName = getVietnameseOrForeignName(rawActorId)
              resolvedActorAvatar = n.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawActorId}`
            }
          }

          let customText = n.text
          if (n.type === 'like' && n.postId) {
            const totalLikes = getPostLikesCount(n.postId)
            const otherCount = Math.max(0, totalLikes - 1)
            customText = otherCount > 0 ? `và ${otherCount} người khác đã thích bài viết của bạn` : `đã thích bài viết của bạn`
          } else if (!customText) {
            customText = n.type === 'friend_request' ? 'đã gửi lời mời kết bạn' : 'đã tương tác với bạn'
          }
          return {
            id: n.id || idx,
            type: n.type === 'friend_request' ? 'friend' : (n.type || 'like'),
            actorName: resolvedActorName,
            actorAvatar: resolvedActorAvatar,
            text: customText,
            timeAgo: n.timeAgo || 'Vừa xong',
            unread: !n.isRead,
            recipeId: n.postId,
          }
        })
        setNotifications(mapped)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    }
  }

  useEffect(() => {
    loadNotifications()
    const handleUpdate = () => loadNotifications()
    window.addEventListener('facecook_notification_added', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('facecook_notification_added', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [userId, fullName, avatarUrl, allUsers])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllRead = () => {
    try {
      const raw = localStorage.getItem('facecook_feed_notifications')
      if (raw) {
        const parsed = JSON.parse(raw)
        const updated = parsed.map((n: any) => ({ ...n, isRead: true }))
        localStorage.setItem('facecook_feed_notifications', JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('facecook_notification_added'))
        window.dispatchEvent(new Event('storage'))
      }
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc!')
  }

  const handleNotificationClick = (n: SocialNotification) => {
    try {
      const raw = localStorage.getItem('facecook_feed_notifications')
      if (raw) {
        const parsed = JSON.parse(raw)
        const updated = parsed.map((item: any) =>
          String(item.id) === String(n.id) ? { ...item, isRead: true } : item,
        )
        localStorage.setItem('facecook_feed_notifications', JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('facecook_notification_added'))
        window.dispatchEvent(new Event('storage'))
      }
    } catch {}
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)),
    )
    if (n.type === 'like' || n.type === 'comment') {
      if (n.recipeId) {
        router.push(`/feed/status/${encodePostId(n.recipeId)}`)
      } else {
        router.push('/feed')
      }
    } else if (n.type === 'friend') {
      router.push('/friends?tab=requests')
    } else {
      router.push('/profile')
    }
  }

  const handleCommunityMouseEnter = () => {
    if (communityTimeoutRef.current) {
      clearTimeout(communityTimeoutRef.current)
      communityTimeoutRef.current = null
    }
    setCommunityOpen(true)
  }

  const handleCommunityMouseLeave = () => {
    communityTimeoutRef.current = setTimeout(() => {
      setCommunityOpen(false)
    }, 180)
  }

  const handleRecipesMouseEnter = () => {
    if (recipesTimeoutRef.current) {
      clearTimeout(recipesTimeoutRef.current)
      recipesTimeoutRef.current = null
    }
    setRecipesOpen(true)
  }

  const handleRecipesMouseLeave = () => {
    recipesTimeoutRef.current = setTimeout(() => {
      setRecipesOpen(false)
    }, 180)
  }

  const handleNavigate = (path: string) => {
    setCommunityOpen(false)
    setRecipesOpen(false)
    router.push(path)
  }

  const { data: currentRank } = useSWR(
    ready && isAuthenticated && userId ? ['header-rank', userId] : null,
    () => getUserRank(userId!),
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      fallbackData: { totalLikes: 0, rank: 'dong', label: '', currentThreshold: 0, nextThreshold: 10, progress: 0, isMaxRank: false, userId: 0, fullName: '' },
    },
  )
  const myTotalLikes = currentRank?.totalLikes ?? 0

  const handleSignOut = () => {
    signOut()
    router.push('/login')
  }

  const myDisplayName = fullName || getVietnameseOrForeignName(userId)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <ChefHat className="size-5" />
          </span>
          <span className="font-serif text-xl font-bold tracking-tight">
            Facecook
          </span>
        </Link>

        {/* MacOS Dock Navigation (Bảng tin | Công thức | Kế hoạch | Cộng đồng) */}
        <div className="hidden md:flex items-center justify-center relative">
          <Dock iconSize={40} iconMagnification={54} iconDistance={100} className="mt-0 h-[48px] py-1 px-3 border-border/60 bg-background/50 shadow-md">
            {/* 1. Bảng tin */}
            <div className="relative flex flex-col items-center">
              <DockIcon
                className={cn(
                  'transition-colors rounded-xl',
                  pathname.startsWith('/feed') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                )}
                onClick={() => handleNavigate('/feed')}
                onMouseEnter={() => setHoveredNav('Bảng tin')}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <Compass className="size-5" />
              </DockIcon>
            </div>

            {/* 2. Công thức (Dropdown) */}
            <div
              className="relative flex flex-col items-center"
              onMouseEnter={() => { handleRecipesMouseEnter(); setHoveredNav('Công thức') }}
              onMouseLeave={() => { handleRecipesMouseLeave(); setHoveredNav(null) }}
            >
              <DropdownMenu open={recipesOpen} onOpenChange={setRecipesOpen}>
                <DropdownMenuTrigger className="p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 cursor-pointer outline-none">
                  <DockIcon
                    className={cn(
                      'transition-colors rounded-xl cursor-pointer',
                      pathname.startsWith('/recipes')
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <ChefHat className="size-5" />
                  </DockIcon>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  onMouseEnter={handleRecipesMouseEnter}
                  onMouseLeave={handleRecipesMouseLeave}
                  className="w-56 rounded-2xl p-1.5 shadow-xl border border-border/80"
                >
                  <DropdownMenuItem onClick={() => handleNavigate('/recipes')} className="cursor-pointer rounded-xl py-2.5">
                    <ChefHat className="size-4 mr-2.5 text-primary" />
                    <span className="font-medium text-xs">Công thức hệ thống</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/recipes/user')} className="cursor-pointer rounded-xl py-2.5">
                    <UserCheck className="size-4 mr-2.5 text-emerald-500" />
                    <span className="font-medium text-xs">Công thức người dùng</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 3. Kế hoạch */}
            <div className="relative flex flex-col items-center">
              <DockIcon
                className={cn(
                  'transition-colors rounded-xl',
                  pathname.startsWith('/meal-planner') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                )}
                onClick={() => handleNavigate('/meal-planner')}
                onMouseEnter={() => setHoveredNav('Kế hoạch')}
                onMouseLeave={() => setHoveredNav(null)}
              >
                <Sparkles className="size-5" />
              </DockIcon>
            </div>

            {/* 4. Cộng đồng (Dropdown) */}
            <div
              className="relative flex flex-col items-center"
              onMouseEnter={() => { handleCommunityMouseEnter(); setHoveredNav('Cộng đồng') }}
              onMouseLeave={() => { handleCommunityMouseLeave(); setHoveredNav(null) }}
            >
              <DropdownMenu open={communityOpen} onOpenChange={setCommunityOpen}>
                <DropdownMenuTrigger className="p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 cursor-pointer outline-none">
                  <DockIcon
                    className={cn(
                      'transition-colors rounded-xl cursor-pointer',
                      pathname.startsWith('/friends') || pathname.startsWith('/leaderboard') || pathname.startsWith('/shared') || pathname.startsWith('/submit')
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Users className="size-5" />
                  </DockIcon>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  onMouseEnter={handleCommunityMouseEnter}
                  onMouseLeave={handleCommunityMouseLeave}
                  className="w-56 rounded-2xl p-1.5 shadow-xl border border-border/80"
                >
                  <DropdownMenuItem onClick={() => handleNavigate('/friends')} className="cursor-pointer rounded-xl py-2.5">
                    <Users className="size-4 mr-2.5 text-primary" />
                    <span className="font-medium text-xs">Bạn bè & Kết nối</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/leaderboard')} className="cursor-pointer rounded-xl py-2.5">
                    <Flame className="size-4 mr-2.5 text-amber-500" />
                    <span className="font-medium text-xs">Bảng xếp hạng</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Admin (Optional) */}
            {isAdmin && (
              <div className="relative flex flex-col items-center">
                <DockIcon
                  className={cn(
                    'transition-colors rounded-xl',
                    pathname.startsWith('/admin') ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => handleNavigate('/admin')}
                  onMouseEnter={() => setHoveredNav('Quản trị')}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <LayoutDashboard className="size-5" />
                </DockIcon>
              </div>
            )}
          </Dock>

          {/* Floating Tooltip label when hovering over Dock icons */}
          {hoveredNav && (
            <div className="absolute -bottom-8 pointer-events-none z-50 rounded-md bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-background shadow-lg animate-in fade-in zoom-in-95">
              {hoveredNav}
            </div>
          )}
        </div>

        {/* Right Section: Bell Notifications & Profile Avatar (NO Username label) */}
        <div className="flex items-center gap-3">
          {ready && isAuthenticated ? (
            <>
              {/* Bell Icon Notification Popover */}
              <DropdownMenu>
                <DropdownMenuTrigger className="relative flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary cursor-pointer outline-none">
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80 sm:w-96 rounded-2xl p-2 shadow-2xl border border-border/80">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                    <span className="font-serif text-sm font-bold flex items-center gap-2">
                      <Bell className="size-4 text-primary" />
                      Thông báo tương tác
                    </span>
                    <div className="flex items-center gap-2">
                      {isAuthenticated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-500 border border-rose-500/20">
                          <Heart className="size-3 fill-rose-500 text-rose-500" />
                          {myTotalLikes} tim
                        </span>
                      )}
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="size-3" />
                          Đã đọc
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                        <Bell className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-foreground">Chưa có thông báo tương tác mới</p>
                        <p className="text-[11px]">Thông báo thả tim và bình luận sẽ xuất hiện tại đây.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            'flex items-start gap-3 rounded-xl p-2.5 transition-colors text-xs cursor-pointer hover:bg-secondary/70',
                            n.unread ? 'bg-primary/10 border-l-2 border-primary' : '',
                          )}
                        >
                          <div className="relative shrink-0 mt-0.5">
                            <Avatar className="size-7 border border-border/40">
                              <AvatarImage src={n.actorAvatar} alt={n.actorName} />
                              <AvatarFallback className="bg-primary/20 text-primary font-bold text-[10px]">
                                {n.actorName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                'absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full text-white text-[8px]',
                                n.type === 'friend' ? 'bg-blue-500' : 'bg-rose-500',
                              )}
                            >
                              {n.type === 'friend' ? <UserPlus className="size-2.5" /> : <Heart className="size-2.5 fill-current" />}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-foreground leading-snug text-xs">
                              <span className="font-bold">{n.actorName}</span> {n.text}
                            </p>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">{n.timeAgo}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-border/40 pt-1.5 text-center">
                    <Link href="/notifications" className="text-xs text-primary font-semibold hover:underline inline-flex items-center justify-center gap-1 py-1">
                      Xem tất cả thông báo <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Trigger: ONLY Avatar (no name text) */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-full p-0.5 transition-opacity hover:opacity-90 cursor-pointer outline-none">
                  <RankAvatarFrame totalLikes={myTotalLikes}>
                    <Avatar className="size-9 border-2 border-primary/40">
                      <AvatarImage src={userAvatar} alt={myDisplayName} />
                      <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                        {myDisplayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </RankAvatarFrame>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="truncate font-bold text-xs">
                      {myDisplayName}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigate('/feed')} className="cursor-pointer text-xs py-2">
                    <Compass className="size-4 mr-2 text-primary" />
                    <span>Bài viết (Bảng tin)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/profile/' + (userId ? String(userId) : '1'))} className="cursor-pointer text-xs py-2">
                    <UserIcon className="size-4 mr-2 text-emerald-500" />
                    <span>Hồ sơ & Đổi mật khẩu</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/recipes')} className="cursor-pointer text-xs py-2">
                    <ChefHat className="size-4 mr-2 text-amber-500" />
                    <span>Công thức</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/favorites')} className="cursor-pointer text-xs py-2">
                    <Heart className="size-4 mr-2 text-rose-500" />
                    <span>Món yêu thích</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/friends')} className="cursor-pointer text-xs py-2">
                    <Users className="size-4 mr-2 text-blue-500" />
                    <span>Bạn bè & Kết nối</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/leaderboard')} className="cursor-pointer text-xs py-2">
                    <Flame className="size-4 mr-2 text-orange-500" />
                    <span>Bảng xếp hạng</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigate('/submit')} className="cursor-pointer text-xs py-2">
                    <PlusCircle className="size-4 mr-2 text-teal-500" />
                    <span>Đăng công thức</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-xs py-2 text-destructive">
                    <LogOut className="size-4 mr-2" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Đăng nhập
              </Link>
              <Link href="/register" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
      {dialogRecipeId && (
        <RecipeDetailDialog
          recipeId={dialogRecipeId}
          open={Boolean(dialogRecipeId)}
          onOpenChange={(open) => !open && setDialogRecipeId(null)}
        />
      )}
    </header>
  )
}
