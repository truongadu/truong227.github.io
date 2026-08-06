'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Bell,
  Check,
  ChefHat,
  Heart,
  MessageSquare,
  Sparkles,
  UserPlus,
  Users,
  X,
  Trash2,
  CheckCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getPendingRequests,
  getSharedInbox,
  getUsers,
  getRecipes,
  updateFriendStatus,
  markSharedRead,
  type AppUser,
  type Friend,
  type SharedRecipe,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { encodePostId } from '@/lib/user-hash'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  type: 'like' | 'comment' | 'friend_request'
  postId?: number
  postContentSnippet?: string
  actorUserId?: number | string
  actorName: string
  actorAvatar?: string
  commentText?: string
  timeAgo: string
  createdAt?: string
  isRead?: boolean
  recipientUserId?: number | string
}

export default function NotificationsPage() {
  const { isAuthenticated, userId, fullName, avatarUrl, ready } = useAuth()
  const [filter, setFilter] = useState<'all' | 'likes' | 'requests'>('all')

  const { data: pendingRequests, mutate: mutatePending } = useSWR(
    ready && isAuthenticated && userId ? ['friend-requests', userId] : null,
    () => getPendingRequests(userId!),
  )

  const { data: inbox, mutate: mutateInbox } = useSWR(
    ready && isAuthenticated && userId ? ['shared-inbox', userId] : null,
    () => getSharedInbox(userId!),
  )

  const { data: allUsers } = useSWR('all-users', getUsers)
  const { data: allRecipes } = useSWR('all-recipes', getRecipes)

  // Notifications stored in localStorage
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

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
        const parsed: NotificationItem[] = JSON.parse(raw)
        // Filter notifications where recipient matches active user OR global admin OR post author 1
        const myNotifs = parsed.filter((n) => {
          const r = String(n.recipientUserId || '1')
          return r === activeId
        })
        const updatedNotifs = myNotifs.map((n) => {
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

          if (n.type === 'like' && n.postId) {
            const totalLikes = getPostLikesCount(n.postId)
            const otherCount = Math.max(0, totalLikes - 1)
            return {
              ...n,
              actorName: resolvedActorName,
              actorAvatar: resolvedActorAvatar,
              text: otherCount > 0 ? `và ${otherCount} người khác đã thích bài viết của bạn` : `đã thích bài viết của bạn`,
            }
          }
          return { ...n, actorName: resolvedActorName, actorAvatar: resolvedActorAvatar }
        })
        setNotifications(updatedNotifs)
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

  const handleMarkRead = (id: string) => {
    try {
      const raw = localStorage.getItem('facecook_feed_notifications')
      const all: NotificationItem[] = raw ? JSON.parse(raw) : []
      const updated = all.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      localStorage.setItem('facecook_feed_notifications', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('facecook_notification_added'))
      window.dispatchEvent(new Event('storage'))
      loadNotifications()
    } catch {}
  }

  const handleMarkAllRead = () => {
    try {
      const raw = localStorage.getItem('facecook_feed_notifications')
      const all: NotificationItem[] = raw ? JSON.parse(raw) : []
      const updated = all.map((n) => ({ ...n, isRead: true }))
      localStorage.setItem('facecook_feed_notifications', JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('facecook_notification_added'))
      window.dispatchEvent(new Event('storage'))
      loadNotifications()
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!')
    } catch {}
  }

  const handleClearAll = () => {
    try {
      localStorage.setItem('facecook_feed_notifications', JSON.stringify([]))
      window.dispatchEvent(new CustomEvent('facecook_notification_added'))
      window.dispatchEvent(new Event('storage'))
      setNotifications([])
      toast.success('Đã xóa tất cả thông báo!')
    } catch {}
  }

  const handleAcceptRequest = async (f: Friend) => {
    const ok = await updateFriendStatus(f.friendId!, 'accepted')
    if (ok) {
      toast.success('Đã chấp nhận lời mời kết bạn!')
      mutatePending()
    }
  }

  const handleRejectRequest = async (f: Friend) => {
    const ok = await updateFriendStatus(f.friendId!, 'rejected')
    if (ok) {
      toast.success('Đã từ chối lời mời')
      mutatePending()
    }
  }

  if (ready && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bell className="size-7" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold">Thông báo</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Đăng nhập để xem lời mời kết bạn và lượt thả tim bài viết của bạn.
        </p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground">
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'likes') return n.type === 'like'
    if (filter === 'requests') return n.type === 'friend_request'
    return true
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Bell className="size-3.5" />
            Trung tâm thông báo
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold">Thông báo của bạn</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Cập nhật lời mời kết bạn và các lượt thả tim từ tài khoản thật & tài khoản ảo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 rounded-full text-xs font-medium"
            >
              <CheckCheck className="size-3.5 mr-1.5 text-primary" />
              Đọc tất cả ({unreadCount})
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 rounded-full text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Xóa tất cả
            </Button>
          )}
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            filter === 'all'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('likes')}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'likes'
              ? 'bg-rose-500 text-white font-semibold'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <Heart className="size-3 fill-current" />
          Lượt thả tim ({notifications.filter((n) => n.type === 'like').length})
        </button>
        <button
          onClick={() => setFilter('requests')}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
            filter === 'requests'
              ? 'bg-blue-500 text-white font-semibold'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <UserPlus className="size-3" />
          Lời mời kết bạn ({notifications.filter((n) => n.type === 'friend_request').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center space-y-2">
            <Sparkles className="mx-auto size-10 text-muted-foreground/50" />
            <h3 className="font-medium text-foreground text-sm">Chưa có thông báo nào</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Khi ai đó thả tim bài viết hoặc gửi lời mời kết bạn, thông báo sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isLike = n.type === 'like'
            const targetUrl = n.postId ? `/feed/status/${encodePostId(n.postId)}` : '/friends'

            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={cn(
                  'flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors cursor-pointer',
                  n.isRead
                    ? 'border-border/60 bg-card'
                    : 'border-primary/40 bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="size-11 border border-border/40">
                      <AvatarImage src={n.actorAvatar} alt={n.actorName} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {n.actorName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-white text-[10px]',
                        isLike ? 'bg-rose-500' : 'bg-blue-500',
                      )}
                    >
                      {isLike ? <Heart className="size-3 fill-current" /> : <UserPlus className="size-3" />}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-foreground hover:text-primary transition-colors">
                        {n.actorName}
                      </span>
                      <span className="text-muted-foreground">
                        {n.text || (isLike ? 'đã thả tim bài viết của bạn' : 'đã gửi lời mời kết bạn cho bạn')}
                      </span>
                    </div>

                    {isLike && n.postContentSnippet && (
                      <p className="mt-1 text-xs text-foreground line-clamp-1 italic bg-secondary/50 px-2.5 py-1 rounded-lg">
                        &ldquo;{n.postContentSnippet}&rdquo;
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span>{n.timeAgo}</span>
                      {isLike && (
                        <Link href={targetUrl} className="font-semibold text-primary hover:underline">
                          Xem bài viết ➔
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <span className="size-2.5 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pending Friend Requests from Database API if any */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Lời mời kết bạn từ hệ thống ({pendingRequests.length})
          </h2>
          {pendingRequests.map((req: Friend) => {
            const sender = allUsers?.find((u: AppUser) => String(u.userId) === String(req.userId))
            return (
              <div
                key={req.friendId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-11 shrink-0">
                    <AvatarImage src={sender?.avatarUrl} alt={sender?.fullName || ''} />
                    <AvatarFallback className="bg-primary/15 font-bold text-primary">
                      {sender?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {sender?.fullName || `Thành viên #${req.userId}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Đã gửi lời mời kết bạn</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleAcceptRequest(req)} className="h-8 rounded-full px-3 text-xs">
                    <Check className="size-3.5 mr-1" />
                    Chấp nhận
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req)} className="h-8 rounded-full px-3 text-xs">
                    <X className="size-3.5 mr-1" />
                    Từ chối
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
