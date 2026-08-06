'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Heart, UserPlus, UserMinus, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getUsers,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  removeFriend,
  updateFriendStatus,
  type AppUser,
} from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { RankBadge, RankAvatarFrame } from '@/components/rank-badge'
import { encodeUserId } from '@/lib/user-hash'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { getUserTotalLikes } from '@/lib/feed-posts'

interface PostLikesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  likesCount: number
  postId?: number | string
}

export function PostLikesModal({
  open,
  onOpenChange,
  likesCount,
}: PostLikesModalProps) {
  const { userId, isAuthenticated } = useAuth()
  const { data: allUsers } = useSWR('all-users', getUsers)
  const { data: friends, mutate: mutateFriends } = useSWR(
    isAuthenticated && userId ? ['friends', userId] : null,
    () => getFriends(userId!),
  )
  const { data: pendingRequests, mutate: mutatePending } = useSWR(
    isAuthenticated && userId ? ['friend-requests', userId] : null,
    () => getPendingRequests(userId!),
  )

  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({})
  const [optimisticPending, setOptimisticPending] = useState<Record<string, boolean>>({})

  // Compute lists of IDs
  const friendIds = new Set(
    (friends || []).flatMap((f) => [
      String(f.userId),
      String(f.friendUserId),
    ]),
  )

  const pendingMap = new Map(
    (pendingRequests || []).map((r) => [
      String(r.friendUserId) === String(userId) ? String(r.userId) : String(r.friendUserId),
      r,
    ]),
  )

  // Get liker users with synchronized totalLikes
  const likersList: (AppUser & { totalLikes?: number })[] = (allUsers || [])
    .slice(0, Math.max(likesCount, 5))
    .map((u) => ({
      ...u,
      totalLikes: getUserTotalLikes(u.userId),
    }))

  const handleToggleFriend = async (targetUser: AppUser) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để kết bạn')
      return
    }

    const targetIdStr = String(targetUser.userId)
    const isCurrentlyPending = optimisticPending[targetIdStr] ?? pendingMap.has(targetIdStr)

    setLoadingUsers((prev) => ({ ...prev, [targetIdStr]: true }))
    setOptimisticPending((prev) => ({ ...prev, [targetIdStr]: !isCurrentlyPending }))

    try {
      if (isCurrentlyPending) {
        // Pending request -> Cancel it
        const req = pendingMap.get(targetIdStr)
        if (req?.friendId) {
          await updateFriendStatus(req.friendId, 'rejected')
        }
        toast.success(`Đã hủy lời mời kết bạn với ${getVietnameseOrForeignName(targetUser.userId, targetUser.fullName)}`)
        mutatePending()
      } else {
        // Send request
        const res = await sendFriendRequest({
          userId,
          friendUserId: targetUser.userId,
        })
        if (res.ok) {
          toast.success(`Đã gửi lời mời kết bạn tới ${getVietnameseOrForeignName(targetUser.userId, targetUser.fullName)}!`)
          mutatePending()
        } else {
          toast.error(res.message || 'Không thể gửi lời mời')
          setOptimisticPending((prev) => ({ ...prev, [targetIdStr]: false }))
        }
      }
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
      setOptimisticPending((prev) => ({ ...prev, [targetIdStr]: isCurrentlyPending }))
    } finally {
      setLoadingUsers((prev) => ({ ...prev, [targetIdStr]: false }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-lg font-bold">
            <span className="flex size-7 items-center justify-center rounded-full bg-rose-500/15 text-rose-500">
              <Heart className="size-4 fill-rose-500" />
            </span>
            Tất cả lượt tim ({likersList.length})
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-2 pt-2 pr-1">
          {likersList.map((user) => {
            const displayName = getVietnameseOrForeignName(user.userId, user.fullName)
            const isSelf = String(user.userId) === String(userId)
            const isFriend = friendIds.has(String(user.userId))
            const isPending = optimisticPending[String(user.userId)] !== undefined
              ? optimisticPending[String(user.userId)]
              : pendingMap.has(String(user.userId))
            const isLoading = loadingUsers[String(user.userId)]
            const encodedHash = encodeUserId(user.userId)

            return (
              <div
                key={user.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-2.5 transition-colors hover:border-primary/30"
              >
                <Link
                  href={`/profile/${encodedHash}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  <RankAvatarFrame totalLikes={user.totalLikes ?? 0}>
                    <Avatar className="size-10 shrink-0 border border-primary/20 group-hover:border-primary transition-colors">
                      <AvatarImage src={user.avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </RankAvatarFrame>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm group-hover:text-primary transition-colors">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RankBadge totalLikes={user.totalLikes ?? 0} size="sm" showLabel={true} />
                    </div>
                  </div>
                </Link>

                {/* Friend Action Button */}
                {!isSelf && (
                  <div className="shrink-0">
                    {isFriend ? (
                      <span className="text-xs font-medium text-muted-foreground px-3 py-1 rounded-full bg-secondary">
                        Bạn bè
                      </span>
                    ) : isPending ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isLoading}
                        onClick={() => handleToggleFriend(user)}
                        className="rounded-full h-8 px-3 text-xs gap-1"
                      >
                        {isLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="size-3.5 text-muted-foreground" />
                        )}
                        Hủy lời mời
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleToggleFriend(user)}
                        className="rounded-full h-8 px-3 text-xs gap-1"
                      >
                        {isLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="size-3.5" />
                        )}
                        Thêm bạn bè
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
