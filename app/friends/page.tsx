'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  Check,
  ChefHat,
  Eye,
  Gift,
  Heart,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Send,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getFriends,
  getPendingRequests,
  getSharedInbox,
  getUsers,
  getRecipes,
  sendFriendRequest,
  updateFriendStatus,
  removeFriend,
  shareRecipe,
  markSharedRead,
  type AppUser,
  type Friend,
  type SharedRecipe,
} from '@/lib/api'
import { encodeUserId } from '@/lib/user-hash'
import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants as BtnVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { RankBadge, RankAvatarFrame } from '@/components/rank-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

function UserCard({
  user,
  children,
}: {
  user: AppUser & { totalLikes?: number }
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-primary/40">
      <Link
        href={`/profile/${encodeUserId(user.userId)}`}
        className="flex items-center gap-3 min-w-0 flex-1 group"
      >
        <RankAvatarFrame totalLikes={user.totalLikes ?? 0}>
          <Avatar className="size-10 shrink-0 border-2 border-primary/20 transition-colors group-hover:border-primary">
            <AvatarImage src={user.avatarUrl} alt={user.fullName || ''} />
            <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
              {(user.fullName || 'U').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </RankAvatarFrame>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium group-hover:text-primary transition-colors flex items-center gap-1.5">
            {user.fullName || 'Người dùng'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <RankBadge
              totalLikes={user.totalLikes ?? 0}
              size="sm"
              showLabel={true}
            />
          </div>
        </div>
      </Link>
      {children}
    </div>
  )
}

function FriendProfileDialog({
  user,
  open,
  onOpenChange,
  currentUserId,
}: {
  user: (AppUser & { totalLikes?: number }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: number | string
}) {
  const { data: allRecipes } = useSWR('all-recipes-friends-preview', getRecipes)
  if (!user) return null

  const userRecipes = (allRecipes || []).filter(
    (r) => String(r.userId) === String(user.userId)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-xl font-bold">
            Hồ sơ đầu bếp
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <RankAvatarFrame totalLikes={user.totalLikes ?? 0}>
            <Avatar className="size-20 border-4 border-primary/30">
              <AvatarImage src={user.avatarUrl} alt={user.fullName || ''} />
              <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                {(user.fullName || 'U').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </RankAvatarFrame>

          <div>
            <h3 className="font-serif text-lg font-bold">{user.fullName || 'Người dùng'}</h3>
            <p className="text-xs text-muted-foreground">{user.email || 'Thành viên Facecook'}</p>
          </div>

          <div className="flex items-center gap-3">
            <RankBadge totalLikes={user.totalLikes ?? 0} size="md" showLabel={true} />
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-500 border border-rose-500/20">
              <Heart className="size-3.5 fill-rose-500 text-rose-500" />
              {user.totalLikes ?? 0} tim tương tác
            </span>
          </div>

          <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-3 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Món ăn đã đăng ({userRecipes.length})
            </p>
            {userRecipes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2 text-center">Chưa đăng món ăn nào.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {userRecipes.map((r) => (
                  <Link
                    key={r.recipeId}
                    href={`/recipe/${r.recipeId}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between rounded-lg bg-card p-2 text-xs hover:bg-secondary transition-colors"
                  >
                    <span className="font-medium truncate">{r.recipeName}</span>
                    <span className="text-[10px] text-primary shrink-0 flex items-center gap-1 font-semibold">
                      <ChefHat className="size-3" />
                      Xem công thức
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-end gap-2 pt-2">
            <ShareRecipeDialog
              toUserId={user.userId}
              toUserName={user.fullName || 'bạn'}
              currentUserId={currentUserId}
            />
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShareRecipeDialog({
  toUserId,
  toUserName,
  currentUserId,
}: {
  toUserId: number | string
  toUserName: string
  currentUserId: number | string
}) {
  const { data: recipes } = useSWR('all-recipes-share', getRecipes)
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const handleShare = async () => {
    if (!selectedRecipeId) {
      toast.error('Vui lòng chọn món ăn')
      return
    }
    setSending(true)
    const res = await shareRecipe({
      fromUserId: currentUserId,
      toUserId,
      recipeId: Number(selectedRecipeId),
      message: message.trim() || undefined,
    })
    setSending(false)
    if (res.ok) {
      toast.success(`Đã chia sẻ công thức tới ${toUserName}!`)
      setOpen(false)
      setSelectedRecipeId('')
      setMessage('')
    } else {
      toast.error(res.message || 'Không thể chia sẻ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="rounded-full h-8 px-3 gap-1.5">
            <Gift className="size-3.5 text-primary" />
            Chia sẻ
          </Button>
        }
      />
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Chia sẻ công thức với {toUserName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Chọn món ăn</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border/60 p-2">
              {recipes?.map((r) => (
                <button
                  key={r.recipeId}
                  type="button"
                  onClick={() => setSelectedRecipeId(String(r.recipeId))}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    String(r.recipeId) === selectedRecipeId
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'hover:bg-secondary',
                  )}
                >
                  {r.recipeName}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Lời nhắn (tùy chọn)</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bạn ơi, mình nghĩ bạn sẽ thích món này..."
              className="resize-none min-h-[70px] rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              Hủy
            </Button>
            <Button onClick={handleShare} disabled={sending} className="rounded-full">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Gửi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function FriendsPage() {
  const { isAuthenticated, userId, ready } = useAuth()
  const [tab, setTab] = useState<'friends' | 'requests' | 'inbox' | 'search'>('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [selectedUserForModal, setSelectedUserForModal] = useState<(AppUser & { totalLikes?: number }) | null>(null)

  // Listen to ?tab= query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tab')
      if (t === 'requests' || t === 'inbox' || t === 'search' || t === 'friends') {
        setTab(t)
      }
    }
  }, [])

  const { data: friends, mutate: mutateFriends } = useSWR(
    isAuthenticated && userId ? ['friends', userId] : null,
    () => getFriends(userId!),
  )
  const { data: pendingRequests, mutate: mutatePending } = useSWR(
    isAuthenticated && userId ? ['friend-requests', userId] : null,
    () => getPendingRequests(userId!),
  )
  const { data: inbox, mutate: mutateInbox } = useSWR(
    isAuthenticated && userId ? ['shared-inbox', userId] : null,
    () => getSharedInbox(userId!),
  )
  const { data: allUsers } = useSWR('all-users', getUsers)

  const filteredUsers =
    searchTerm.trim().length > 1
      ? (allUsers || []).filter(
          (u) =>
            String(u.userId) !== String(userId) &&
            (u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email?.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      : []

  const friendUserIds = new Set(
    (friends || []).flatMap((f) => [
      String(f.userId),
      String(f.friendUserId),
    ]),
  )

  const handleSendRequest = async (targetUserId: string) => {
    if (!userId) return
    setSending((p) => ({ ...p, [targetUserId]: true }))
    const res = await sendFriendRequest({
      userId: userId!,
      friendUserId: targetUserId,
    })
    setSending((p) => ({ ...p, [targetUserId]: false }))
    if (res.ok) {
      toast.success('Đã gửi lời mời kết bạn!')
      mutatePending()
    } else {
      toast.error(res.message || 'Không thể gửi lời mời')
    }
  }

  const pendingMap = new Map(
    (pendingRequests || []).map((r) => [
      String(r.friendUserId) === String(userId) ? String(r.userId) : String(r.friendUserId),
      r,
    ]),
  )

  const handleCancelRequest = async (targetUserId: string, req: Friend) => {
    setSending((p) => ({ ...p, [targetUserId]: true }))
    const ok = await updateFriendStatus(req.friendId!, 'rejected')
    setSending((p) => ({ ...p, [targetUserId]: false }))
    if (ok) {
      toast.success('Đã hủy lời mời kết bạn')
      mutatePending()
    }
  }

  const handleAccept = async (f: Friend) => {
    const ok = await updateFriendStatus(f.friendId!, 'accepted')
    if (ok) {
      toast.success('Đã chấp nhận lời mời kết bạn!')
      mutatePending()
      mutateFriends()
    }
  }

  const handleReject = async (f: Friend) => {
    const ok = await updateFriendStatus(f.friendId!, 'rejected')
    if (ok) {
      toast.success('Đã từ chối lời mời')
      mutatePending()
    }
  }

  const handleRemoveFriend = async (f: Friend) => {
    const ok = await removeFriend(f.friendId!)
    if (ok) {
      toast.success('Đã xóa bạn bè')
      mutateFriends()
    }
  }

  const handleMarkRead = async (share: SharedRecipe) => {
    if (!share.isRead) {
      await markSharedRead(share.shareId!)
      mutateInbox()
    }
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Users className="size-7" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold">
          Đăng nhập để kết bạn
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kết nối với những đầu bếp khác và chia sẻ công thức nấu ăn.
        </p>
        <Link
          href="/login"
          className={BtnVariants({ className: 'mt-6 rounded-full' })}
        >
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  const TABS = [
    {
      key: 'friends' as const,
      label: 'Bạn bè',
      count: friends?.length,
      icon: Users,
    },
    {
      key: 'requests' as const,
      label: 'Lời mời',
      count: pendingRequests?.length,
      icon: UserPlus,
    },
    {
      key: 'inbox' as const,
      label: 'Công thức nhận',
      count: inbox?.filter((s) => !s.isRead).length,
      icon: Inbox,
    },
    { key: 'search' as const, label: 'Tìm bạn', icon: Search },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Cộng đồng
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">Bạn bè & Chia sẻ</h1>
        <p className="mt-1 text-muted-foreground">
          Kết bạn và chia sẻ công thức nấu ăn với nhau. Click vào Avatar để xem thông tin bạn bè.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs font-bold',
                  tab === t.key
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/20 text-primary',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {!friends ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Users className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Chưa có bạn bè. Hãy tìm và kết bạn ngay!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setTab('search')}
              >
                <Search className="size-4" />
                Tìm bạn
              </Button>
            </div>
          ) : (
            friends.map((f) => {
              const friendId =
                String(f.userId) === String(userId)
                  ? f.friendUserId
                  : f.userId
              const friend = allUsers?.find(
                (u) => String(u.userId) === String(friendId),
              )
              if (!friend) return null
              return (
                <UserCard
                  key={f.friendId}
                  user={friend}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <ShareRecipeDialog
                      toUserId={friend.userId}
                      toUserName={friend.fullName || 'bạn'}
                      currentUserId={userId!}
                    />
                    <button
                      onClick={() => handleRemoveFriend(f)}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                      aria-label="Xóa bạn"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  </div>
                </UserCard>
              )
            })
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {!pendingRequests ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <UserPlus className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Không có lời mời kết bạn nào.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const sender = allUsers?.find(
                (u) => String(u.userId) === String(req.userId),
              )
              return (
                <div
                  key={req.friendId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
                >
                  <Link
                    href={`/profile/${encodeUserId(sender?.userId || req.userId)}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <RankAvatarFrame totalLikes={0}>
                      <Avatar className="size-10 shrink-0 border-2 border-primary/20 group-hover:border-primary">
                        <AvatarImage src={sender?.avatarUrl} alt={sender?.fullName || ''} />
                        <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
                          {(sender?.fullName || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </RankAvatarFrame>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary transition-colors">
                        {sender?.fullName || `User #${req.userId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        muốn kết bạn với bạn
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(req)}
                      className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      aria-label="Chấp nhận"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                      aria-label="Từ chối"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Inbox tab */}
      {tab === 'inbox' && (
        <div className="space-y-3">
          {!inbox ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : inbox.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Inbox className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Chưa có công thức nào được chia sẻ cho bạn.
              </p>
            </div>
          ) : (
            inbox.map((share) => {
              const sender = allUsers?.find(
                (u) => String(u.userId) === String(share.fromUserId),
              )
              return (
                <div
                  key={share.shareId}
                  onClick={() => handleMarkRead(share)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer',
                    share.isRead
                      ? 'border-border/60 bg-card'
                      : 'border-primary/30 bg-primary/5',
                  )}
                >
                  <div className="relative shrink-0">
                    <RankAvatarFrame totalLikes={0}>
                      <Avatar className="size-10">
                        <AvatarImage src={sender?.avatarUrl} alt={sender?.fullName || ''} />
                        <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
                          {(sender?.fullName || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </RankAvatarFrame>
                    {!share.isRead && (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <span className="text-primary font-bold">
                        {sender?.fullName || 'Ai đó'}
                      </span>{' '}
                      đã chia sẻ món{' '}
                      <Link
                        href={`/recipe/${share.recipeId}`}
                        className="font-semibold text-foreground underline decoration-primary/50 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{share.recipeId}
                      </Link>{' '}
                      với bạn
                    </p>
                    {share.message && (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        &ldquo;{share.message}&rdquo;
                      </p>
                    )}
                    {share.createdAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(share.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/recipe/${share.recipeId}`}
                    onClick={(e) => e.stopPropagation()}
                    className={BtnVariants({
                      size: 'sm',
                      variant: 'outline',
                      className: 'shrink-0 rounded-full h-8 gap-1',
                    })}
                  >
                    <ChefHat className="size-3.5" />
                    Xem
                  </Link>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="h-12 rounded-full pl-11 text-base"
            />
          </div>

          {searchTerm.trim().length > 1 && filteredUsers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Không tìm thấy người dùng nào.
            </p>
          )}

          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const alreadyFriend = friendUserIds.has(String(u.userId))
              return (
                <UserCard
                  key={u.userId}
                  user={u}
                >
                  {alreadyFriend ? (
                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground font-medium">
                      Bạn bè
                    </span>
                  ) : pendingMap.has(String(u.userId)) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0 rounded-full h-8 px-3 text-xs gap-1 hover:bg-destructive/15 hover:text-destructive transition-colors"
                      disabled={sending[String(u.userId)]}
                      onClick={() => handleCancelRequest(String(u.userId), pendingMap.get(String(u.userId))!)}
                    >
                      {sending[String(u.userId)] ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="size-3.5" />
                      )}
                      Hủy lời mời
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="shrink-0 rounded-full h-8 px-3 text-xs gap-1"
                      disabled={sending[String(u.userId)]}
                      onClick={() => handleSendRequest(String(u.userId))}
                    >
                      {sending[String(u.userId)] ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="size-3.5" />
                      )}
                      Kết bạn
                    </Button>
                  )}
                </UserCard>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedUserForModal && (
        <FriendProfileDialog
          user={selectedUserForModal}
          open={Boolean(selectedUserForModal)}
          onOpenChange={(op) => !op && setSelectedUserForModal(null)}
          currentUserId={userId!}
        />
      )}
    </div>
  )
}
