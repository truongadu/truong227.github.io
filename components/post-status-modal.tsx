import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Heart,
  MessageSquare,
  Sparkles,
  Utensils,
  X,
  Send,
  MoreHorizontal,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarCircles } from '@/components/ui/avatar-circles'
import { PostLikesModal } from '@/components/post-likes-modal'
import { CommentItem } from '@/components/comment-item'
import { RankBadge } from '@/components/rank-badge'
import { encodeUserId, encodePostId } from '@/lib/user-hash'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { getUserTotalLikes } from '@/lib/feed-posts'
import { type AppUser, type Comment, getComments, postComment, recipeFallbackImage } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface PostStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: {
    id: number
    authorId?: number | string
    authorName: string
    authorAvatar?: string
    timeAgo: string
    content: string
    imageUrl?: string
    attachedRecipeId?: number
    recipeName?: string
    cookingTime?: number
    attachedAiPlanId?: string
    attachedAiPlanTitle?: string
    attachedAiMealsSummary?: string
    initialLikes: number
  } | null
  allUsers?: AppUser[]
  currentUserId?: number
  currentUserName?: string
  currentUserAvatar?: string
}

export function PostStatusModal({
  open,
  onOpenChange,
  post,
  allUsers = [],
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: PostStatusModalProps) {
  const router = useRouter()
  const isNavigatingRef = useRef(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post?.initialLikes ?? 12)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isNavigatingRef.current = true
    // Navigate immediately — do NOT close dialog first to avoid useEffect race condition
    // The full-page navigation will unmount everything
    window.location.href = path
  }

  // Synchronize status URL when dialog opens/closes
  useEffect(() => {
    if (open && post) {
      // Only reset navigating flag if we're NOT currently navigating away
      if (!isNavigatingRef.current) {
        const encodedPostId = encodePostId(post.id)
        const targetPath = `/feed/status/${encodedPostId}`
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ statusId: post.id }, '', targetPath)
        }
      }
      setLikesCount(post.initialLikes)

      // Fetch comments (from localStorage + real API, excluding fakers)
      const targetRecipeId = post.attachedRecipeId || post.id
      setLoadingComments(true)

      let localComments: Comment[] = []
      try {
        const rawLocal = localStorage.getItem('facecook_comments_map')
        if (rawLocal) {
          const map = JSON.parse(rawLocal)
          localComments = map[targetRecipeId] || []
        }
      } catch {}

      getComments(targetRecipeId)
        .then((res) => {
          setLoadingComments(false)
          const realApiComments = (res?.data || []).filter((c: any) => {
            const author = c.fullName || c.authorName || ''
            return !author.toLowerCase().includes('faker') && !/^user\s*#?\d+$/i.test(author)
          })
          const existingKeys = new Set<string>()
          const merged: Comment[] = []
          for (const c of [...localComments, ...realApiComments]) {
            const key = `${c.commentId}_${c.content}`
            if (!existingKeys.has(key)) {
              existingKeys.add(key)
              merged.push(c)
            }
          }
          setComments(merged)
        })
        .catch(() => {
          setLoadingComments(false)
          setComments(localComments)
        })
    } else if (!open && !isNavigatingRef.current && typeof window !== 'undefined' && window.location.pathname.startsWith('/feed/status/')) {
      window.history.pushState(null, '', '/feed')
    }
  }, [open, post, allUsers])

  // Load initial like state & setup real-time sync with Feed
  useEffect(() => {
    if (open && post) {
      try {
        const savedLikes = localStorage.getItem('facecook_feed_liked_map')
        if (savedLikes) {
          const likedMap = JSON.parse(savedLikes)
          setIsLiked(Boolean(likedMap[post.id]))
        }
        const savedCounts = localStorage.getItem('facecook_feed_like_count_map')
        if (savedCounts) {
          const countMap = JSON.parse(savedCounts)
          if (countMap[post.id] !== undefined) {
            setLikesCount(countMap[post.id])
          } else {
            setLikesCount(post.initialLikes)
          }
        } else {
          setLikesCount(post.initialLikes)
        }
      } catch {
        setLikesCount(post.initialLikes)
      }
    }
  }, [open, post])

  useEffect(() => {
    const handleSync = () => {
      if (post) {
        try {
          const savedLikes = localStorage.getItem('facecook_feed_liked_map')
          if (savedLikes) {
            const likedMap = JSON.parse(savedLikes)
            setIsLiked(Boolean(likedMap[post.id]))
          }
          const savedCounts = localStorage.getItem('facecook_feed_like_count_map')
          if (savedCounts) {
            const countMap = JSON.parse(savedCounts)
            if (countMap[post.id] !== undefined) {
              setLikesCount(countMap[post.id])
            }
          }
        } catch {}
      }
    }

    window.addEventListener('facecook_like_updated', handleSync)
    return () => window.removeEventListener('facecook_like_updated', handleSync)
  }, [post])

  if (!post) return null

  // Derive author details accurately without falling back to index 0 on refresh
  const authorUserId = post.authorId || ((post.id % 1523) + 1)
  const authorDbUser = allUsers.find((u) => String(u.userId) === String(authorUserId))
  const isAuthorCurrent = Boolean(currentUserId && String(authorUserId) === String(currentUserId))

  const displayAuthor = isAuthorCurrent
    ? (currentUserName || authorDbUser?.fullName || post.authorName || getVietnameseOrForeignName(authorUserId))
    : (authorDbUser?.fullName || (post.authorName && !post.authorName.includes('MasterChef') ? post.authorName : getVietnameseOrForeignName(authorUserId)))

  const displayAvatar = isAuthorCurrent
    ? (currentUserAvatar || authorDbUser?.avatarUrl || post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUserId}`)
    : (authorDbUser?.avatarUrl || (post.authorAvatar && !post.authorAvatar.includes('MasterChef') ? post.authorAvatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUserId}`))
  const authorHash = encodeUserId(post.authorId || authorDbUser?.userId || authorUserId)

  // Likers avatars
  const likerUsers = (allUsers || []).slice(0, likesCount)
  const likerAvatars = likerUsers.slice(0, 4).map((u) => ({
    imageUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.userId}`,
    profileUrl: `/profile/${encodeUserId(u.userId)}`,
    name: getVietnameseOrForeignName(u.userId, u.fullName),
  }))
  const extraLikersCount = Math.max(0, likesCount - likerAvatars.length)

  const handleToggleLike = () => {
    if (!post) return
    const nextLiked = !isLiked
    const nextCount = isLiked ? Math.max(0, likesCount - 1) : likesCount + 1

    setIsLiked(nextLiked)
    setLikesCount(nextCount)

    try {
      const savedLikes = localStorage.getItem('facecook_feed_liked_map')
      const likedMap = savedLikes ? JSON.parse(savedLikes) : {}
      likedMap[post.id] = nextLiked
      localStorage.setItem('facecook_feed_liked_map', JSON.stringify(likedMap))

      const savedCounts = localStorage.getItem('facecook_feed_like_count_map')
      const countMap = savedCounts ? JSON.parse(savedCounts) : {}
      countMap[post.id] = nextCount
      localStorage.setItem('facecook_feed_like_count_map', JSON.stringify(countMap))

      window.dispatchEvent(new Event('facecook_like_updated'))
    } catch {}
  }

  const handleSendComment = async () => {
    if (!commentInput.trim()) return
    const text = commentInput.trim()
    const targetRecipeId = post.attachedRecipeId || post.id
    const newComment: Comment & { user?: any } = {
      commentId: Date.now(),
      userId: currentUserId || 1,
      recipeId: targetRecipeId,
      content: text,
      createdAt: new Date().toISOString(),
      fullName: currentUserName || 'Bạn',
      avatarUrl: currentUserAvatar,
      user: {
        userId: currentUserId || 1,
        fullName: currentUserName || 'Bạn',
        avatarUrl: currentUserAvatar,
      },
    }
    setComments((prev) => [newComment, ...prev])
    setCommentInput('')

    try {
      const rawLocal = localStorage.getItem('facecook_comments_map')
      const map = rawLocal ? JSON.parse(rawLocal) : {}
      map[targetRecipeId] = [newComment, ...(map[targetRecipeId] || [])]
      localStorage.setItem('facecook_comments_map', JSON.stringify(map))
    } catch {}

    if (currentUserId) {
      await postComment({
        recipeId: targetRecipeId,
        userId: currentUserId,
        fullName: currentUserName || 'Bạn',
        content: text,
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border-border/80 shadow-2xl">
          <DialogHeader className="p-4 pb-3 border-b border-border/40 bg-card flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-serif font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Chi tiết bài viết Facecook
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[75vh] overflow-y-auto p-4 space-y-4 bg-background">
            {/* Author Header */}
            <div className="flex items-center justify-between">
              <a href={`/profile/${authorHash}`} onClick={(e) => handleNavigate(`/profile/${authorHash}`, e)} className="flex items-center gap-3 group">
                <Avatar className="size-11 border border-transparent group-hover:border-primary transition-colors">
                  <AvatarImage src={displayAvatar} alt={displayAuthor} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {displayAuthor[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors">
                      {displayAuthor}
                    </span>
                    <RankBadge totalLikes={getUserTotalLikes(authorUserId)} size="sm" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{post.timeAgo} • Công khai</p>
                </div>
              </a>
            </div>

            {/* Post Content */}
            {post.content && (
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-normal">
                {post.content}
              </p>
            )}

            {/* Attached Recipe */}
            {Boolean(post.attachedRecipeId || post.id === 9001 || post.id === 9002 || post.isRecipeArticle) && (
              <a
                href={`/recipe/${post.attachedRecipeId || (post.id === 9001 ? 9001 : (post.id === 9002 ? 9002 : post.id))}`}
                onClick={(e) =>
                  handleNavigate(
                    `/recipe/${post.attachedRecipeId || (post.id === 9001 ? 9001 : (post.id === 9002 ? 9002 : post.id))}`,
                    e,
                  )
                }
                className="group flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 transition-all hover:border-primary hover:bg-primary/10 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Utensils className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {post.recipeName || (post.id === 9001 ? 'Phở Bò Truyền Thống Hà Nội' : (post.id === 9002 ? 'Bún Chả Hà Nội Nướng Than Hoa' : 'Xem công thức chi tiết'))}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {post.cookingTime ? `Thời gian nấu: ${post.cookingTime} phút` : 'Click để xem nguyên liệu & các bước thực hiện'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>Xem công thức</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            )}

            {/* Attached AI Plan */}
            {post.attachedAiPlanTitle && (
              <a
                href={post.attachedAiPlanId && !post.attachedAiPlanId.startsWith('preset-') ? `/meal-planner/${post.attachedAiPlanId}` : '/meal-planner'}
                onClick={(e) =>
                  handleNavigate(
                    post.attachedAiPlanId && !post.attachedAiPlanId.startsWith('preset-') ? `/meal-planner/${post.attachedAiPlanId}` : '/meal-planner',
                    e,
                  )
                }
                className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 transition-all hover:border-emerald-500 hover:bg-emerald-500/15 cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors">
                    <Sparkles className="size-4 text-emerald-500 shrink-0" />
                    Thực đơn AI đính kèm: {post.attachedAiPlanTitle}
                  </span>
                  {post.attachedAiMealsSummary && (
                    <p className="text-xs text-muted-foreground leading-relaxed pl-5 border-l-2 border-emerald-500/40">
                      {post.attachedAiMealsSummary}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Xem thực đơn</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            )}

            {/* Post Image */}
            {post.imageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted border border-border/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt="Post content" className="size-full object-cover" />
              </div>
            )}

            {/* Like & Comments Stats Bar */}
            <div className="flex items-center justify-between border-y border-border/40 py-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleLike}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors',
                    isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Heart className={cn('size-4', isLiked && 'fill-current text-rose-500')} />
                  <span>{isLiked ? 'Đã thả tim' : 'Thả tim'} ({likesCount})</span>
                </button>
              </div>

              {/* AvatarCircles for Likers */}
              <AvatarCircles
                avatarUrls={likerAvatars}
                numPeople={extraLikersCount}
                onClick={() => setShowLikesModal(true)}
              />
            </div>

            {/* New Comment Input Box */}
            <div className="flex gap-2">
              <Input
                placeholder="Viết bình luận của bạn..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                className="h-9 text-xs rounded-xl"
              />
              <Button size="sm" onClick={handleSendComment} className="h-9 rounded-xl px-4 text-xs font-semibold">
                <Send className="size-3.5 mr-1" />
                Gửi
              </Button>
            </div>

            {/* Comments List using CommentItem */}
            <div className="space-y-3 pt-1">
              {comments.map((c) => (
                <CommentItem
                  key={c.commentId}
                  comment={c}
                  allUsers={allUsers}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Likes Modal */}
      <PostLikesModal
        open={showLikesModal}
        onOpenChange={setShowLikesModal}
        likesCount={likesCount}
      />
    </>
  )
}
