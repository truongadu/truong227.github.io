'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import {
  ChefHat,
  Clock,
  Compass,
  Edit,
  EyeOff,
  Flag,
  Flame,
  Heart,
  ImageIcon,
  Link as LinkIcon,
  MessageSquare,
  MoreHorizontal,
  PlusCircle,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserX,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getAllRecipes,
  getComments,
  postComment,
  getUserRank,
  getUsers,
  recipeFallbackImage,
  type Comment,
} from '@/lib/api'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { encodeUserId, encodePostId, decodePostId } from '@/lib/user-hash'
import { AvatarCircles } from '@/components/ui/avatar-circles'
import { PostLikesModal } from '@/components/post-likes-modal'
import { PostStatusModal } from '@/components/post-status-modal'
import { CommentItem } from '@/components/comment-item'
import { getSynchronizedFeedPosts, getPostsForUser, getUserTotalLikes, type SocialPost } from '@/lib/feed-posts'
import { getSavedMealPlans, registerSharedMealPlan, type SavedMealPlan } from '@/lib/ai-planner'
import { useAuth } from '@/components/auth-provider'
import { RankBadge, RankAvatarFrame } from '@/components/rank-badge'
import { Dock, DockIcon } from '@/components/ui/dock'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DEFAULT_PRESET_AI_PLANS = [
  {
    id: 'preset-1',
    title: 'Thực đơn 7 ngày Giảm Cân Eat Clean (1.500 kcal/ngày)',
    summary: 'Sáng: Smoothies chuối bơ; Trưa: Salad ức gà áp chảo sốt chanh dây; Tối: Cá hồi nướng măng tây',
  },
  {
    id: 'preset-2',
    title: 'Thực đơn 7 ngày Tăng Cơ Đủ Chất (2.200 kcal/ngày)',
    summary: 'Sáng: Phở bò tái lăn; Trưa: Bò né sốt tiêu đen + Cơm lứt; Tối: Bún chả Hà Nội thanh nhẹ',
  },
  {
    id: 'preset-3',
    title: 'Thực đơn 7 ngày Bữa Ăn Gia Đình Việt (1.800 kcal/ngày)',
    summary: 'Sáng: Bánh mì ốp la pate; Trưa: Canh chua cá lóc + Thịt kho tộ; Tối: Gà chiên nước mắm + Rau luộc',
  },
]



export function FeedView() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, userId, fullName, avatarUrl, ready } = useAuth()
  const [filterTab, setFilterTab] = useState<'all' | 'latest' | 'ai'>('all')

  // Fetch recipes for feed
  const { data: recipes } = useSWR('feed-recipes', getAllRecipes)
  const { data: allUsers } = useSWR('all-users', getUsers)
  // Fetch user rank info
  const { data: rankInfo } = useSWR(
    ready && isAuthenticated && userId ? ['user-rank', userId] : null,
    () => getUserRank(userId!),
  )

  const [likesModalPostId, setLikesModalPostId] = useState<number | null>(null)
  const [activeLikesCount, setActiveLikesCount] = useState<number>(0)
  const [activeStatusPost, setActiveStatusPost] = useState<SocialPost | null>(null)

  // Interactive Post Creator States
  const [postText, setPostText] = useState('')
  const [postImageUrl, setPostImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [attachRecipe, setAttachRecipe] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('')
  const [attachAiPlan, setAttachAiPlan] = useState(false)
  const [selectedAiPlanId, setSelectedAiPlanId] = useState<string>('')
  const [savedMealPlans, setSavedMealPlans] = useState<SavedMealPlan[]>([])
  const [hoveredPublisherAction, setHoveredPublisherAction] = useState<string | null>(null)

  // Load saved meal plans on mount
  useEffect(() => {
    setSavedMealPlans(getSavedMealPlans())
  }, [])

  // Editing post state
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')

  // Published custom social posts (Persisted in localStorage)
  const [userPosts, setUserPosts] = useState<SocialPost[]>([])
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([])
  const [blockedAuthors, setBlockedAuthors] = useState<string[]>([])

  // State for independent post likes in UI (Separate from recipe favorites)
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({})
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({})

  // Load persisted user posts from localStorage on mount
  useEffect(() => {
    try {
      const activeId = userId ? (isNaN(Number(userId)) ? userId : Number(userId)) : 1
      const currentAuthName = fullName || localStorage.getItem('fullName') || 'Vivian'
      const currentAuthAvatar = avatarUrl || localStorage.getItem('avatarUrl') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'

      const defaultSamplePosts: SocialPost[] = [
        {
          id: 9001,
          authorId: 1,
          authorName: currentAuthName,
          authorAvatar: currentAuthAvatar,
          timeAgo: '15 phút trước',
          content: 'Hôm nay mạn phép chia sẻ bí quyết làm nước dùng phở bò trong vắt, thơm mùi quế hồi cho mọi người cùng tham khảo nhé! 🍲 Chiêu này mình học từ cụ thân sinh truyền lại.',
          imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop',
          initialLikes: 520,
          isUserCreated: false,
        },
        {
          id: 9002,
          authorId: 1,
          authorName: currentAuthName,
          authorAvatar: currentAuthAvatar,
          timeAgo: '2 giờ trước',
          content: 'Gợi ý thực đơn 7 ngày Giảm Cân Eat Clean (1.500 kcal/ngày) đủ chất dinh dưỡng cho các bạn tập gym và nhân viên văn phòng! 💪',
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop',
          attachedAiPlanId: '1',
          attachedAiPlanTitle: 'Thực đơn 7 ngày Giảm Cân Eat Clean (1.500 kcal/ngày)',
          attachedAiMealsSummary: 'Sáng: Smoothies chuối bơ; Trưa: Salad ức gà áp chảo sốt chanh dây; Tối: Cá hồi nướng măng tây',
          initialLikes: 345,
          isUserCreated: false,
        },
      ]

      const savedPosts = localStorage.getItem('facecook_feed_user_posts')
      if (savedPosts) {
        const parsed: SocialPost[] = JSON.parse(savedPosts)
        const sanitizedParsed = parsed.map((p) => {
          if (p.id === 9001 || p.id === 9002 || (activeId && String(p.authorId) === String(activeId))) {
            return {
              ...p,
              authorName: currentAuthName,
              authorAvatar: currentAuthAvatar,
            }
          }
          return p
        })

        const hasSample = sanitizedParsed.some((p) => p.id === 9001 || p.id === 9002)
        const rawMerged = !hasSample || sanitizedParsed.length === 0 ? [...defaultSamplePosts, ...sanitizedParsed] : sanitizedParsed
        
        const deduplicatedMap = new Map<number, SocialPost>()
        rawMerged.forEach((p) => deduplicatedMap.set(p.id, p))
        const cleanPosts = Array.from(deduplicatedMap.values())

        setUserPosts(cleanPosts)
        localStorage.setItem('facecook_feed_user_posts', JSON.stringify(cleanPosts))
      } else {
        setUserPosts(defaultSamplePosts)
        localStorage.setItem('facecook_feed_user_posts', JSON.stringify(defaultSamplePosts))
      }

      const savedHidden = localStorage.getItem('facecook_feed_hidden_posts')
      if (savedHidden) {
        setHiddenPostIds(JSON.parse(savedHidden))
      }
      const savedBlocked = localStorage.getItem('facecook_feed_blocked_authors')
      if (savedBlocked) {
        setBlockedAuthors(JSON.parse(savedBlocked))
      }
      const savedLikes = localStorage.getItem('facecook_feed_liked_map')
      if (savedLikes) {
        setLikedMap(JSON.parse(savedLikes))
      }
      const savedLikeCounts = localStorage.getItem('facecook_feed_like_count_map')
      if (savedLikeCounts) {
        setLikeCountMap(JSON.parse(savedLikeCounts))
      }

      // Sync comments map from local storage with initial seeds
      const initialDefaultComments: Record<number, Comment[]> = {
        9001: [
          {
            commentId: 80001,
            recipeId: 9001,
            userId: 2,
            authorName: 'Nguyễn Thanh Tùng',
            fullName: 'Nguyễn Thanh Tùng',
            content: 'Nước dùng phở bò trong vắt, quế hồi thơm nức mũi! Cảm ơn Vivian đã chia sẻ bí quyết học từ cụ thân sinh nhé! 🍲',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            timeAgo: '1 giờ trước',
            replies: [
              {
                id: 800011,
                userId: 9001,
                authorName: 'Vivian',
                content: 'Cảm ơn anh Tùng nha, anh thử nấu theo công thức này xem sao ạ! 😊',
                timeAgo: '45 phút trước',
                likesCount: 3,
              },
            ],
          },
          {
            commentId: 80002,
            recipeId: 9001,
            userId: 5,
            authorName: 'Lê Minh Anh',
            fullName: 'Lê Minh Anh',
            content: 'Mình vừa thử làm theo trưa nay, cả nhà khen nức nở luôn. Bí quyết luộc xương kỹ quả là đáng giá!',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            timeAgo: '2 giờ trước',
          },
        ],
        9002: [
          {
            commentId: 80004,
            recipeId: 9002,
            userId: 12,
            authorName: 'Đặng Thảo Nguyên',
            fullName: 'Đặng Thảo Nguyên',
            content: 'Thực đơn Eat Clean 1500kcal này chuẩn chỉnh quá! Đang cần thực đơn chuẩn để theo đợt giảm cân này.',
            createdAt: new Date(Date.now() - 5400000).toISOString(),
            timeAgo: '1.5 giờ trước',
            replies: [
              {
                id: 800041,
                userId: 9002,
                authorName: 'Vivian',
                content: 'Cố lên bạn nhé, kiên trì 2 tuần là thấy kết quả liền!',
                timeAgo: '1 giờ trước',
                likesCount: 5,
              },
            ],
          },
        ],
      }

      const savedCommentsMap = localStorage.getItem('facecook_comments_map')
      const parsedMap = savedCommentsMap ? JSON.parse(savedCommentsMap) : {}
      const mergedCommentsMap: Record<number, Comment[]> = { ...initialDefaultComments }
      Object.keys(parsedMap).forEach((k) => {
        mergedCommentsMap[Number(k)] = parsedMap[k]
      })
      setCommentsMap(mergedCommentsMap)
    } catch {
      // ignore JSON parse errors
    }

    const handleStorageUpdate = () => {
      try {
        const savedLikes = localStorage.getItem('facecook_feed_liked_map')
        if (savedLikes) setLikedMap(JSON.parse(savedLikes))
        const savedLikeCounts = localStorage.getItem('facecook_feed_like_count_map')
        if (savedLikeCounts) setLikeCountMap(JSON.parse(savedLikeCounts))

        const savedComments = localStorage.getItem('facecook_comments_map')
        if (savedComments) {
          const parsed = JSON.parse(savedComments)
          setCommentsMap((prev) => {
            const next = { ...prev }
            Object.keys(parsed).forEach((k) => {
              const numKey = Number(k)
              next[numKey] = parsed[k]
            })
            return next
          })
        }
      } catch {}
    }

    window.addEventListener('facecook_like_updated', handleStorageUpdate)
    window.addEventListener('facecook_comment_added', handleStorageUpdate)
    window.addEventListener('storage', handleStorageUpdate)

    return () => {
      window.removeEventListener('facecook_like_updated', handleStorageUpdate)
      window.removeEventListener('facecook_comment_added', handleStorageUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [userId, fullName, avatarUrl])

  // Save posts to localStorage whenever userPosts changes
  const saveUserPosts = (posts: SocialPost[]) => {
    setUserPosts(posts)
    try {
      localStorage.setItem('facecook_feed_user_posts', JSON.stringify(posts))
    } catch {
      // ignore storage errors
    }
  }

  // Handle local image file upload from computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPostImageUrl(event.target.result as string)
          toast.success('Đã tải ảnh từ máy tính thành công!')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Facebook-style Publish Post
  const handlePublishPost = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng bài viết!')
      return
    }
    if (!postText.trim() && !postImageUrl.trim()) {
      toast.error('Vui lòng nhập nội dung hoặc đính kèm hình ảnh cho bài viết')
      return
    }

    const attachedId = attachRecipe && selectedRecipeId ? Number(selectedRecipeId) : undefined
    const attachedRecipeObj = attachedId ? recipes?.find((r) => r.recipeId === attachedId) : undefined

    let attachedAiPlanId: string | undefined = undefined
    let attachedAiPlanTitle: string | undefined = undefined
    let attachedAiMealsSummary: string | undefined = undefined

    if (attachAiPlan && selectedAiPlanId) {
      if (selectedAiPlanId.startsWith('saved:')) {
        const rawId = selectedAiPlanId.replace('saved:', '')
        const found = savedMealPlans.find((p) => String(p.id) === String(rawId))
        if (found) {
          attachedAiPlanId = String(found.id)
          attachedAiPlanTitle = found.title
          attachedAiMealsSummary = `Calo mục tiêu: ${found.macros.targetCalories} kcal/ngày. Cho ${found.servings} người. Tạo ngày ${new Date(found.createdAt).toLocaleDateString('vi-VN')}`
          registerSharedMealPlan(found)
        }
      } else if (selectedAiPlanId.startsWith('preset:')) {
        const rawId = selectedAiPlanId.replace('preset:', '')
        const preset = DEFAULT_PRESET_AI_PLANS.find((p) => p.id === rawId)
        if (preset) {
          attachedAiPlanId = preset.id
          attachedAiPlanTitle = preset.title
          attachedAiMealsSummary = preset.summary
        }
      }
    }

    const currentAuthorId = userId ? (isNaN(Number(userId)) ? userId : Number(userId)) : 1
    const newPost: SocialPost = {
      id: Date.now(),
      authorId: currentAuthorId,
      authorName: fullName || getVietnameseOrForeignName(userId),
      authorAvatar: avatarUrl || undefined,
      authorLikes: rankInfo?.totalLikes ?? 0,
      timeAgo: 'Vừa xong',
      content: postText.trim(),
      imageUrl: postImageUrl.trim() || undefined,
      attachedRecipeId: attachedId,
      recipeName: attachedRecipeObj?.recipeName,
      cookingTime: attachedRecipeObj?.cookingTime,
      attachedAiPlanId,
      attachedAiPlanTitle,
      attachedAiMealsSummary,
      initialLikes: 0,
      isUserCreated: true,
    }

    const updated = [newPost, ...userPosts]
    saveUserPosts(updated)
    setPostText('')
    setPostImageUrl('')
    setShowImageInput(false)
    setAttachRecipe(false)
    setSelectedRecipeId('')
    setAttachAiPlan(false)
    setSelectedAiPlanId('')
    toast.success('Đã đăng bài viết mới lên Bảng tin và lưu vào dữ liệu!')
  }

  // Edit Post
  const handleStartEdit = (p: SocialPost) => {
    setEditingPostId(p.id)
    setEditContent(p.content)
    setEditImageUrl(p.imageUrl || '')
  }

  const handleSaveEdit = (postId: number) => {
    const updated = userPosts.map((p) =>
      p.id === postId ? { ...p, content: editContent.trim(), imageUrl: editImageUrl.trim() || undefined } : p,
    )
    saveUserPosts(updated)
    setEditingPostId(null)
    toast.success('Đã cập nhật bài viết!')
  }

  // Delete Post
  const handleDeletePost = (postId: number) => {
    const updated = userPosts.filter((p) => p.id !== postId)
    saveUserPosts(updated)
    toast.success('Đã xóa bài viết khỏi Bảng tin!')
  }

  // Hide Post
  const handleHidePost = (postId: number) => {
    const updated = [...hiddenPostIds, postId]
    setHiddenPostIds(updated)
    try {
      localStorage.setItem('facecook_feed_hidden_posts', JSON.stringify(updated))
    } catch {}
    toast.info('Đã ẩn bài viết này khỏi Bảng tin của bạn')
  }

  // Block Author
  const handleBlockAuthor = (authorName: string) => {
    const updated = [...blockedAuthors, authorName]
    setBlockedAuthors(updated)
    try {
      localStorage.setItem('facecook_feed_blocked_authors', JSON.stringify(updated))
    } catch {}
    toast.info(`Đã chặn tất cả bài viết từ ${authorName}`)
  }

  // Report Post to Admin
  const handleReportPost = (authorName: string) => {
    toast.success(`Đã gửi báo cáo vi phạm bài viết của ${authorName} tới Admin xem xét xử lý!`)
  }

  // Toggle Independent Heart / Like
  const handleLikePost = (postId: number, baseLikes: number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thả tim bài viết!')
      return
    }
    const isCurrentlyLiked = likedMap[postId] ?? false
    const currentLikes = likeCountMap[postId] ?? baseLikes

    const nextLiked = !isCurrentlyLiked
    const nextCount = isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1

    const newLikedMap = { ...likedMap, [postId]: nextLiked }
    const newLikeCountMap = { ...likeCountMap, [postId]: nextCount }
    setLikedMap(newLikedMap)
    setLikeCountMap(newLikeCountMap)

    try {
      localStorage.setItem('facecook_feed_liked_map', JSON.stringify(newLikedMap))
      localStorage.setItem('facecook_feed_like_count_map', JSON.stringify(newLikeCountMap))
      window.dispatchEvent(new Event('facecook_like_updated'))
    } catch {}

    if (nextLiked) {
      toast.success('❤️ Đã thả tim bài viết!')
      try {
        const post = allFeedPosts.find((p) => p.id === postId)
        const authorId = (post as any)?.authorId || 1
        const myName = fullName || getVietnameseOrForeignName(userId ? Number(userId) : 1)
        const rawNotifs = localStorage.getItem('facecook_feed_notifications')
        const existingNotifs: any[] = rawNotifs ? JSON.parse(rawNotifs) : []

        const otherCount = Math.max(0, nextCount - 1)
        const text = otherCount > 0 ? `và ${otherCount} người khác đã thích bài viết của bạn` : `đã thích bài viết của bạn`

        const aggregatedNotif = {
          id: `like-post-${postId}`,
          type: 'like' as const,
          postId,
          postContentSnippet: post?.content || post?.recipeName || 'Bài viết Bảng tin',
          actorUserId: userId ? Number(userId) : 1,
          actorName: myName,
          actorAvatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 1}`,
          text: text,
          timeAgo: 'Vừa xong',
          createdAt: new Date().toISOString(),
          isRead: false,
          recipientUserId: authorId,
        }

        const filteredExisting = existingNotifs.filter(
          (n: any) => n.id !== `like-post-${postId}` && !(n.type === 'like' && Number(n.postId) === Number(postId)),
        )
        localStorage.setItem('facecook_feed_notifications', JSON.stringify([aggregatedNotif, ...filteredExisting]))
        window.dispatchEvent(new CustomEvent('facecook_notification_added'))
        window.dispatchEvent(new Event('storage'))
      } catch {}
    } else {
      toast.info('Đã bỏ thả tim bài viết')
    }
  }

  // Real-time listener for like updates across FeedView and PostStatusModal
  useEffect(() => {
    const handleSyncLikes = () => {
      try {
        const savedLikes = localStorage.getItem('facecook_feed_liked_map')
        if (savedLikes) {
          setLikedMap(JSON.parse(savedLikes))
        }
        const savedLikeCounts = localStorage.getItem('facecook_feed_like_count_map')
        if (savedLikeCounts) {
          setLikeCountMap(JSON.parse(savedLikeCounts))
        }
      } catch {}
    }

    window.addEventListener('facecook_like_updated', handleSyncLikes)
    return () => window.removeEventListener('facecook_like_updated', handleSyncLikes)
  }, [])

  // Toggle comments expand
  const toggleComments = async (recipeId: number) => {
    const isExpanding = !expandedComments[recipeId]
    setExpandedComments((prev) => ({ ...prev, [recipeId]: isExpanding }))

    if (isExpanding) {
      setLoadingComments((prev) => ({ ...prev, [recipeId]: true }))
      let apiComments: Comment[] = []
      try {
        const res = await getComments(recipeId)
        if (res && res.data) {
          apiComments = res.data.filter((c: any) => {
            const author = c.fullName || c.authorName || ''
            return !author.toLowerCase().includes('faker') && !/^user\s*#?\d+$/i.test(author)
          })
        }
      } catch {}

      let localComments: Comment[] = []
      try {
        const rawComments = localStorage.getItem('facecook_comments_map')
        if (rawComments) {
          const map = JSON.parse(rawComments)
          localComments = map[recipeId] || []
        }
      } catch {}

      const existingKeys = new Set<string>()
      const merged: Comment[] = []
      for (const c of [...localComments, ...apiComments]) {
        const key = `${c.commentId}_${c.content}`
        if (!existingKeys.has(key)) {
          existingKeys.add(key)
          merged.push(c)
        }
      }

      setCommentsMap((prev) => ({ ...prev, [recipeId]: merged }))
      setLoadingComments((prev) => ({ ...prev, [recipeId]: false }))
    }
  }

  // Submit new comment
  const handleSendComment = async (recipeId: number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bình luận!')
      return
    }
    const text = commentInputs[recipeId]?.trim()
    if (!text) return

    const myDisplayName = fullName || getVietnameseOrForeignName(userId)

    const success = await postComment({
      recipeId,
      userId: Number(userId),
      fullName: myDisplayName,
      content: text,
    })

    const newCommentObj: Comment = {
      commentId: Date.now(),
      recipeId,
      userId: Number(userId),
      authorName: myDisplayName,
      fullName: myDisplayName,
      content: text,
      createdAt: new Date().toISOString(),
    }

    try {
      const rawMap = localStorage.getItem('facecook_comments_map')
      const map = rawMap ? JSON.parse(rawMap) : {}
      const list = map[recipeId] || []
      list.push(newCommentObj)
      map[recipeId] = list
      localStorage.setItem('facecook_comments_map', JSON.stringify(map))
      window.dispatchEvent(new CustomEvent('facecook_comment_added'))
    } catch {}

    toast.success('Đã gửi bình luận!')
    setCommentInputs((prev) => ({ ...prev, [recipeId]: '' }))
    setCommentsMap((prev) => ({
      ...prev,
      [recipeId]: [...(prev[recipeId] || []), newCommentObj],
    }))
  }

  // Build combined posts list (user custom posts + recipe posts synchronized and shuffled with Users in database)
  const synchronizedPosts = getSynchronizedFeedPosts(recipes ?? [], allUsers ?? [], userPosts)
  const allFeedPosts = synchronizedPosts.map((p) => {
    const customLikes = likeCountMap[p.id]
    const initialLikes = customLikes !== undefined ? customLikes : p.initialLikes
    return {
      ...p,
      initialLikes,
      authorLikes: getUserTotalLikes(p.authorId || 1, synchronizedPosts),
    }
  })

  // Re-synchronize author rank likes with updated post likes
  allFeedPosts.forEach((p) => {
    if (p.authorId) {
      getUserTotalLikes(p.authorId, allFeedPosts)
    }
  })

  const hasHandledStatusRef = useRef<string | null>(null)

  // Detect status ID from URL params if navigating directly to /feed/status/<encodedHash>
  useEffect(() => {
    const rawStatusId = params?.id as string | undefined
    if (rawStatusId && allFeedPosts.length > 0 && hasHandledStatusRef.current !== rawStatusId) {
      const decodedId = decodePostId(rawStatusId)
      const targetPost = allFeedPosts.find((p) => String(p.id) === String(decodedId) || encodePostId(p.id) === rawStatusId)
      if (targetPost) {
        hasHandledStatusRef.current = rawStatusId
        setActiveStatusPost(targetPost)
      }
    }
  }, [params?.id, recipes, allUsers, userPosts])

  const filteredPosts = allFeedPosts
    .filter((p) => {
      if (hiddenPostIds.includes(p.id)) return false
      const displayAuthor = getVietnameseOrForeignName(p.id, p.authorName)
      if (blockedAuthors.includes(displayAuthor) || blockedAuthors.includes(p.authorName)) return false
      return true
    })
    .sort((a, b) => {
      if (filterTab === 'latest') {
        return b.id - a.id
      }
      return 0
    })

  const topRecipes = [...(recipes ?? [])].slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Mini profile & Navigation Shortcuts (3 cols) */}
        <aside className="space-y-6 lg:col-span-3">
          {/* Profile Card */}
          {isAuthenticated ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <RankAvatarFrame totalLikes={getUserTotalLikes(userId || 1, allFeedPosts)}>
                  <Avatar className="size-12">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {fullName ? fullName[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </RankAvatarFrame>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-base font-bold">
                    {fullName || getVietnameseOrForeignName(userId)}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <RankBadge totalLikes={getUserTotalLikes(userId || 1, allFeedPosts)} size="sm" />
                    <span className="text-[11px] text-muted-foreground">
                      {getUserTotalLikes(userId || 1, allFeedPosts)} tim bài viết
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 space-y-2 text-xs">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <ChefHat className="size-4 text-primary" />
                  Hồ sơ & Đổi mật khẩu
                </Link>
                <Link
                  href="/submit?mode=form"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <PlusCircle className="size-4 text-emerald-500" />
                  Đăng công thức mới
                </Link>
                <Link
                  href="/meal-planner"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <Sparkles className="size-4 text-amber-500" />
                  Thực đơn 7 ngày AI
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-5 text-center space-y-3">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ChefHat className="size-6" />
              </span>
              <h3 className="font-serif text-base font-bold">Tham gia Facecook</h3>
              <p className="text-xs text-muted-foreground">
                Đăng nhập để thả tim bài viết, bình luận và chia sẻ khoảnh khắc ẩm thực!
              </p>
              <Link
                href="/login"
                className={buttonVariants({ className: 'w-full rounded-full text-xs font-semibold' })}
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Compass className="size-4 text-primary" />
              <span>Khám phá Facecook</span>
            </div>
            <p>
              Mạng xã hội chia sẻ công thức & khoảnh khắc ẩm thực phong cách Facebook hiện đại.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary" className="text-[10px]">#EatClean</Badge>
              <Badge variant="secondary" className="text-[10px]">#MonNgonMoiNgay</Badge>
              <Badge variant="secondary" className="text-[10px]">#HealthyFood</Badge>
              <Badge variant="secondary" className="text-[10px]">#VietnameseCuisine</Badge>
            </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Facebook-Style Post Publisher & Social Feed (6 cols) */}
        <main className="space-y-6 lg:col-span-6">
          {/* Facebook-style Interactive Post Publisher Box */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {fullName ? fullName[0].toUpperCase() : 'F'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Hôm nay bạn nấu món gì? Chia sẻ cảm nhận, hình ảnh hoặc mẹo nấu ăn..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="min-h-[75px] resize-none text-xs border-border/60 focus-visible:ring-1"
                />

                {/* Optional Image Input fields (File upload from computer + URL) */}
                {showImageInput && (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="feed-file-upload"
                        className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Upload className="size-3.5" />
                        Tải ảnh từ máy tính
                      </label>
                      <input
                        id="feed-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="text-[11px] text-muted-foreground">hoặc dán URL bên dưới</span>
                    </div>

                    <Input
                      placeholder="Dán URL hình ảnh món ăn (VD: https://example.com/mon-an.jpg)..."
                      value={postImageUrl}
                      onChange={(e) => setPostImageUrl(e.target.value)}
                      className="h-9 text-xs"
                    />

                    {postImageUrl && (
                      <div className="relative aspect-video max-h-48 overflow-hidden rounded-lg border border-border/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={postImageUrl} alt="Preview" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPostImageUrl('')}
                          className="absolute top-1.5 right-1.5 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Attached Recipe Picker */}
                {attachRecipe && (
                  <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3 animate-in fade-in duration-200">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <LinkIcon className="size-3.5" />
                      Đính kèm công thức món ăn
                    </span>
                    <Select value={selectedRecipeId} onValueChange={(val) => setSelectedRecipeId(val ?? '')}>
                      <SelectTrigger className="h-9 text-xs bg-card">
                        <SelectValue placeholder="Chọn công thức món ăn của hệ thống..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(recipes ?? []).map((r) => (
                          <SelectItem key={r.recipeId} value={String(r.recipeId)} className="text-xs">
                            {r.recipeName} ({r.cookingTime || 20} phút)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Optional Attached AI Plan Picker */}
                {attachAiPlan && (
                  <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 animate-in fade-in duration-200">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      Đính kèm Thực đơn 7 ngày AI
                    </span>
                    <Select value={selectedAiPlanId} onValueChange={(val) => setSelectedAiPlanId(val ?? '')}>
                      <SelectTrigger className="h-9 text-xs bg-card">
                        <SelectValue placeholder="Chọn thực đơn 7 ngày của bạn hoặc thực đơn mẫu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedMealPlans.map((plan) => (
                          <SelectItem key={plan.id} value={`saved:${plan.id}`} className="text-xs">
                            Thực đơn #{plan.id} - {plan.title} ({plan.macros.targetCalories} kcal)
                          </SelectItem>
                        ))}
                        {DEFAULT_PRESET_AI_PLANS.map((preset) => (
                          <SelectItem key={preset.id} value={`preset:${preset.id}`} className="text-xs">
                            [Mẫu] {preset.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Publisher Action Controls displayed as MacOS Dock with Hover Tooltip */}
            <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-3 gap-2 text-xs">
              <div className="relative flex items-center">
                <Dock iconSize={40} className="mx-0 h-[48px] py-1 px-3 border-border/60 bg-secondary/30 shadow-none">
                  <DockIcon
                    onClick={() => setShowImageInput(!showImageInput)}
                    onMouseEnter={() => setHoveredPublisherAction('Ảnh từ máy tính / URL')}
                    onMouseLeave={() => setHoveredPublisherAction(null)}
                    className={cn(
                      'transition-all rounded-xl cursor-pointer',
                      showImageInput ? 'bg-amber-500/25 text-amber-500' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <ImageIcon className="size-5 text-amber-500" />
                  </DockIcon>

                  <DockIcon
                    onClick={() => setAttachRecipe(!attachRecipe)}
                    onMouseEnter={() => setHoveredPublisherAction('Đính kèm Công thức')}
                    onMouseLeave={() => setHoveredPublisherAction(null)}
                    className={cn(
                      'transition-all rounded-xl cursor-pointer',
                      attachRecipe ? 'bg-primary/25 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Utensils className="size-5 text-primary" />
                  </DockIcon>

                  <DockIcon
                    onClick={() => {
                      setAttachAiPlan(!attachAiPlan)
                      if (!attachAiPlan) setSavedMealPlans(getSavedMealPlans())
                    }}
                    onMouseEnter={() => setHoveredPublisherAction('Đính kèm Thực đơn AI')}
                    onMouseLeave={() => setHoveredPublisherAction(null)}
                    className={cn(
                      'transition-all rounded-xl cursor-pointer',
                      attachAiPlan ? 'bg-emerald-500/25 text-emerald-500' : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Sparkles className="size-5 text-emerald-500" />
                  </DockIcon>
                </Dock>

                {/* Floating Tooltip Label when hovering over Publisher Dock icons */}
                {hoveredPublisherAction && (
                  <div className="absolute -top-9 left-2 pointer-events-none z-50 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg animate-in fade-in zoom-in-95 whitespace-nowrap">
                    {hoveredPublisherAction}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={handlePublishPost}
                className="rounded-full px-5 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Send className="size-3.5" />
                Đăng bài
              </Button>
            </div>
          </div>

          {/* Standard Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
            {[
              { id: 'all' as const, label: 'Dành cho bạn', icon: Compass },
              { id: 'latest' as const, label: 'Bài viết mới', icon: Clock },
              { id: 'ai' as const, label: 'Thực đơn AI', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'ai') {
                    router.push('/meal-planner')
                  } else {
                    setFilterTab(tab.id)
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  filterTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Social Posts Feed */}
          <div className="space-y-6">
            {filteredPosts.map((p) => {
              const authorUserId = (p as any).authorId || 1
              const dbUser = allUsers?.find((u) => String(u.userId) === String(authorUserId))
              const isAuthorCurrent = Boolean(userId && String(authorUserId) === String(userId))

              const displayAuthor = isAuthorCurrent
                ? (fullName || dbUser?.fullName || (p.authorName && !p.authorName.includes('MasterChef') ? p.authorName : 'Vivian'))
                : (dbUser?.fullName || (p.authorName && !p.authorName.includes('MasterChef') ? p.authorName : getVietnameseOrForeignName(authorUserId)))

              const displayAvatar = isAuthorCurrent
                ? (avatarUrl || dbUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUserId}`)
                : (dbUser?.avatarUrl || (p.authorAvatar && !p.authorAvatar.includes('MasterChef') ? p.authorAvatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUserId}`))
              const encodedAuthorHash = encodeUserId(dbUser?.userId || authorUserId)
              const isOwner = Boolean(userId && String(authorUserId) === String(userId))
              const isEditing = editingPostId === p.id
              const isLiked = likedMap[p.id] ?? false
              const currentLikes = likeCountMap[p.id] ?? p.initialLikes
              const showComments = expandedComments[p.id] ?? false
              const commentsList = commentsMap[p.id] ?? []
              const displayCommentCount = commentsList.length > 0 ? commentsList.length : (p.commentsCount || 0)

              const likerUsers = (allUsers || []).slice(0, currentLikes)
              const likerAvatars = likerUsers.slice(0, 4).map((u) => ({
                imageUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.userId}`,
                profileUrl: `/profile/${encodeUserId(u.userId)}`,
                name: getVietnameseOrForeignName(u.userId, u.fullName),
              }))
              const extraLikersCount = Math.max(0, currentLikes - likerAvatars.length)

              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-colors hover:border-primary/30"
                >
                  {/* Author header with 3-Dots Action Menu */}
                  <div className="flex items-center justify-between p-4 pb-3">
                    <Link
                      href={`/profile/${encodedAuthorHash}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="size-10 border border-transparent group-hover:border-primary transition-colors">
                        <AvatarImage src={displayAvatar} alt={displayAuthor} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {displayAuthor[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {displayAuthor}
                          </span>
                          <RankBadge totalLikes={p.authorLikes ?? getUserTotalLikes(authorUserId)} size="sm" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{p.timeAgo} • Công khai</p>
                      </div>
                    </Link>

                    {/* 3-Dots Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer outline-none">
                        <MoreHorizontal className="size-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                        {isOwner ? (
                          <>
                            <DropdownMenuItem onClick={() => handleStartEdit(p)} className="cursor-pointer text-xs py-2">
                              <Edit className="size-4 mr-2 text-primary" />
                              <span>Chỉnh sửa bài viết</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeletePost(p.id)} className="cursor-pointer text-xs py-2 text-destructive">
                              <Trash2 className="size-4 mr-2" />
                              <span>Xóa bài viết</span>
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleHidePost(p.id)} className="cursor-pointer text-xs py-2">
                              <EyeOff className="size-4 mr-2 text-muted-foreground" />
                              <span>Ẩn bài viết này</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockAuthor(displayAuthor)} className="cursor-pointer text-xs py-2">
                              <UserX className="size-4 mr-2 text-amber-500" />
                              <span>Chặn {displayAuthor}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleReportPost(displayAuthor)} className="cursor-pointer text-xs py-2 text-destructive">
                              <Flag className="size-4 mr-2" />
                              <span>Báo cáo bài viết cho Admin</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Inline Editing Form */}
                  {isEditing ? (
                    <div className="p-4 space-y-3 bg-secondary/20 border-y border-border/40">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-xs min-h-[70px]"
                      />
                      <Input
                        placeholder="URL hình ảnh (nếu có)..."
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingPostId(null)} className="h-8 text-xs">
                          Hủy
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(p.id)} className="h-8 text-xs">
                          Lưu chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Post text content */
                    p.content && (
                      <div
                        onClick={() => setActiveStatusPost(p)}
                        className="px-4 pb-3 cursor-pointer group/content"
                      >
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line group-hover/content:text-primary transition-colors">
                          {p.content}
                        </p>
                      </div>
                    )
                  )}

                  {/* Attached Recipe Card */}
                  {Boolean(p.attachedRecipeId || p.id === 9001 || p.id === 9002 || p.isRecipeArticle) && (
                    <Link
                      href={`/recipe/${p.attachedRecipeId || (p.id === 9001 ? 9001 : (p.id === 9002 ? 9002 : p.id))}`}
                      className="group mx-4 mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3 hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Utensils className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {p.recipeName || (p.id === 9001 ? 'Phở Bò Truyền Thống Hà Nội' : (p.id === 9002 ? 'Bún Chả Hà Nội Nướng Than Hoa' : 'Xem công thức chi tiết'))}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.cookingTime ? `Thời gian nấu: ${p.cookingTime} phút` : 'Click để xem nguyên liệu & các bước thực hiện'}
                          </p>
                        </div>
                      </div>
                      <div className={buttonVariants({ size: 'sm', variant: 'outline', className: 'h-8 text-[11px] rounded-full shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors' })}>
                        Xem công thức ➔
                      </div>
                    </Link>
                  )}

                  {/* Attached AI Plan Card */}
                  {p.attachedAiPlanTitle && (
                    <Link
                      href={p.attachedAiPlanId && !p.attachedAiPlanId.startsWith('preset-') ? `/meal-planner/${p.attachedAiPlanId}` : '/meal-planner'}
                      className="group mx-4 mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between gap-3 hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Sparkles className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {p.attachedAiPlanTitle}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.attachedAiMealsSummary || 'Click để xem chi tiết kế hoạch ăn uống 7 ngày'}
                          </p>
                        </div>
                      </div>
                      <div className={buttonVariants({ size: 'sm', variant: 'outline', className: 'h-8 text-[11px] rounded-full shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors' })}>
                        Xem thực đơn ➔
                      </div>
                    </Link>
                  )}

                  {/* Post Image */}
                  {p.imageUrl && (
                    <div
                      onClick={() => setActiveStatusPost(p)}
                      className="relative aspect-[16/9] overflow-hidden bg-muted cursor-pointer group/img"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt="Post image"
                        className="size-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(p.id)
                        }}
                      />
                    </div>
                  )}

                  {/* Actions bar (Independent Post Heart / Like) */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-5">
                      {/* Independent Post Heart Button */}
                      <button
                        onClick={() => handleLikePost(p.id, p.initialLikes)}
                        className={cn(
                          'flex items-center gap-1.5 font-medium transition-colors cursor-pointer',
                          isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <Heart className={cn('size-4', isLiked && 'fill-current text-destructive animate-in zoom-in-50')} />
                        <span>Thả tim ({currentLikes})</span>
                      </button>

                      {/* Comment Toggle */}
                      <button
                        onClick={() => toggleComments(p.id)}
                        className="flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <MessageSquare className="size-4" />
                        <span>Bình luận ({displayCommentCount})</span>
                      </button>
                    </div>

                    <AvatarCircles
                      avatarUrls={likerAvatars}
                      numPeople={extraLikersCount}
                      onClick={() => {
                        setLikesModalPostId(p.id)
                        setActiveLikesCount(currentLikes)
                      }}
                    />
                  </div>

                  {/* Expanded Comments Section */}
                  {showComments && (
                    <div className="border-t border-border/40 bg-secondary/20 p-4 space-y-4">
                      {/* Comment input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Viết bình luận của bạn..."
                          value={commentInputs[p.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleSendComment(p.id)}
                          className="h-9 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSendComment(p.id)}
                          className="h-9 rounded-xl text-xs"
                        >
                          Gửi
                        </Button>
                      </div>

                      {/* Comments list */}
                      {loadingComments[p.id] ? (
                        <p className="text-center text-xs text-muted-foreground py-2">Đang tải bình luận...</p>
                      ) : commentsList.length > 0 ? (
                        <div className="space-y-3 pt-1">
                          {commentsList.map((c, i) => (
                            <CommentItem
                              key={c.commentId ?? i}
                              comment={c}
                              allUsers={allUsers}
                              currentUserId={userId ? Number(userId) : undefined}
                              currentUserName={fullName ?? undefined}
                              currentUserAvatar={avatarUrl ?? undefined}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground py-2">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </main>

        {/* RIGHT COLUMN: Trending & MasterChef Highlights (3 cols) */}
        <aside className="space-y-6 lg:col-span-3">
          {/* Trending Recipes Widget */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-1.5">
                <Flame className="size-4 text-orange-500" />
                Món ăn Hot nhất
              </h3>
              <Link href="/recipes" className="text-xs text-primary hover:underline font-medium">
                Tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {topRecipes.map((r) => (
                <Link
                  key={r.recipeId}
                  href={`/recipe/${r.recipeId}`}
                  className="flex items-center gap-3 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.imageUrl || recipeFallbackImage(r.recipeId)}
                    alt={r.recipeName}
                    className="size-12 rounded-xl object-cover shrink-0 group-hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = recipeFallbackImage(r.recipeId)
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-xs group-hover:text-primary transition-colors">
                      {r.recipeName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {r.cookingTime ? `${r.cookingTime} phút` : 'Công thức hot'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* MasterChef Leaderboard Teaser */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles className="size-4" />
              Bảng Xếp Hạng MasterChef
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tích lũy lượt tim Bảng tin và số công thức đã chia sẻ để vinh danh Đầu bếp xuất sắc!
            </p>
            <Link
              href="/leaderboard"
              className={buttonVariants({ size: 'sm', className: 'w-full rounded-full text-xs font-semibold' })}
            >
              Xem BXH MasterChef
            </Link>
          </div>
        </aside>
      </div>

      <PostLikesModal
        open={Boolean(likesModalPostId)}
        onOpenChange={(op) => !op && setLikesModalPostId(null)}
        likesCount={activeLikesCount}
        postId={likesModalPostId || undefined}
      />

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

export default FeedView
