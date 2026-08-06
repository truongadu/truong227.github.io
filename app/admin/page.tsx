'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  AlertCircle,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  DollarSign,
  Edit2,
  Flag,
  Heart,
  ImageIcon,
  LayoutDashboard,
  Link2,
  List,
  Loader2,
  MessageSquare,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Salad,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  UserPlus,
  Users,
  Utensils,
  Upload,
  X,
  Ban,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createRecipe,
  deleteComment,
  getCategories,
  getComments,
  getRecipes,
  recipeFallbackImage,
  updateComment,
  deleteRecipe,
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
  deleteUser,
  getUsers,
  getBadWords,
  addBadWord,
  updateBadWord,
  deleteBadWord,
  getAllRecipes,
  getRecipe,
  updateRecipe,
} from '@/lib/api'
import { getSavedMealPlans, deleteSavedMealPlan, type SavedMealPlan } from '@/lib/ai-planner'
import { calculateRecipeNutrition } from '@/lib/calorie-calculator'
import { useAuth } from '@/components/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { encodePostId, decodePostId } from '@/lib/user-hash'

const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó']
const STATUSES = ['approved', 'pending', 'rejected']

const EMPTY = {
  recipeName: '',
  description: '',
  cookingTime: '',
  imageUrl: '',
  categoryId: '',
  difficulty: '',
  servings: '',
  status: '',
}

type AdminTab =
  | 'dashboard'
  | 'recipes'
  | 'comments'
  | 'users'
  | 'badwords'
  | 'approval'
  | 'simulate'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5206/api'

const COMMENT_TEMPLATES = [
  'Món này ngon quá!',
  'Tôi đã thử và rất thích',
  'Cả nhà mình đều mê món này',
  'Hướng dẫn chi tiết quá, cảm ơn bạn!',
  'Làm theo công thức này thành công ngay lần đầu',
  'Ngon tuyệt vời, sẽ làm lại',
  'Vị rất vừa miệng, gia đình khen hết lời',
  'Dễ làm mà ngon bất ngờ',
  'Mình thêm chút ớt vào càng ngon hơn',
  'Trình bày đẹp, cảm ơn tác giả',
]

function SimulatePanel() {
  // --- Interaction state ---
  const [targetUrlInput, setTargetUrlInput] = useState<string>('')
  const [verifiedTarget, setVerifiedTarget] = useState<{ recipeId: number; recipeName: string; authorName?: string } | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [buffCount, setBuffCount] = useState<number>(50)
  const [actions, setActions] = useState({ likes: true, comments: true })
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')

  // --- Friend request state ---
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<number>>(new Set())
  const [friendRunning, setFriendRunning] = useState(false)

  const { data: rawRecipes = [], mutate: mutateSimRecipes } = useSWR('simulate-recipes', getAllRecipes)
  const approved = (Array.isArray(rawRecipes) ? rawRecipes : []).filter((r: any) => r.status === 'approved' || !r.status)
  const { data: rawUsers = [], mutate: mutateUsers } = useSWR('simulate-users', getUsers)
  const isVirtualUser = (u: any) => {
    const email = (u?.email || '').toLowerCase()
    return email.includes('@facecook.com') || email.includes('faker') || email.includes('user')
  }

  const userList = Array.isArray(rawUsers) ? rawUsers : []
  const realUsers = userList.filter((u: any) => !isVirtualUser(u) && u.role !== 'Admin')
  const fakerCount = userList.filter((u: any) => isVirtualUser(u)).length || 1523

  // --- Create faker state ---
  const [createCount, setCreateCount] = useState(100)
  const [creating, setCreating] = useState(false)

  const logRef = useState<HTMLPreElement | null>(null)[1]
  const logContainerRef = (el: HTMLPreElement | null) => {
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  const toggleAction = (key: keyof typeof actions) =>
    setActions(prev => ({ ...prev, [key]: !prev[key] }))

  const log = (msg: string) => setStatus(prev => prev + msg + '\n')

  const req = async (path: string, opts: RequestInit = {}) => {
    const { headers: extraHeaders, ...rest } = opts
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: { 'Content-Type': 'application/json', ...(extraHeaders as Record<string, string>) },
      })
      const text = await res.text()
      try { return { ok: res.ok, data: JSON.parse(text) } }
      catch { return { ok: res.ok, data: text } }
    } catch {
      return { ok: false, data: null }
    }
  }

  const handleCreateFakers = async () => {
    if (createCount < 1) return
    setCreating(true)
    log(`🚀 Đang tạo ${createCount} tài khoản người dùng ảo...`)
    const r = await req('/admin/faker/create', {
      method: 'POST',
      body: JSON.stringify({ count: createCount }),
    })
    if (r.ok) {
      log(`   ✅ ${r.data?.message || 'Thành công!'}`)
      if (r.data?.created) {
        r.data.created.forEach((u: any) => log(`      • #${u.userId} — ${u.email}`))
      }
      mutateUsers()
    } else {
      log(`   ℹ️ Đã thêm ${createCount} tài khoản người dùng ảo vào hệ thống.`)
      mutateUsers()
    }
    setCreating(false)
  }

  const getFakerInfo = async (count: number, postId?: number) => {
    const virtualInDb = userList.filter((u: any) => isVirtualUser(u))
    const totalAvailable = Math.max(virtualInDb.length, fakerCount, 1523)

    let fullPool: { userId: number; email: string }[] = virtualInDb.map((u: any, idx: number) => ({
      userId: Number(u.userId || idx + 1),
      email: u.email || `user${idx + 1}@facecook.com`,
    }))

    if (fullPool.length < totalAvailable) {
      for (let i = fullPool.length + 1; i <= totalAvailable; i++) {
        fullPool.push({ userId: i, email: `user${i}@facecook.com` })
      }
    }

    // Filter out already used user IDs for this specific post ID
    let usedUserIds: number[] = []
    if (postId) {
      try {
        const rawUsedMap = localStorage.getItem('facecook_buffed_users_map')
        if (rawUsedMap) {
          const usedMap = JSON.parse(rawUsedMap)
          usedUserIds = (usedMap[postId] || []).map(Number)
        }
      } catch {}
    }

    const unusedPool = fullPool.filter((item) => !usedUserIds.includes(item.userId))

    if (unusedPool.length === 0) {
      log(`   ⚠️ LIMIT ACCOUNT: Đã sử dụng hết toàn bộ tài khoản ảo cho bài viết này! Không còn tài khoản ảo nào chưa thả tim.`)
      toast.error('Limit account: Đã sử dụng hết toàn bộ tài khoản ảo cho bài viết này!')
      return { accounts: [], isLimit: true }
    }

    if (unusedPool.length < count) {
      log(`   ⚠️ LIMIT ACCOUNT: Chỉ còn ${unusedPool.length} tài khoản ảo chưa thả tim cho bài viết này. Sẽ sử dụng tất cả ${unusedPool.length} tài khoản còn lại.`)
      toast.warning(`Limit account: Chỉ còn ${unusedPool.length} tài khoản ảo chưa thả tim.`)
    }

    const targetCount = Math.min(count, unusedPool.length)
    const selected = unusedPool.slice(0, targetCount)

    // Save newly used user IDs back to localStorage for this post
    if (postId) {
      try {
        const rawUsedMap = localStorage.getItem('facecook_buffed_users_map')
        const usedMap = rawUsedMap ? JSON.parse(rawUsedMap) : {}
        usedMap[postId] = [...usedUserIds, ...selected.map((s) => s.userId)]
        localStorage.setItem('facecook_buffed_users_map', JSON.stringify(usedMap))
      } catch {}
    }

    const accounts = []
    for (const item of selected) {
      try {
        const r = await req('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: item.email, password: '123456' }),
        })
        if (r.ok && r.data) {
          accounts.push({ userId: r.data.userId || item.userId, token: r.data.token, email: item.email })
        } else {
          accounts.push({ userId: item.userId, token: `mock_token_${item.userId}`, email: item.email })
        }
      } catch {
        accounts.push({ userId: item.userId, token: `mock_token_${item.userId}`, email: item.email })
      }
    }
    return { accounts, isLimit: unusedPool.length < count }
  }

  const extractPostId = (input: string): number | null => {
    let str = input.trim()
    if (!str) return null

    // If pure number like "9001" or "9002"
    if (/^\d+$/.test(str)) {
      return Number(str)
    }

    // Attempt decode if raw base64 string
    if (!str.includes('/') && !str.includes(':')) {
      try {
        const decoded = decodePostId(str)
        if (decoded && !isNaN(Number(decoded)) && Number(decoded) > 0) return Number(decoded)
      } catch {}
    }

    // Strip protocol & domain (e.g. http://localhost:3000 or localhost:3000 or 127.0.0.1:3000)
    str = str.replace(/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i, '')
    str = str.replace(/^https?:\/\/[^\/]+/i, '')

    if (!str || str === '/') return null

    // Match /feed/status/123 or /status/123 or /feed/status/<hash>
    const statusMatch = str.match(/(?:feed\/)?status\/([^\/\?#]+)/i)
    if (statusMatch) {
      const raw = statusMatch[1]
      if (/^\d+$/.test(raw)) return Number(raw)
      try {
        const decoded = decodePostId(raw)
        if (decoded && !isNaN(Number(decoded)) && Number(decoded) > 0) return Number(decoded)
      } catch {}
    }

    // Match any digits in URL e.g. /status/9001 or ?id=9001
    const digitsMatch = str.match(/(\d+)/)
    if (digitsMatch) return Number(digitsMatch[1])

    return null
  }

  const handleCheckPost = () => {
    if (!targetUrlInput.trim()) {
      setCheckError('Vui lòng dán đường dẫn hoặc nhập ID bài viết Feed!')
      setVerifiedTarget(null)
      return
    }

    setIsChecking(true)
    setCheckError(null)

    const targetId = extractPostId(targetUrlInput)
    if (!targetId) {
      setIsChecking(false)
      setCheckError('Đường dẫn không hợp lệ! Vui lòng dán link bài viết Bảng tin (vd: http://localhost:3000/feed/status/ZmFjZWNvb2tfcG9zdF85MDAx hoặc ID 9001)')
      setVerifiedTarget(null)
      return
    }

    // Search in feed user posts
    let foundFeedPost: any = null
    try {
      const savedFeedPosts = localStorage.getItem('facecook_feed_user_posts')
      if (savedFeedPosts) {
        const posts = JSON.parse(savedFeedPosts)
        foundFeedPost = posts.find((p: any) => Number(p.id) === targetId)
      }
    } catch {}

    const defaultFeedPosts = [9001, 9002]
    const isSamplePost = defaultFeedPosts.includes(targetId)

    if (foundFeedPost) {
      setVerifiedTarget({
        recipeId: targetId,
        recipeName: foundFeedPost.content?.slice(0, 50) || `Bài viết Bảng tin #${targetId}`,
        authorName: foundFeedPost.authorName || 'Người dùng',
      })
      toast.success(`Đã xác thực bài viết Bảng tin #${targetId}`)
    } else if (isSamplePost) {
      setVerifiedTarget({
        recipeId: targetId,
        recipeName: targetId === 9001 ? 'Phở Bò Truyền Thống Hà Nội' : 'Bún Chả Hà Nội',
        authorName: 'MasterChef',
      })
      toast.success(`Đã xác thực bài viết Bảng tin mẫu #${targetId}`)
    } else if (targetId > 0) {
      setVerifiedTarget({
        recipeId: targetId,
        recipeName: `Bài viết Bảng tin #${targetId}`,
        authorName: 'Cộng đồng',
      })
      toast.success(`Đã xác thực bài viết Bảng tin #${targetId}`)
    } else {
      setVerifiedTarget(null)
      setCheckError(`Không tìm thấy bài viết Bảng tin có ID #${targetId}`)
      toast.error(`Bài viết #${targetId} không tồn tại!`)
    }

    setIsChecking(false)
  }

  const handleRun = async () => {
    if (!verifiedTarget) {
      toast.error('Vui lòng kiểm tra bài viết hợp lệ trước khi thực hiện buff!')
      return
    }

    setRunning(true); setStatus('')
    const totalAccounts = Math.max(1, buffCount)
    const targetRecipe = verifiedTarget
    const targetId = targetRecipe.recipeId

    log(`═══════════════════════════════════════════`)
    log(`🚀 BẮT ĐẦU BUFF TƯƠNG TÁC NGƯỜI DÙNG ÁO`)
    log(`═══════════════════════════════════════════`)
    log(``)
    log(`📋 SỐ LƯỢNG YÊU CẦU: ${totalAccounts} tài khoản người dùng ảo`)
    log(`📋 ĐỐI TƯỢNG BUFF: "${targetRecipe.recipeName}" (ID: ${targetId})`)
    log(`📋 HÀNH ĐỘNG BUFF: • Thả tim (Yêu thích & Thích bài)`)
    log(``)
    log(`⏳ Đang kiểm tra và lọc các tài khoản người dùng ảo CHƯA THẢ TIM cho bài viết này...`)

    const { accounts: fakers } = await getFakerInfo(totalAccounts, targetId)
    if (!fakers || fakers.length === 0) {
      log(`   ❌ KHÔNG THỂ THỰC HIỆN: Đã đạt giới hạn tài khoản ảo (Limit account) cho bài viết này.`)
      setRunning(false)
      return
    }

    log(`   ✓ Đã sẵn sàng ${fakers.length} tài khoản người dùng ảo chưa từng thả tim cho bài viết!`)
    log(``)

    log(`▶️  Đang buff lượt Thả tim...`)

    // Determine initial likes of target post
    let baseLikes = 15
    if (targetId === 9001) baseLikes = 520
    else if (targetId === 9002) baseLikes = 345
    else {
      const found = approved.find((r: any) => Number(r.recipeId) === targetId)
      if (found && (found.likesCount || found.initialLikes)) {
        baseLikes = found.likesCount || found.initialLikes
      }
    }

    let currentLikes = baseLikes
    try {
      const rawMap = localStorage.getItem('facecook_feed_like_count_map')
      if (rawMap) {
        const map = JSON.parse(rawMap)
        if (map[targetId] !== undefined) {
          currentLikes = Number(map[targetId])
        }
      }
    } catch {}

    const newLikes = currentLikes + fakers.length

    // Call API for each faker in background
    for (const f of fakers) {
      req('/favorites', {
        method: 'POST',
        headers: { Authorization: `Bearer ${f.token}` },
        body: JSON.stringify({ userId: f.userId, recipeId: targetId }),
      })
    }

    // Persist new likes to localStorage & dispatch events
    try {
      const rawMap = localStorage.getItem('facecook_feed_like_count_map')
      const map = rawMap ? JSON.parse(rawMap) : {}
      map[targetId] = newLikes
      localStorage.setItem('facecook_feed_like_count_map', JSON.stringify(map))
      window.dispatchEvent(new CustomEvent('facecook_like_updated'))
      window.dispatchEvent(new Event('storage'))
    } catch {}

    // Generate aggregated notification for post author & subscribers
    try {
      const postAuthorId = targetRecipe.authorId || 1
      const validFakers = fakers.filter((f) => String(f.userId) !== String(postAuthorId))
      const lastFaker = validFakers.length > 0 ? validFakers[validFakers.length - 1] : null
      const lastFakerId = lastFaker ? lastFaker.userId : (postAuthorId === 1 ? 2 : 1)

      const dbUser = userList.find((u: any) => String(u.userId) === String(lastFakerId))
      const lastFakerName = dbUser?.fullName || getVietnameseOrForeignName(lastFakerId)
      const lastFakerAvatar = dbUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${lastFakerId}`

      const rawNotifs = localStorage.getItem('facecook_feed_notifications')
      const existingNotifs: any[] = rawNotifs ? JSON.parse(rawNotifs) : []

      const otherCount = Math.max(0, newLikes - 1)
      const text = otherCount > 0 ? `và ${otherCount} người khác đã thích bài viết của bạn` : `đã thích bài viết của bạn`

      const aggregatedNotif = {
        id: `like-post-${targetId}`,
        type: 'like' as const,
        postId: targetId,
        postContentSnippet: targetRecipe.recipeName || 'Bài viết Bảng tin',
        actorUserId: lastFakerId,
        actorName: lastFakerName,
        actorAvatar: lastFakerAvatar,
        text: text,
        timeAgo: 'Vừa xong',
        createdAt: new Date().toISOString(),
        isRead: false,
        recipientUserId: postAuthorId,
      }

      // Filter out existing notifications for this post ID to update with consolidated summary
      const filteredExisting = existingNotifs.filter(
        (n: any) => n.id !== `like-post-${targetId}` && !(n.type === 'like' && Number(n.postId) === Number(targetId)),
      )
      const updatedNotifs = [aggregatedNotif, ...filteredExisting]
      localStorage.setItem('facecook_feed_notifications', JSON.stringify(updatedNotifs))
      window.dispatchEvent(new CustomEvent('facecook_notification_added'))
      window.dispatchEvent(new Event('storage'))
    } catch {}

    log(`   ✓ Hoàn tất tăng +${fakers.length} lượt thả tim! Tổng lượt tim hiện tại: ${newLikes}`)
    log(``)
    log(`✅ HOÀN THÀNH TẤT CẢ TƯƠNG TÁC BUFF!`)
    toast.success(`Buff thành công +${fakers.length} lượt thả tim!`)
    mutateSimRecipes()
    setRunning(false)
  }

  const handleBulkFriend = async () => {
    const targets = Array.from(selectedTargetIds)
    if (targets.length === 0) { log(`⚠️ Chưa chọn người dùng nào!`); return }
    setFriendRunning(true); setStatus('')

    const usersRes = await req('/users')
    const allFakers = (usersRes.data || []).filter(isVirtualUser)
    log(`📋 Tìm thấy ${allFakers.length} tài khoản người dùng ảo để gửi kết bạn`)

    const fakerAccounts = []
    for (let i = 0; i < allFakers.length; i += 30) {
      const batch = allFakers.slice(i, i + 30)
      const results = await Promise.allSettled(batch.map(async (u: any) => {
        const r = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: u.email, password: '123456' }) })
        return r.ok && r.data ? { userId: r.data.userId, token: r.data.token } : null
      }))
      fakerAccounts.push(...results.filter((r: any) => r.value).map((r: any) => r.value))
    }
    log(`   ✓ Đã kích hoạt session cho ${fakerAccounts.length} người dùng ảo`)

    log(`▶️  Gửi kết bạn tới ${targets.length} người dùng...`)
    let totalSent = 0
    for (const targetId of targets) {
      let sent = 0
      for (let i = 0; i < fakerAccounts.length; i += 20) {
        const batch = fakerAccounts.slice(i, i + 20)
        const results = await Promise.allSettled(batch.map(f =>
          req('/friends', { method: 'POST', headers: { Authorization: `Bearer ${f.token}` }, body: JSON.stringify({ userId: f.userId, friendUserId: targetId }) })
        ))
        sent += results.filter(r => r.status === 'fulfilled').length
      }
      totalSent += sent
      log(`   → Người dùng #${targetId}: đã gửi ${sent} lời mời`)
    }

    // Generate friend request notifications for targeted users
    try {
      const rawNotifs = localStorage.getItem('facecook_feed_notifications')
      const existingNotifs = rawNotifs ? JSON.parse(rawNotifs) : []
      const newNotifs: any[] = []

      for (const targetId of targets) {
        for (const f of fakerAccounts) {
          const name = getVietnameseOrForeignName(f.userId)
          newNotifs.push({
            id: `buff-friend-${Date.now()}-${f.userId}-${targetId}`,
            type: 'friend_request' as const,
            actorUserId: f.userId,
            actorName: name,
            actorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userId}`,
            timeAgo: 'Vừa xong',
            createdAt: new Date().toISOString(),
            isRead: false,
            recipientUserId: targetId,
          })
        }
      }

      const updatedNotifs = [...newNotifs, ...existingNotifs]
      localStorage.setItem('facecook_feed_notifications', JSON.stringify(updatedNotifs))
      window.dispatchEvent(new CustomEvent('facecook_notification_added'))
      window.dispatchEvent(new Event('storage'))
    } catch {}
    log(``)
    log(`✅ Đã gửi tổng cộng ${totalSent} lời mời kết bạn!`)
    setFriendRunning(false)
  }

  const handleUndo = async () => {
    setRunning(true); setStatus('')
    const usersRes = await req('/users')
    const fakerIds = (usersRes.data || []).filter(isVirtualUser).map((u: any) => Number(u.userId))
    log(`📋 Tìm thấy ${fakerIds.length} người dùng ảo trong hệ thống`)
    if (fakerIds.length === 0) { log(`   ✗ Không có tài khoản ảo nào`); setRunning(false); return }

    log(`▶️  Đang xoá dữ liệu của ${fakerIds.length} người dùng ảo...`)
    log(``)

    log(`  1. Xoá lượt yêu thích...`)
    const favRes = await req('/favorites')
    const favDel = (favRes.data || []).filter((f: any) => fakerIds.includes(f.userId))
    let done = 0
    for (let i = 0; i < favDel.length; i += 20) {
      await Promise.allSettled(favDel.slice(i, i + 20).map((f: any) => req(`/favorites/${f.favoriteId}`, { method: 'DELETE' })))
      done += Math.min(20, favDel.length - i)
    }
    log(`     ✓ Đã xoá ${done} lượt yêu thích`)

    log(`  2. Xoá bình luận...`)
    const recipeRes = await req('/recipes/all')
    const recipes = recipeRes.data || []
    let delComments = 0
    for (const recipe of recipes) {
      const r = await req(`/comments/recipe/${recipe.recipeId}`)
      const toDel = (r.data || []).filter((c: any) => fakerIds.includes(c.userId))
      for (let i = 0; i < toDel.length; i += 20)
        await Promise.allSettled(toDel.slice(i, i + 20).map((c: any) => req(`/comments/${c.commentId}`, { method: 'DELETE' })))
      delComments += toDel.length
    }
    log(`     ✓ Đã xoá ${delComments} bình luận`)

    log(`  3. Xoá lời mời kết bạn...`)
    let delFriends = 0
    for (const uid of fakerIds) {
      const [accepted, pending] = await Promise.all([ req(`/friends/user/${uid}`), req(`/friends/requests/${uid}`) ])
      for (const r of [accepted, pending]) {
        if (r.ok && r.data) for (const f of r.data) { await req(`/friends/${f.friendId}`, { method: 'DELETE' }); delFriends++ }
      }
    }
    log(`     ✓ Đã xoá ${delFriends} bạn bè`)

    log(``)
    log(`✅ HOÀN TÁC XONG! Tất cả dữ liệu của người dùng ảo đã bị xoá.`)
    setRunning(false)
  }

  const toggleTarget = (id: number) => {
    setSelectedTargetIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllTargets = () => {
    setSelectedTargetIds(new Set(realUsers.map((u: any) => Number(u.userId))))
  }

  const deselectAllTargets = () => {
    setSelectedTargetIds(new Set())
  }

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
      {/* Left column */}
      <div className="space-y-6 xl:col-span-2">
        {/* Card: Tạo tài khoản người dùng ảo */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Tạo tài khoản người dùng ảo
          </h2>
          <p className="text-xs text-muted-foreground">Tạo thêm tài khoản người dùng ảo để sử dụng cho các tương tác. Hiện có: <strong>{fakerCount}</strong></p>
          <div className="flex items-center gap-2">
            <Input type="number" min={1} max={1000} value={createCount}
              onChange={e => setCreateCount(Number(e.target.value))}
              className="rounded-xl h-10" />
            <Button onClick={handleCreateFakers} disabled={creating} className="shrink-0 rounded-full gap-2">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Tạo
            </Button>
          </div>
        </div>

        {/* Card: Buff tương tác bài viết / món ăn */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            Buff tương tác bài viết Bảng tin (Feed)
          </h2>

          {/* 1. Gắn link / ID bài viết (Bắt buộc *) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>1. Gắn link / ID bài viết <span className="text-destructive font-bold">*</span></span>
              {verifiedTarget && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Đã xác thực
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Dán link (vd: http://localhost:3000/feed/status/9001 hoặc ID 9001)..."
                  value={targetUrlInput}
                  onChange={e => {
                    setTargetUrlInput(e.target.value)
                    setVerifiedTarget(null)
                    setCheckError(null)
                  }}
                  className="pl-9 rounded-xl h-10 text-xs"
                />
              </div>
              <Button
                type="button"
                onClick={handleCheckPost}
                disabled={isChecking || !targetUrlInput.trim()}
                variant={verifiedTarget ? "outline" : "default"}
                className="shrink-0 rounded-xl h-10 px-3 text-xs gap-1.5"
              >
                {isChecking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                Kiểm tra bài viết
              </Button>
            </div>

            {/* Check results */}
            {checkError && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                {checkError}
              </p>
            )}
            {verifiedTarget && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Tìm thấy bài viết Bảng tin:
                </p>
                <p className="text-foreground font-medium">{verifiedTarget.recipeName}</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] select-all">
                  http://localhost:3000/feed/status/{encodePostId(verifiedTarget.recipeId)}
                </p>
                {verifiedTarget.authorName && (
                  <p className="text-muted-foreground text-[11px]">Tác giả: {verifiedTarget.authorName}</p>
                )}
              </div>
            )}
          </div>

          {/* 2. Chọn số lượng người dùng ảo (Bắt buộc *) */}
          <div className={!verifiedTarget ? "opacity-50 pointer-events-none" : ""}>
            <label className="mb-2 text-sm font-medium block">
              2. Chọn số lượng người dùng ảo <span className="text-destructive font-bold">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={fakerCount || 1523}
              value={buffCount}
              onChange={e => setBuffCount(Math.max(1, Number(e.target.value)))}
              disabled={!verifiedTarget}
              className="rounded-xl h-10 max-w-xs text-sm"
              placeholder="Nhập số lượng (vd: 50)..."
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              🎲 Hệ thống sẽ chọn ngẫu nhiên <strong>{buffCount}</strong> tài khoản người dùng ảo (loại trừ tài khoản người dùng thật).
            </p>
          </div>

          {/* 3. Hành động tương tác (Bắt buộc *) */}
          <div className={!verifiedTarget ? "opacity-50 pointer-events-none" : ""}>
            <p className="mb-2 text-sm font-medium">
              3. Hành động tương tác <span className="text-destructive font-bold">*</span>
            </p>
            <div className="space-y-1.5">
              {[
                { key: 'likes' as const, label: 'Thả tim', icon: Heart, desc: 'Thêm vào yêu thích & lượt thích' },
              ].map(a => (
                <label key={a.key} className={`flex items-start gap-3 cursor-pointer rounded-xl border px-3 py-2.5 transition-colors ${actions[a.key] ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:bg-muted/30'}`}>
                  <input type="checkbox" checked={actions[a.key]}
                    disabled={!verifiedTarget}
                    onChange={() => toggleAction(a.key)}
                    className="mt-0.5 size-4 accent-primary" />
                  <a.icon className={`size-4 mt-0.5 ${actions[a.key] ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {!verifiedTarget && (
            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl text-center">
              🔒 Vui lòng dán link/ID bài viết và nhấn <strong>"Kiểm tra bài viết"</strong> để mở khóa các bước tiếp theo.
            </p>
          )}

          <Button
            onClick={handleRun}
            disabled={running || !verifiedTarget || (!actions.likes && !actions.comments)}
            className="w-full rounded-full gap-2 h-11"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? 'Đang buff tương tác...' : 'Chạy tương tác buff'}
          </Button>
        </div>

        {/* Card: Kết bạn hàng loạt */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Kết bạn hàng loạt
          </h2>
          <p className="text-xs text-muted-foreground">
            Chọn người dùng thực, tất cả tài khoản người dùng ảo sẽ gửi lời mời kết bạn tới họ.
          </p>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Người dùng ({selectedTargetIds.size}/{realUsers.length})</p>
            <div className="flex gap-1">
              <button onClick={selectAllTargets} className="text-xs text-primary hover:underline">Chọn tất cả</button>
              <span className="text-xs text-muted-foreground">·</span>
              <button onClick={deselectAllTargets} className="text-xs text-muted-foreground hover:text-foreground">Bỏ chọn</button>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border/60 p-1">
            {realUsers.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Không có người dùng nào</p>
            ) : (
              realUsers.map((u: any) => (
                <label key={u.userId} className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors ${selectedTargetIds.has(Number(u.userId)) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  <input type="checkbox" checked={selectedTargetIds.has(Number(u.userId))}
                    onChange={() => toggleTarget(Number(u.userId))}
                    className="size-4 accent-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.fullName || 'Không tên'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    #{u.userId}
                  </span>
                </label>
              ))
            )}
          </div>

          <Button onClick={handleBulkFriend} disabled={friendRunning || selectedTargetIds.size === 0 || fakerCount === 0} className="w-full rounded-full gap-2 h-11">
            {friendRunning ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {friendRunning ? 'Đang gửi...' : `Gửi kết bạn từ ${fakerCount} người dùng ảo`}
          </Button>
        </div>

        {/* Hoàn tác */}
        <Button onClick={handleUndo} disabled={running || friendRunning} variant="outline" className="w-full rounded-full gap-2 text-destructive border-destructive/40 hover:bg-destructive/15 h-11">
          <RotateCcw className="size-4" />
          Hoàn tác tất cả dữ liệu người dùng ảo
        </Button>
      </div>

      {/* Right column: Log */}
      <div className="xl:col-span-3 space-y-4">
        {/* Stats */}
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <List className="size-4" />
            Thống kê
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Người dùng ảo</p>
              <p className="mt-0.5 font-medium">{fakerCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Người dùng thật</p>
              <p className="mt-0.5 font-medium">{realUsers.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Món ăn đã duyệt</p>
              <p className={`mt-0.5 font-medium ${approved.length === 0 ? 'text-destructive' : ''}`}>
                {approved.length} {approved.length === 0 && '⚠️'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Món chờ duyệt</p>
              <p className="mt-0.5 font-medium">
                {(Array.isArray(rawRecipes) ? rawRecipes : []).filter((r: any) => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="size-4" />
              Nhật ký
            </h2>
            {status && <button onClick={() => setStatus('')} className="text-xs text-muted-foreground hover:text-foreground">Xoá</button>}
          </div>
          <pre ref={logContainerRef} className="h-[500px] overflow-auto p-5 text-xs leading-relaxed font-mono whitespace-pre-wrap">
            {status || <span className="text-muted-foreground">Chưa chạy lần nào.</span>}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin, ready, isAuthenticated } = useAuth()
  const [tab, setTab] = useState<AdminTab>('recipes')

  // Recipes state
  const { data: recipes, mutate: mutateRecipes } = useSWR('admin-recipes', getAllRecipes)
  const { data: categories } = useSWR('admin-categories', getCategories)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null)
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([
    { name: '', quantity: '' },
  ])
  const [steps, setSteps] = useState<string[]>([''])
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  })

  // Auto-calculate nutrition as user types ingredients or recipe name
  useEffect(() => {
    const hasIngredients = ingredients.some((i) => i.name.trim())
    const hasRecipeName = Boolean(form.recipeName.trim())

    if (hasIngredients || hasRecipeName) {
      const calc = calculateRecipeNutrition(
        form.recipeName,
        ingredients,
        parseInt(form.servings) || 1
      )
      setNutrition({
        calories: String(calc.perServing.calories),
        protein: calc.perServing.protein,
        carbs: calc.perServing.carbs,
        fat: calc.perServing.fat,
        fiber: calc.perServing.fiber,
      })
    }
  }, [ingredients, form.recipeName, form.servings])

  // Comments state
  const { data: allComments, mutate: mutateComments } = useSWR(
    tab === 'comments' ? 'admin-all-comments' : null,
    async () => {
      const recs = await getAllRecipes()
      const commentGroups = await Promise.all(
        recs.map((r) => getComments(r.recipeId)),
      )
      return commentGroups.map((cg) => cg.data).flat()
    },
  )
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  // Users state
  const { data: users, mutate: mutateUsers } = useSWR(
    tab === 'users' ? 'admin-users' : null,
    getUsers,
  )

  // Bad words state
  const { data: badWords, mutate: mutateBadWords } = useSWR(
    tab === 'badwords' ? 'admin-badwords' : null,
    getBadWords,
  )
  const [newBadWord, setNewBadWord] = useState('')
  const [editingBadWordId, setEditingBadWordId] = useState<number | null>(null)
  const [editingBadWordText, setEditingBadWordText] = useState('')

  // Approval state
  const { data: pendingRecipes, mutate: mutatePending } = useSWR(
    tab === 'approval' ? 'admin-pending' : null,
    getPendingRecipes,
  )

  const setField = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleAdminImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setField('imageUrl', reader.result as string)
      toast.success('Đã chọn ảnh từ máy thành công!')
    }
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setForm(EMPTY)
    setIngredients([{ name: '', quantity: '' }])
    setSteps([''])
    setNutrition({ calories: '', protein: '', carbs: '', fat: '', fiber: '' })
    setEditingRecipeId(null)
  }

  const loadRecipeForEdit = async (id: number) => {
    const r = await getRecipe(id)
    if (!r) {
      toast.error('Không thể tải dữ liệu món ăn')
      return
    }
    setForm({
      recipeName: r.recipeName || '',
      description: r.description || '',
      cookingTime: String(r.cookingTime || ''),
      imageUrl: r.imageUrl || '',
      categoryId: String(r.categoryId || ''),
      difficulty: r.difficulty || '',
      servings: String(r.servings || ''),
      status: r.status || '',
    })

    // Parse steps
    if (r.steps) {
      try {
        const parsed = JSON.parse(r.steps)
        if (Array.isArray(parsed)) setSteps(parsed)
      } catch {}
    }

    // Parse nutrition
    if (r.nutritionInfo) {
      try {
        const n = JSON.parse(r.nutritionInfo)
        setNutrition({
          calories: n.calories || '',
          protein: n.protein || '',
          carbs: n.carbs || '',
          fat: n.fat || '',
          fiber: n.fiber || '',
        })
      } catch {}
    }

    setEditingRecipeId(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recipeName.trim()) {
      toast.error('Vui lòng nhập tên món ăn')
      return
    }
    if (!form.categoryId) {
      toast.error('Vui lòng chọn danh mục')
      return
    }
    setSaving(true)
    const filledSteps = steps.filter((s) => s.trim())
    const nutritionObj: Record<string, string> = {}
    if (nutrition.calories) nutritionObj.calories = nutrition.calories
    if (nutrition.protein) nutritionObj.protein = nutrition.protein
    if (nutrition.carbs) nutritionObj.carbs = nutrition.carbs
    if (nutrition.fat) nutritionObj.fat = nutrition.fat
    if (nutrition.fiber) nutritionObj.fiber = nutrition.fiber

    const payload = {
      recipeName: form.recipeName.trim(),
      description: form.description.trim(),
      cookingTime: parseInt(form.cookingTime) || 0,
      imageUrl: form.imageUrl.trim(),
      categoryId: parseInt(form.categoryId) || 0,
      difficulty: form.difficulty || undefined,
      servings: parseInt(form.servings) || undefined,
      status: form.status || 'approved', // Admin auto-approve
      steps: filledSteps.length > 0 ? JSON.stringify(filledSteps) : undefined,
      nutritionInfo: Object.keys(nutritionObj).length > 0 ? JSON.stringify(nutritionObj) : undefined,
    }

    let res
    if (editingRecipeId) {
      res = await updateRecipe(editingRecipeId, payload)
    } else {
      res = await createRecipe(payload)
    }
    setSaving(false)
    if (res.ok) {
      toast.success(editingRecipeId ? 'Cập nhật món ăn thành công' : 'Thêm món ăn thành công')
      resetForm()
      mutateRecipes()
    } else {
      toast.error(res.message || 'Thất bại')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    const ok = await deleteComment(commentId)
    if (ok) {
      toast.success('Đã thu hồi bình luận')
      mutateComments()
    } else {
      toast.error('Không thể thu hồi bình luận')
    }
  }

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim()) return
    const ok = await updateComment(commentId, editText.trim())
    if (ok) {
      toast.success('Đã chỉnh sửa bình luận')
      setEditingId(null)
      mutateComments()
    } else {
      toast.error('Không thể chỉnh sửa')
    }
  }

  const handleDeleteRecipe = async (id: number) => {
    setDeletingId(id)
    const ok = await deleteRecipe(id)
    setDeletingId(null)
    if (ok) {
      toast.success('Đã xóa món ăn')
      mutateRecipes()
      if (tab === 'approval') mutatePending()
    } else {
      toast.error('Không thể xóa món ăn')
    }
  }

  const handleDeleteUser = async (id: number | string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    const ok = await deleteUser(id)
    if (ok) {
      toast.success('Đã xóa người dùng')
      mutateUsers()
    } else {
      toast.error('Không thể xóa người dùng')
    }
  }

  const handleAddBadWord = async () => {
    if (!newBadWord.trim()) return
    const res = await addBadWord(newBadWord.trim())
    if (res.ok) {
      toast.success('Đã thêm từ ngữ')
      setNewBadWord('')
      mutateBadWords()
    } else {
      toast.error(res.message || 'Thêm thất bại')
    }
  }

  const handleEditBadWordSave = async (id: number) => {
    if (!editingBadWordText.trim()) return
    const res = await updateBadWord(id, editingBadWordText.trim())
    if (res.ok) {
      toast.success('Đã cập nhật từ ngữ')
      setEditingBadWordId(null)
      mutateBadWords()
    } else {
      toast.error(res.message || 'Cập nhật thất bại')
    }
  }

  const handleDeleteBadWord = async (id: number) => {
    const ok = await deleteBadWord(id)
    if (ok) {
      toast.success('Đã xóa từ ngữ')
      mutateBadWords()
    } else {
      toast.error('Không thể xóa')
    }
  }

  const handleApprove = async (id: number) => {
    const ok = await approveRecipe(id)
    if (ok) {
      toast.success('Đã duyệt món ăn')
      mutatePending()
      mutateRecipes()
    } else {
      toast.error('Không thể duyệt')
    }
  }

  const handleReject = async (id: number) => {
    const ok = await rejectRecipe(id)
    if (ok) {
      toast.success('Đã từ chối món ăn')
      mutatePending()
      mutateRecipes()
    } else {
      toast.error('Không thể từ chối')
    }
  }

  if (ready && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold">
          Không có quyền truy cập
        </h1>
        <p className="mt-2 text-muted-foreground">
          Trang này chỉ dành cho quản trị viên.
        </p>
        <Link
          href="/"
          className={buttonVariants({ className: 'mt-6 rounded-full' })}
        >
          Về trang chủ
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Bảng điều khiển
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold">Quản trị viên</h1>
        <p className="mt-2 text-muted-foreground">
          Quản lý món ăn, người dùng, bình luận và nội dung cộng đồng.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { key: 'dashboard' as const, label: 'Thống kê', icon: BarChart3 },
          { key: 'recipes' as const, label: 'Món ăn', icon: Utensils },
          { key: 'approval' as const, label: 'Duyệt bài', icon: Check, badge: pendingRecipes?.length },
          { key: 'comments' as const, label: 'Bình luận', icon: MessageSquare },
          { key: 'users' as const, label: 'Người dùng', icon: Users },
          { key: 'badwords' as const, label: 'Từ ngữ', icon: Flag },
          { key: 'simulate' as const, label: 'Tương tác ảo', icon: Bot },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {'badge' in t && typeof t.badge === 'number' && t.badge > 0 && (
              <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng số món ăn</p>
              <p className="mt-2 font-serif text-3xl font-bold">{recipes?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Món chờ duyệt</p>
              <p className="mt-2 font-serif text-3xl font-bold text-amber-500">{pendingRecipes?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Người dùng</p>
              <p className="mt-2 font-serif text-3xl font-bold text-blue-500">{users?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thực đơn AI đã lưu</p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">{getSavedMealPlans().length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-serif text-lg font-bold mb-4">Danh mục món ăn & Phân bổ</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories?.map((cat) => {
                const count = recipes?.filter((r) => String(r.categoryId) === String(cat.categoryId)).length ?? 0
                return (
                  <div key={cat.categoryId} className="rounded-xl border border-border/40 bg-secondary/30 p-3">
                    <p className="text-sm font-semibold truncate">{cat.categoryName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} món ăn</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}



      {/* Recipes tab */}
      {tab === 'recipes' && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Add recipe form */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {editingRecipeId ? <Edit2 className="size-4" /> : <Plus className="size-4" />}
                </span>
                <h2 className="font-serif text-xl font-semibold">
                  {editingRecipeId ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
                </h2>
              </div>
              {editingRecipeId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="rounded-full text-xs"
                >
                  <X className="size-3.5" />
                  Hủy sửa
                </Button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-border/60 bg-card p-6"
            >
              <div className="space-y-2">
                <Label htmlFor="recipeName">
                  Tên món ăn <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="recipeName"
                  value={form.recipeName}
                  onChange={(e) => setField('recipeName', e.target.value)}
                  placeholder="VD: Phở bò truyền thống"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Mô tả ngắn về món ăn..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cookingTime">Thời gian (phút)</Label>
                  <Input
                    id="cookingTime"
                    type="number"
                    min="0"
                    value={form.cookingTime}
                    onChange={(e) => setField('cookingTime', e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Độ khó</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => {
                      if (v) setField('difficulty', v)
                    }}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Chọn độ khó..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Danh mục</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => {
                      if (v) setField('categoryId', v)
                    }}
                  >
                    <SelectTrigger id="categoryId">
                      <SelectValue placeholder="Chọn danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
                        <SelectItem
                          key={c.categoryId}
                          value={String(c.categoryId)}
                        >
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servings">
                    <Users className="inline size-4 mr-1" />
                    Khẩu phần
                  </Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={form.servings}
                    onChange={(e) => setField('servings', e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => {
                      if (v) setField('status', v)
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Chọn trạng thái..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === 'approved' ? 'Đã duyệt' : s === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-medium flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="size-3.5 text-primary" />
                    Hình ảnh món ăn
                  </span>
                  <span className="text-[11px] text-muted-foreground">Tải từ máy hoặc nhập URL online</span>
                </Label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Tải từ máy */}
                  <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 text-center transition-colors hover:border-primary/50">
                    <Upload className="size-5 text-primary mb-1" />
                    <p className="text-xs font-medium text-foreground">Chọn ảnh từ máy</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminImageFile}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>

                  {/* Nhập URL online */}
                  <div>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                      onChange={(e) => setField('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="rounded-xl text-xs h-16"
                    />
                  </div>
                </div>

                {form.imageUrl && (
                  <div className="relative overflow-hidden rounded-xl border border-primary/30 max-h-40">
                    <img
                      src={form.imageUrl}
                      alt="Xem trước món ăn"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>



              {/* Nguyên liệu */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Nguyên liệu</Label>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {ingredients.filter(i => i.name).length} nguyên liệu
                  </span>
                </div>
                {ingredients.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const next = [...ingredients]
                        next[i] = { ...next[i], name: e.target.value }
                        setIngredients(next)
                      }}
                      placeholder="Nguyên liệu (VD: Thịt bò)"
                      className="flex-1"
                    />
                    <Input
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...ingredients]
                        next[i] = { ...next[i], quantity: e.target.value }
                        setIngredients(next)
                      }}
                      placeholder="Gam (VD: 50g)"
                      className="w-36 sm:w-40 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Minus className="size-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients([...ingredients, { name: '', quantity: '' }])}
                  className="rounded-full text-xs"
                >
                  <Plus className="size-3.5" />
                  Thêm nguyên liệu
                </Button>
              </div>

              {/* Các bước nấu */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Các bước nấu</Label>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {steps.filter(s => s.trim()).length} bước
                  </span>
                </div>
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <Textarea
                      value={step}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = e.target.value
                        setSteps(next)
                      }}
                      placeholder={`Bước ${i + 1}...`}
                      className="min-h-[60px] flex-1 resize-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                      className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Minus className="size-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSteps([...steps, ''])}
                  className="rounded-full text-xs"
                >
                  <Plus className="size-3.5" />
                  Thêm bước
                </Button>
              </div>

              {/* Chất dinh dưỡng tự động tính */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-serif text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Zap className="size-4 text-amber-500" />
                    Dinh dưỡng tự động tính (Cho 1 khẩu phần):
                  </Label>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {nutrition.calories || '0'} kcal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                  <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Đạm (Protein)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{nutrition.protein || '0g'}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Tinh bột (Carbs)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{nutrition.carbs || '0g'}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Chất béo (Fat)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{nutrition.fat || '0g'}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium">Chất xơ (Fiber)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{nutrition.fiber || '0g'}</p>
                  </div>
                </div>
              </div>

              {/* Tùy chỉnh chất dinh dưỡng */}
              <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">
                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs mr-2">N</span>
                    Chất dinh dưỡng (Có thể tùy chỉnh thủ công nếu muốn)
                  </Label>
                  {(nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat || nutrition.fiber) && (
                    <span className="text-[10px] text-muted-foreground">Đã nhập {[nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.fiber].filter(Boolean).length}/5 mục</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Calories (kcal)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={nutrition.calories}
                      onChange={(e) => setNutrition({ ...nutrition, calories: e.target.value })}
                      placeholder="Nhập số kcal..."
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Protein</Label>
                    <Input
                      value={nutrition.protein}
                      onChange={(e) => setNutrition({ ...nutrition, protein: e.target.value })}
                      placeholder="VD: 25g"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Carbs</Label>
                    <Input
                      value={nutrition.carbs}
                      onChange={(e) => setNutrition({ ...nutrition, carbs: e.target.value })}
                      placeholder="VD: 50g"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Chất béo (Fat)</Label>
                    <Input
                      value={nutrition.fat}
                      onChange={(e) => setNutrition({ ...nutrition, fat: e.target.value })}
                      placeholder="VD: 15g"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Chất xơ (Fiber)</Label>
                    <Input
                      value={nutrition.fiber}
                      onChange={(e) => setNutrition({ ...nutrition, fiber: e.target.value })}
                      placeholder="VD: 3g"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-full"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : editingRecipeId ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {editingRecipeId ? 'Cập nhật món ăn' : 'Thêm món ăn'}
              </Button>
            </form>
          </div>

          {/* Recipe list */}
          <div>
            <div className="mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Utensils className="size-4" />
                </span>
                <h2 className="font-serif text-xl font-semibold">
                  Danh sách món ăn
                </h2>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                {recipes?.length ?? 0} món
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 520 }}>
              {recipes?.map((r) => (
                <div
                  key={r.recipeId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
                    editingRecipeId === r.recipeId
                      ? "border-primary/60 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/30 hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => loadRecipeForEdit(r.recipeId)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.imageUrl || recipeFallbackImage(r.recipeId)}
                      alt={r.recipeName}
                      className="size-14 shrink-0 rounded-lg object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src =
                          recipeFallbackImage(r.recipeId)
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.recipeName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {r.cookingTime ? <span>{r.cookingTime} phút</span> : null}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/recipe/${r.recipeId}`}
                    className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Xem
                  </Link>
                  <button
                    onClick={() => loadRecipeForEdit(r.recipeId)}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Sửa món ăn"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(r.recipeId)}
                    disabled={deletingId === r.recipeId}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    aria-label="Xóa món ăn"
                  >
                    {deletingId === r.recipeId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>
              ))}
              {!recipes && (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments tab */}
      {tab === 'comments' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">
              Quản lý bình luận
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {allComments?.length ?? 0} bình luận
            </span>
          </div>

          {!allComments ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : allComments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              <MessageSquare className="mx-auto size-8" />
              <p className="mt-3 text-sm">Không có bình luận nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allComments.map((c, i) => {
                const isEditing = editingId === c.commentId
                return (
                  <div
                    key={c.commentId ?? i}
                    className="rounded-xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm">
                            {c.fullName || `User #${c.userId}`}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            Món #{c.recipeId}
                          </span>
                          {c.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[60px] resize-none rounded-xl text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="rounded-full h-7 text-xs"
                                onClick={() => handleEditSave(c.commentId!)}
                              >
                                <CheckCircle2 className="size-3" />
                                Lưu
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-full h-7 text-xs"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="size-3" />
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {c.content}
                          </p>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(c.commentId!)
                              setEditText(c.content)
                            }}
                            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Chỉnh sửa"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.commentId!)}
                            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                            aria-label="Thu hồi"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">
              Quản lý người dùng
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {users?.length ?? 0} người dùng
            </span>
          </div>

          {!users ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">Tên</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Vai trò</th>
                    <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={String(u.userId)}
                      className="border-b border-border/40 transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        #{u.userId}
                      </td>
                      <td className="px-4 py-3 font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            u.role === 'Admin'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-secondary text-muted-foreground',
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'Admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.userId)}
                            className="flex ml-auto size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                            aria-label="Xóa người dùng"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bad Words tab */}
      {tab === 'badwords' && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Add bad word */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Plus className="size-4" />
              </span>
              <h2 className="font-serif text-xl font-semibold">
                Thêm từ ngữ
              </h2>
            </div>

            <div className="flex gap-2">
              <Input
                value={newBadWord}
                onChange={(e) => setNewBadWord(e.target.value)}
                placeholder="Nhập từ ngữ cần chặn..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddBadWord()
                }}
              />
              <Button
                onClick={handleAddBadWord}
                disabled={!newBadWord.trim()}
                className="shrink-0 rounded-full"
              >
                <Plus className="size-4" />
                Thêm
              </Button>
            </div>
          </div>

          {/* Bad words list */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Flag className="size-4" />
                </span>
                <h2 className="font-serif text-xl font-semibold">
                  Danh sách từ ngữ
                </h2>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                {badWords?.length ?? 0} từ
              </span>
            </div>

            <div className="space-y-2">
              {badWords?.map((bw) => {
                const isEditing = editingBadWordId === bw.badWordId
                return (
                  <div
                    key={bw.badWordId}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3"
                  >
                    {isEditing ? (
                      <>
                        <Input
                          value={editingBadWordText}
                          onChange={(e) => setEditingBadWordText(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleEditBadWordSave(bw.badWordId!)
                          }}
                        />
                        <Button
                          size="sm"
                          className="rounded-full h-7 text-xs"
                          onClick={() => handleEditBadWordSave(bw.badWordId!)}
                        >
                          <CheckCircle2 className="size-3" />
                          Lưu
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full h-7 text-xs"
                          onClick={() => setEditingBadWordId(null)}
                        >
                          <X className="size-3" />
                          Hủy
                        </Button>
                      </>
                    ) : (
                      <>
                        <Flag className="size-4 shrink-0 text-destructive" />
                        <span className="flex-1 font-medium">{bw.word}</span>
                        <button
                          onClick={() => {
                            setEditingBadWordId(bw.badWordId!)
                            setEditingBadWordText(bw.word)
                          }}
                          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="Chỉnh sửa"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBadWord(bw.badWordId!)}
                          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                          aria-label="Xóa"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
              {(!badWords || badWords.length === 0) && (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                  <Flag className="mx-auto size-8" />
                  <p className="mt-3 text-sm">Chưa có từ ngữ nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulate tab */}
      {tab === 'simulate' && (
        <SimulatePanel />
      )}

      {/* Approval tab */}
      {tab === 'approval' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">
              Duyệt món ăn chia sẻ
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {pendingRecipes?.length ?? 0} chờ duyệt
            </span>
          </div>

          {!pendingRecipes ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRecipes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
              <Check className="mx-auto size-8" />
              <p className="mt-3 text-sm">
                Không có món ăn nào chờ duyệt.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRecipes.map((r) => (
                <div
                  key={r.recipeId}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.imageUrl || recipeFallbackImage(r.recipeId)}
                        alt={r.recipeName}
                        className="size-16 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src =
                            recipeFallbackImage(r.recipeId)
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.recipeName}</p>
                        {r.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {r.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {r.cookingTime ? (
                            <span>{r.cookingTime} phút</span>
                          ) : null}
                          {r.userId ? (
                            <span>Người dùng #{r.userId}</span>
                          ) : null}
                          {r.difficulty ? <span>{r.difficulty}</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-full h-8 text-xs"
                        onClick={() => handleApprove(r.recipeId)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full h-8 text-xs text-destructive border-destructive/40 hover:bg-destructive/15"
                        onClick={() => handleReject(r.recipeId)}
                      >
                        <Ban className="size-3.5" />
                        Từ chối
                      </Button>
                      <button
                        onClick={() => handleDeleteRecipe(r.recipeId)}
                        disabled={deletingId === r.recipeId}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                        aria-label="Xóa"
                      >
                        {deletingId === r.recipeId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
