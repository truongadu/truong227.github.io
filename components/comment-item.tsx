'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { encodeUserId } from '@/lib/user-hash'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { type AppUser, type Comment } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface CommentReply {
  id: number
  userId?: number
  authorName?: string
  avatarUrl?: string
  content: string
  timeAgo: string
  likesCount?: number
  isLiked?: boolean
}

interface CommentItemProps {
  comment: Comment & {
    likesCount?: number
    isLiked?: boolean
    replies?: CommentReply[]
    timeAgo?: string
  }
  allUsers?: AppUser[]
  currentUserId?: number
  currentUserName?: string
  currentUserAvatar?: string
  onAddReply?: (commentId: number, content: string) => void
}

export function CommentItem({
  comment,
  allUsers = [],
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onAddReply,
}: CommentItemProps) {
  // Find real database user for this commenter
  const cId = comment.commentId ?? 1
  const commenterId = comment.userId || ((cId % (allUsers.length || 1)) + 1)
  const dbUser = allUsers.find((u) => String(u.userId) === String(commenterId)) || allUsers[cId % (allUsers.length || 1)]

  const commentUser = (comment as any).user
  const displayName = comment.fullName || comment.authorName || dbUser?.fullName || commentUser?.fullName || getVietnameseOrForeignName(commenterId)
  const displayAvatar = dbUser?.avatarUrl || commentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commenterId}`
  const userHash = encodeUserId(dbUser?.userId || commenterId)

  // Interactive states
  const [likesCount, setLikesCount] = useState<number>(comment.likesCount ?? Math.floor(cId % 7))
  const [isLiked, setIsLiked] = useState<boolean>(comment.isLiked ?? false)

  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState<CommentReply[]>(comment.replies || [])
  const [showReplies, setShowReplies] = useState<boolean>(comment.replies && comment.replies.length > 0 ? true : false)

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleSendReply = () => {
    if (!replyText.trim()) return
    const newRep: CommentReply = {
      id: Date.now(),
      userId: currentUserId,
      authorName: currentUserName || 'Bạn',
      avatarUrl: currentUserAvatar,
      content: replyText.trim(),
      timeAgo: 'Vừa xong',
      likesCount: 0,
    }
    setReplies((prev) => [...prev, newRep])
    if (onAddReply && cId) {
      onAddReply(cId, replyText.trim())
    }
    setReplyText('')
    setShowReplyInput(false)
    setShowReplies(true)
  }

  return (
    <div className="flex gap-2.5 text-xs">
      {/* Commenter Avatar */}
      <Link href={`/profile/${userHash}`} className="shrink-0 group">
        <Avatar className="size-8 border border-transparent group-hover:border-primary transition-colors">
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-[10px]">
            {displayName[0]}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 space-y-1">
        {/* Comment Box */}
        <div className="inline-block max-w-[90%] rounded-2xl bg-secondary/50 px-3.5 py-2">
          <Link
            href={`/profile/${userHash}`}
            className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {displayName}
          </Link>
          <span className="ml-2 text-[10px] text-muted-foreground">
            {comment.timeAgo || '13 giờ trước'}
          </span>
          <p className="mt-0.5 text-foreground leading-relaxed whitespace-pre-line text-xs">
            {comment.content}
          </p>
        </div>

        {/* Action controls below comment box: Thích & Trả lời (No Chia sẻ) */}
        <div className="flex items-center gap-4 pl-2 text-[11px] font-semibold text-muted-foreground">
          <button
            onClick={handleToggleLike}
            className={cn(
              'flex items-center gap-1 hover:underline cursor-pointer transition-colors',
              isLiked && 'text-rose-500 font-bold',
            )}
          >
            <Heart className={cn('size-3', isLiked && 'fill-current text-rose-500')} />
            <span>{isLiked ? 'Đã tim' : 'Thả tim'}</span>
          </button>

          <button
            onClick={() => setShowReplyInput((prev) => !prev)}
            className="flex items-center gap-1 hover:underline hover:text-foreground cursor-pointer transition-colors"
          >
            <MessageSquare className="size-3" />
            <span>Trả lời</span>
          </button>

          {likesCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">
              <Heart className="size-2.5 fill-current" />
              {likesCount}
            </span>
          )}
        </div>

        {/* Reply Input Box */}
        {showReplyInput && (
          <div className="flex gap-2 pt-1.5 pl-2 animate-in fade-in duration-150">
            <Input
              placeholder={`Trả lời ${displayName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="h-8 text-xs rounded-xl bg-background"
            />
            <Button size="sm" onClick={handleSendReply} className="h-8 rounded-xl px-3 text-xs">
              <Send className="size-3" />
            </Button>
          </div>
        )}

        {/* View Replies Toggle & List */}
        {replies.length > 0 && (
          <div className="pl-2 pt-1 space-y-2">
            <button
              onClick={() => setShowReplies((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <span>{showReplies ? 'Ẩn phản hồi' : `Xem ${replies.length} phản hồi`}</span>
            </button>

            {showReplies && (
              <div className="space-y-2 border-l-2 border-border/40 pl-3 pt-1">
                {replies.map((rep) => {
                  const repUserId = rep.userId || ((rep.id % (allUsers.length || 1)) + 1)
                  const repDbUser = allUsers.find((u) => String(u.userId) === String(repUserId)) || allUsers[rep.id % (allUsers.length || 1)]
                  const repName = rep.authorName || repDbUser?.fullName || getVietnameseOrForeignName(repUserId)
                  const repAvatar = rep.avatarUrl || repDbUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${repUserId}`
                  const repUserHash = encodeUserId(repDbUser?.userId || repUserId)

                  return (
                    <div key={rep.id} className="flex gap-2 text-xs">
                      <Link href={`/profile/${repUserHash}`} className="shrink-0 group">
                        <Avatar className="size-6 border border-transparent group-hover:border-primary transition-colors">
                          <AvatarImage src={repAvatar} alt={repName} />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold text-[9px]">
                            {repName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="inline-block max-w-[95%] rounded-xl bg-secondary/40 px-3 py-1.5">
                          <Link
                            href={`/profile/${repUserHash}`}
                            className="font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {repName}
                          </Link>
                          <span className="ml-2 text-[9px] text-muted-foreground">{rep.timeAgo}</span>
                          <p className="text-foreground leading-relaxed text-xs">{rep.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
