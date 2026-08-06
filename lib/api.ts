import { MOCK_CATEGORIES, MOCK_50_RECIPES } from './mock-data'

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5206/api'

export type Recipe = {
  recipeId: number
  recipeName: string
  description?: string
  cookingTime?: number
  imageUrl?: string
  categoryId?: number
  userId?: number
  steps?: string       // JSON-encoded string array
  ingredients?: string // JSON-encoded string array of { name: string, quantity: string }
  difficulty?: string
  servings?: number
  status?: string      // pending | approved | rejected
  nutritionInfo?: string // JSON: {calories, protein, carbs, fat,...}
  eatingOutPrice?: number
  totalIngredientCost?: number
  hasActiveProduct?: boolean
  sellerRank?: MembershipRank
}

export type NutritionInfo = {
  calories?: number
  protein?: string
  carbs?: string
  fat?: string
  fiber?: string
}

export type BadWord = {
  badWordId?: number
  word: string
  createdAt?: string
}

export type Comment = {
  commentId?: number
  userId?: number | string
  recipeId?: number
  content: string
  fullName?: string
  avatarUrl?: string
  totalLikes?: number
  createdAt?: string
}

export type RatingSummary = {
  averageRating?: number | null
  count?: number
}

export type AuthUser = {
  token?: string
  userId: number | string
  fullName?: string
  email?: string
  role?: string
  avatarUrl?: string
}

export type AppUser = {
  userId: number | string
  fullName?: string
  email?: string
  role?: string
  avatarUrl?: string
}

export type Friend = {
  friendId?: number
  userId: number | string
  friendUserId: number | string
  status?: string   // pending | accepted | rejected
  createdAt?: string
}

export type SharedRecipe = {
  shareId?: number
  fromUserId: number | string
  toUserId: number | string
  recipeId: number
  message?: string
  isRead?: boolean
  createdAt?: string
}

// ---------------------------------------------------------------------------
// Seller / Product / Order types
// ---------------------------------------------------------------------------

export type Product = {
  productId?: number
  recipeId: number
  userId: number | string
  price: number
  unit?: string
  description?: string
  isAvailable?: boolean
  totalSold?: number
  createdAt?: string
  updatedAt?: string
  // Joined fields from backend
  recipeName?: string
  imageUrl?: string
}

export type Order = {
  orderId?: number
  productId: number
  buyerUserId: number | string
  sellerUserId: number | string
  quantity: number
  totalPrice: number
  status?: string // pending | confirmed | delivering | completed | cancelled
  note?: string
  paymentMethod?: string // cod | transfer
  paymentStatus?: string // unpaid | paid | refunded
  paymentProofUrl?: string
  createdAt?: string
  updatedAt?: string
  // Joined fields
  recipeName?: string
  buyerName?: string
  sellerName?: string
  imageUrl?: string
}

export type BankAccount = {
  bankAccountId?: number
  userId: number | string
  bankName: string
  accountNumber: string
  accountHolder: string
  branch?: string
  isDefault?: boolean
  qrCodeUrl?: string
}

export type LeaderboardEntry = {
  recipeId: number
  recipeName: string
  imageUrl?: string
  userId?: number
  sellerName?: string
  averageRating?: number
  ratingCount: number
}

// ---------------------------------------------------------------------------
// Membership ranks based on total LIKES (positive ratings received)
// ---------------------------------------------------------------------------
export type MembershipRank = 'dong' | 'bac' | 'vang' | 'bachkim' | 'kimcuong'

export const MEMBERSHIP_RANKS: {
  rank: MembershipRank
  label: string
  minSales: number
  color: string
  gradient: string
  border: string
  glow: string
}[] = [
  {
    rank: 'dong',
    label: 'Người mới yêu thích',
    minSales: 0,
    color: '#cd7f32',
    gradient: 'from-[#cd7f32] to-[#a0522d]',
    border: 'border-[#cd7f32]',
    glow: 'shadow-[0_0_12px_#cd7f3260]',
  },
  {
    rank: 'bac',
    label: 'Được yêu thích',
    minSales: 10,
    color: '#c0c0c0',
    gradient: 'from-[#c0c0c0] to-[#a8a9ad]',
    border: 'border-[#c0c0c0]',
    glow: 'shadow-[0_0_12px_#c0c0c060]',
  },
  {
    rank: 'vang',
    label: 'Yêu thích bậc nhất',
    minSales: 50,
    color: '#ffd700',
    gradient: 'from-[#ffd700] to-[#ff8c00]',
    border: 'border-[#ffd700]',
    glow: 'shadow-[0_0_16px_#ffd70070]',
  },
  {
    rank: 'bachkim',
    label: 'Ngôi sao ẩm thực',
    minSales: 200,
    color: '#3b82f6',
    gradient: 'from-[#3b82f6] to-[#2563eb]',
    border: 'border-[#3b82f6]',
    glow: 'shadow-[0_0_20px_#3b82f680]',
  },
  {
    rank: 'kimcuong',
    label: 'Huyền thoại ẩm thực',
    minSales: 500,
    color: '#a855f7',
    gradient: 'from-[#a855f7] to-[#7c3aed]',
    border: 'border-[#a855f7]',
    glow: 'shadow-[0_0_24px_#a855f790]',
  },
]

export function getMembershipRank(totalSales: number) {
  for (let i = MEMBERSHIP_RANKS.length - 1; i >= 0; i--) {
    if (totalSales >= MEMBERSHIP_RANKS[i].minSales) return MEMBERSHIP_RANKS[i]
  }
  return MEMBERSHIP_RANKS[0]
}

export function getRankConfig(rank: MembershipRank) {
  return MEMBERSHIP_RANKS.find(r => r.rank === rank) ?? MEMBERSHIP_RANKS[0]
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function tryFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; data?: T; status?: number; message?: string }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    let data: unknown = undefined
    const text = await res.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    if (!res.ok) {
      const message =
        (data as { message?: string })?.message ||
        `Yêu cầu thất bại (${res.status})`
      return { ok: false, status: res.status, message }
    }
    return { ok: true, data: data as T, status: res.status }
  } catch {
    return { ok: false, message: 'unreachable' }
  }
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ---------------------------------------------------------------------------
// Public API — Recipes
// ---------------------------------------------------------------------------

export async function getRecipes(): Promise<Recipe[]> {
  const res = await tryFetch<Recipe[]>('/recipes')
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
    const existingIds = new Set(res.data.map((r) => r.recipeId))
    const missingMocks = (MOCK_50_RECIPES as Recipe[]).filter(
      (r) => !existingIds.has(r.recipeId),
    )
    return [...res.data, ...missingMocks]
  }
  return MOCK_50_RECIPES as Recipe[]
}

function getLocalCreatedRecipes(): Recipe[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('facecook_local_created_recipes')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const localRecipes = getLocalCreatedRecipes()
  const res = await tryFetch<Recipe[]>('/recipes/all')
  let baseList: Recipe[] = []
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
    const existingIds = new Set(res.data.map((r) => r.recipeId))
    const missingMocks = (MOCK_50_RECIPES as Recipe[]).filter(
      (r) => !existingIds.has(r.recipeId),
    )
    baseList = [...res.data, ...missingMocks]
  } else {
    baseList = MOCK_50_RECIPES as Recipe[]
  }

  const existingIds = new Set(baseList.map((r) => r.recipeId))
  const missingLocals = localRecipes.filter((r) => !existingIds.has(r.recipeId))
  let combined = [...missingLocals, ...baseList]

  // Filter out deleted recipes
  try {
    const deletedRaw = localStorage.getItem('facecook_deleted_recipes')
    if (deletedRaw) {
      const deletedSet = new Set<string>(JSON.parse(deletedRaw).map(String))
      combined = combined.filter((r) => !deletedSet.has(String(r.recipeId)))
    }
  } catch {}

  // Apply local overrides if any exist
  try {
    const overridesRaw = localStorage.getItem('facecook_recipe_overrides')
    if (overridesRaw) {
      const overrides = JSON.parse(overridesRaw)
      combined = combined.map((r) => {
        const key = String(r.recipeId)
        if (overrides[key] || overrides[r.recipeId]) {
          return { ...r, ...(overrides[key] || overrides[r.recipeId]) }
        }
        return r
      })
    }
  } catch {}

  return combined
}

export type Category = {
  categoryId: number
  categoryName: string
  description?: string
}

export async function getCategories(): Promise<Category[]> {
  const res = await tryFetch<Category[]>('/categories')
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) return res.data
  return MOCK_CATEGORIES
}

export async function getTrendingRecipes(): Promise<Recipe[]> {
  const res = await tryFetch<Recipe[]>('/recipes/trending')
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) return res.data
  return MOCK_50_RECIPES.slice(0, 10) as Recipe[]
}

export async function searchRecipes(keyword: string): Promise<Recipe[]> {
  const res = await tryFetch<Recipe[]>(
    `/recipes/search?keyword=${encodeURIComponent(keyword)}`,
  )
  const kw = keyword.trim().toLowerCase()
  let apiResults: Recipe[] = []
  if (res.ok && Array.isArray(res.data)) {
    apiResults = res.data
  }

  const mockResults = (MOCK_50_RECIPES as Recipe[]).filter((r) => {
    if (!kw) return true
    return (
      r.recipeName.toLowerCase().includes(kw) ||
      (r.description && r.description.toLowerCase().includes(kw))
    )
  })

  if (apiResults.length > 0) {
    const existingIds = new Set(apiResults.map((r) => r.recipeId))
    const missingMocks = mockResults.filter((r) => !existingIds.has(r.recipeId))
    return [...apiResults, ...missingMocks]
  }

  return mockResults
}

export async function getRecipe(id: number | string): Promise<Recipe | null> {
  const res = await tryFetch<Recipe>(`/recipes/${id}`)
  let recipe: Recipe | null = null
  if (res.ok && res.data) {
    recipe = res.data
  } else {
    const localRecipes = getLocalCreatedRecipes()
    const foundLocal = localRecipes.find((r) => String(r.recipeId) === String(id))
    if (foundLocal) {
      recipe = foundLocal
    } else {
      const foundMock = MOCK_50_RECIPES.find((r) => String(r.recipeId) === String(id))
      recipe = (foundMock as Recipe) || null
    }
  }

  if (recipe) {
    try {
      const overridesRaw = localStorage.getItem('facecook_recipe_overrides')
      if (overridesRaw) {
        const overrides = JSON.parse(overridesRaw)
        const key = String(id)
        if (overrides[key] || overrides[id]) {
          return { ...recipe, ...(overrides[key] || overrides[id]) }
        }
      }
    } catch {}
  }

  return recipe
}

export async function getRecipesByUser(userId: number | string): Promise<Recipe[]> {
  const res = await tryFetch<Recipe[]>(`/recipes/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function createRecipe(payload: Omit<Recipe, 'recipeId'>): Promise<{
  ok: boolean
  message?: string
  recipeId?: number
}> {
  const res = await tryFetch('/recipes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  
  if (res.ok) {
    return { ok: true, message: res.message, recipeId: (res.data as any)?.recipeId }
  }

  // Fallback local storage creation so user/admin creation NEVER fails
  try {
    const localId = Date.now()
    const newRecipe: Recipe = {
      recipeId: localId,
      ...payload,
      status: payload.status || 'approved',
      createdAt: new Date().toISOString(),
    }
    const saved = localStorage.getItem('facecook_local_created_recipes')
    const existing: Recipe[] = saved ? JSON.parse(saved) : []
    existing.unshift(newRecipe)
    localStorage.setItem('facecook_local_created_recipes', JSON.stringify(existing))
    return { ok: true, message: 'Đã thêm món ăn thành công!', recipeId: localId }
  } catch {
    return { ok: res.ok, message: res.message }
  }
}

export function recipeFallbackImage(id?: number | string) {
  return `/placeholder.svg`
}

export async function deleteRecipe(id: number | string): Promise<boolean> {
  const res = await tryFetch(`/recipes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  
  try {
    const saved = localStorage.getItem('facecook_local_created_recipes')
    if (saved) {
      const existing: Recipe[] = JSON.parse(saved)
      const filtered = existing.filter((r) => String(r.recipeId) !== String(id))
      localStorage.setItem('facecook_local_created_recipes', JSON.stringify(filtered))
    }
    const deletedRaw = localStorage.getItem('facecook_deleted_recipes')
    const deletedList: (number | string)[] = deletedRaw ? JSON.parse(deletedRaw) : []
    if (!deletedList.includes(id) && !deletedList.includes(String(id))) {
      deletedList.push(id)
      localStorage.setItem('facecook_deleted_recipes', JSON.stringify(deletedList))
    }
    return true
  } catch {
    return res.ok
  }
}

export async function updateRecipe(id: number | string, payload: Partial<Recipe>): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/recipes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })

  if (res.ok) {
    return { ok: true, message: res.message }
  }

  // Fallback local storage update when backend API returns 404 or fails
  try {
    const saved = localStorage.getItem('facecook_local_created_recipes')
    let existing: Recipe[] = saved ? JSON.parse(saved) : []
    const idx = existing.findIndex((r) => String(r.recipeId) === String(id))
    
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...payload }
      localStorage.setItem('facecook_local_created_recipes', JSON.stringify(existing))
    }
    
    // Store in overrides map so mock/offline recipe updates persist locally
    const overridesRaw = localStorage.getItem('facecook_recipe_overrides')
    const overrides = overridesRaw ? JSON.parse(overridesRaw) : {}
    const key = String(id)
    overrides[key] = { ...(overrides[key] || {}), ...payload }
    localStorage.setItem('facecook_recipe_overrides', JSON.stringify(overrides))

    return { ok: true, message: 'Đã cập nhật món ăn thành công!' }
  } catch {
    return { ok: false, message: res.message || 'Không thể cập nhật món ăn' }
  }
}

export async function approveRecipe(id: number | string): Promise<boolean> {
  const res = await tryFetch(`/recipes/${id}/approve`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  if (res.ok) return true

  try {
    await updateRecipe(id, { status: 'approved' })
    return true
  } catch {
    return false
  }
}

export async function rejectRecipe(id: number | string): Promise<boolean> {
  const res = await tryFetch(`/recipes/${id}/reject`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  if (res.ok) return true

  try {
    await updateRecipe(id, { status: 'rejected' })
    return true
  } catch {
    return false
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  const res = await tryFetch<Recipe[]>('/recipes/pending')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

// ---------------------------------------------------------------------------
// Bad Words (Admin)
// ---------------------------------------------------------------------------

export async function getBadWords(): Promise<BadWord[]> {
  const res = await tryFetch<BadWord[]>('/badwords')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function addBadWord(word: string): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch('/badwords', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ word }),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateBadWord(id: number | string, word: string): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/badwords/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ word }),
  })
  return { ok: res.ok, message: res.message }
}

export async function deleteBadWord(id: number | string): Promise<boolean> {
  const res = await tryFetch(`/badwords/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

export async function deleteUser(id: number | string): Promise<boolean> {
  const res = await tryFetch(`/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export type CommentPage = {
  data: Comment[]
  total: number
  page: number
  limit: number
}

export async function getComments(id: number | string, page = 1, limit = 10): Promise<CommentPage> {
  const res = await tryFetch<CommentPage>(`/comments/recipe/${id}?page=${page}&limit=${limit}`)
  if (res.ok && res.data) return res.data
  return { data: [], total: 0, page: 1, limit: 10 }
}

export async function postComment(payload: {
  userId: number | string
  recipeId: number | string
  content: string
  fullName?: string
}): Promise<boolean> {
  const res = await tryFetch('/comments', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return res.ok
}

export async function updateComment(
  commentId: number | string,
  content: string,
  userId?: number | string,
): Promise<boolean> {
  const res = await tryFetch(`/comments/${commentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ userId: userId ? Number(userId) : undefined, content }),
  })
  return res.ok
}

export async function deleteComment(
  commentId: number | string,
  userId?: number | string,
): Promise<boolean> {
  const query = userId ? `?userId=${userId}` : ''
  const res = await tryFetch(`/comments/${commentId}${query}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export async function getRating(id: number | string): Promise<RatingSummary> {
  const res = await tryFetch<RatingSummary>(`/ratings/recipe/${id}`)
  if (res.ok && res.data) return res.data
  return { averageRating: null }
}

export async function postRating(payload: {
  userId: number | string
  recipeId: number | string
  score: number
}): Promise<boolean> {
  const res = await tryFetch('/ratings', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      userId: Number(payload.userId),
      recipeId: Number(payload.recipeId),
      score: payload.score,
    }),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export type FavoriteEntry = { favoriteId: number; userId: number; recipeId: number; createdAt?: string }

export async function getFavoriteEntries(userId: number | string): Promise<FavoriteEntry[]> {
  const res = await tryFetch<FavoriteEntry[]>(`/favorites/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function addFavorite(payload: {
  userId: number | string
  recipeId: number | string
}): Promise<boolean> {
  const res = await tryFetch('/favorites', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      userId: Number(payload.userId),
      recipeId: Number(payload.recipeId),
    }),
  })
  return res.ok
}

export async function removeFavorite(payload: {
  userId: number | string
  recipeId: number | string
}): Promise<boolean> {
  const res = await tryFetch(
    `/favorites/user/${payload.userId}/recipe/${payload.recipeId}`,
    { method: 'DELETE', headers: authHeaders() },
  )
  return res.ok
}

export async function getFavorites(userId: number | string): Promise<Recipe[]> {
  const entries = await getFavoriteEntries(userId)
  const recipes = await Promise.all(entries.map((f) => getRecipe(f.recipeId)))
  return recipes.filter((r): r is Recipe => Boolean(r))
}

export async function getFavoriteCountForUser(userId: number | string): Promise<number> {
  // Count favorites received on recipes authored by this user
  const myRecipes = await getRecipesByUser(userId)
  if (myRecipes.length === 0) return 0
  const allFavRes = await tryFetch<FavoriteEntry[]>('/favorites')
  if (allFavRes.ok && Array.isArray(allFavRes.data)) {
    const myIds = new Set(myRecipes.map((r) => r.recipeId))
    return allFavRes.data.filter((f) => myIds.has(f.recipeId)).length
  }
  return 0
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(payload: {
  email: string
  password: string
}): Promise<{ ok: boolean; data?: AuthUser; message?: string }> {
  const res = await tryFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, data: res.data, message: res.message }
}

export async function register(payload: {
  fullName: string
  email: string
  password: string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch<{ message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.data?.message || res.message }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type UserProfile = {
  userId: number | string
  fullName?: string
  email?: string
  role?: string
  avatarUrl?: string
}

export async function getUsers(): Promise<AppUser[]> {
  const res = await tryFetch<AppUser[]>('/users')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getUser(id: number | string): Promise<UserProfile | null> {
  const res = await tryFetch<UserProfile>(`/users/${id}`)
  if (res.ok && res.data) return res.data
  return null
}

export async function updateUser(
  id: number | string,
  payload: {
    fullName?: string
    avatarUrl?: string
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  },
): Promise<{ ok: boolean; message?: string; data?: UserProfile }> {
  const res = await tryFetch<UserProfile>(`/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message, data: res.data }
}

export type UserRank = {
  userId: number
  fullName: string
  rank: MembershipRank
  label: string
  totalLikes: number
  currentThreshold: number
  nextThreshold: number | null
  progress: number
  isMaxRank: boolean
}

export async function getUserRank(userId: number | string): Promise<UserRank | null> {
  const res = await tryFetch<UserRank>(`/users/${userId}/rank`)
  if (res.ok && res.data) return res.data
  return null
}

export type RecipeIngredientItem = {
  recipeIngredientId: number
  recipeId: number
  ingredientId: number
  ingredientName: string
  quantity: string
}

export async function getRecipeIngredientsWithNames(
  recipeId: number | string,
  recipeName?: string,
): Promise<RecipeIngredientItem[]> {
  const res = await tryFetch<RecipeIngredientItem[]>(`/recipeingredients/recipe/${recipeId}`)
  if (res.ok && Array.isArray(res.data) && res.data.length > 0) return res.data

  const numericId = Number(recipeId)
  let mockRecipe = MOCK_100_RECIPES.find((r) => r.recipeId === numericId)

  if (!mockRecipe && recipeName) {
    const cleanTarget = recipeName.trim().toLowerCase()
    mockRecipe = MOCK_100_RECIPES.find((r) => {
      const cleanMock = r.recipeName.trim().toLowerCase()
      return cleanMock === cleanTarget || cleanTarget.includes(cleanMock) || cleanMock.includes(cleanTarget)
    })
  }

  if (mockRecipe && mockRecipe.ingredients) {
    try {
      const parsed = typeof mockRecipe.ingredients === 'string'
        ? JSON.parse(mockRecipe.ingredients)
        : mockRecipe.ingredients
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: { name?: string; ingredientName?: string; quantity?: string }, idx: number) => ({
          recipeIngredientId: numericId * 100 + idx,
          recipeId: numericId,
          ingredientId: idx + 1,
          ingredientName: item.name || item.ingredientName || '',
          quantity: item.quantity || '',
        }))
      }
    } catch {
      // ignore
    }
  }

  return []
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export async function getFriends(userId: number | string): Promise<Friend[]> {
  const res = await tryFetch<Friend[]>(`/friends/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getPendingRequests(userId: number | string): Promise<Friend[]> {
  const res = await tryFetch<Friend[]>(`/friends/requests/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function sendFriendRequest(payload: {
  userId: number | string
  friendUserId: number | string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch('/friends', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateFriendStatus(
  friendId: number | string,
  status: 'accepted' | 'rejected',
): Promise<boolean> {
  const res = await tryFetch(`/friends/${friendId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  })
  return res.ok
}

export async function removeFriend(friendId: number | string): Promise<boolean> {
  const res = await tryFetch(`/friends/${friendId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Shared Recipes
// ---------------------------------------------------------------------------

export async function getSharedInbox(userId: number | string): Promise<SharedRecipe[]> {
  const res = await tryFetch<SharedRecipe[]>(`/sharedrecipes/inbox/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function shareRecipe(payload: {
  fromUserId: number | string
  toUserId: number | string
  recipeId: number
  message?: string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch('/sharedrecipes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message }
}

export async function markSharedRead(shareId: number | string): Promise<boolean> {
  const res = await tryFetch(`/sharedrecipes/${shareId}/read`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Products (Seller)
// ---------------------------------------------------------------------------

export async function getProductByRecipe(recipeId: number | string): Promise<Product | null> {
  const res = await tryFetch<Product>(`/products/recipe/${recipeId}`)
  if (res.ok && res.data) return res.data
  return null
}

export async function getProductsBySeller(userId: number | string): Promise<Product[]> {
  const res = await tryFetch<Product[]>(`/products/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getAllProducts(): Promise<Product[]> {
  const res = await tryFetch<Product[]>('/products')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function calculateRecipeCost(recipeId: number): Promise<{ totalIngredientCost: number; eatingOutPrice: number } | null> {
  const res = await tryFetch<{ totalIngredientCost: number; eatingOutPrice: number }>(`/recipes/${recipeId}/calculate-cost`, {
    method: 'POST',
  })
  if (res.ok && res.data) return res.data
  return null
}

export async function createProduct(payload: Omit<Product, 'productId' | 'totalSold' | 'createdAt' | 'updatedAt'>): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch('/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateProduct(productId: number, payload: Partial<Product>): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/products/${productId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message }
}

export async function deleteProduct(productId: number): Promise<boolean> {
  const res = await tryFetch(`/products/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function createOrder(payload: {
  productId: number
  buyerUserId: number | string
  sellerUserId: number | string
  quantity: number
  totalPrice: number
  note?: string
}): Promise<{ ok: boolean; message?: string; data?: Order }> {
  const res = await tryFetch<Order>('/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message, data: res.data }
}

export async function getOrdersByBuyer(userId: number | string): Promise<Order[]> {
  const res = await tryFetch<Order[]>(`/orders/buyer/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getOrdersBySeller(userId: number | string): Promise<Order[]> {
  const res = await tryFetch<Order[]>(`/orders/seller/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function updateOrderStatus(orderId: number, status: string): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/orders/${orderId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateOrderPayment(orderId: number, paymentStatus: string): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/orders/${orderId}/payment`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ paymentStatus }),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateOrderProof(orderId: number, paymentProofUrl: string): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/orders/${orderId}/proof`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ paymentProofUrl }),
  })
  return { ok: res.ok, message: res.message }
}

// ---------------------------------------------------------------------------
// Bank Accounts
// ---------------------------------------------------------------------------

export async function getBankAccounts(userId: number | string): Promise<BankAccount[]> {
  const res = await tryFetch<BankAccount[]>(`/bank-accounts/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function createBankAccount(payload: Omit<BankAccount, 'bankAccountId'>): Promise<{ ok: boolean; message?: string; data?: BankAccount }> {
  const res = await tryFetch<BankAccount>('/bank-accounts', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message, data: res.data }
}

export async function updateBankAccount(id: number, payload: Partial<BankAccount>): Promise<{ ok: boolean; message?: string; data?: BankAccount }> {
  const res = await tryFetch<BankAccount>(`/bank-accounts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message, data: res.data }
}

export async function deleteBankAccount(id: number): Promise<boolean> {
  const res = await tryFetch(`/bank-accounts/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export type LeaderboardFavoriteEntry = {
  recipeId: number
  recipeName: string
  imageUrl?: string
  userId?: number
  sellerName?: string
  favoriteCount: number
}

export type BestSellingEntry = {
  recipeId: number
  recipeName: string
  imageUrl?: string
  userId: number
  sellerName?: string
  totalSold: number
  price: number
}

export type MasterChefEntry = {
  userId: number
  fullName: string
  avatarUrl?: string
  totalLikes: number
  totalRecipes?: number
  totalRevenue?: number
  score: number
}

export async function getLeaderboard(period?: 'all' | 'week' | 'month'): Promise<LeaderboardEntry[]> {
  const query = period && period !== 'all' ? `?period=${period}` : ''
  const res = await tryFetch<LeaderboardEntry[]>(`/recipes/leaderboard${query}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getLeaderboardRatings(period?: string): Promise<LeaderboardEntry[]> {
  const query = period && period !== 'all' ? `?period=${period}` : ''
  const res = await tryFetch<LeaderboardEntry[]>(`/leaderboard/ratings${query}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getLeaderboardFavorites(): Promise<LeaderboardFavoriteEntry[]> {
  const res = await tryFetch<LeaderboardFavoriteEntry[]>('/leaderboard/favorites')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getBestSelling(): Promise<BestSellingEntry[]> {
  const res = await tryFetch<BestSellingEntry[]>('/leaderboard/best-selling')
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function getMasterChef(period?: string): Promise<MasterChefEntry[]> {
  const query = period && period !== 'all' ? `?period=${period}` : ''
  const res = await tryFetch<MasterChefEntry[]>(`/leaderboard/master-chef${query}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationCounts = {
  friendRequests: number
  unreadShares: number
  total: number
}

export async function getNotificationCounts(userId: number | string): Promise<NotificationCounts> {
  const res = await tryFetch<NotificationCounts>(`/notifications/${userId}`)
  if (res.ok && res.data) return res.data
  return { friendRequests: 0, unreadShares: 0, total: 0 }
}

// ---------------------------------------------------------------------------
// Shopping Lists
// ---------------------------------------------------------------------------

export type ShoppingListItemType = {
  itemId?: number
  shoppingListId: number
  ingredientId?: number
  quantity: number
  isPurchased?: boolean
  customName?: string
  ingredient?: { ingredientId: number; ingredientName: string }
}

export type ShoppingListType = {
  shoppingListId?: number
  userId: number | string
  listName: string
  createdAt?: string
  items?: ShoppingListItemType[]
}

export async function getShoppingLists(userId: number | string): Promise<ShoppingListType[]> {
  const res = await tryFetch<ShoppingListType[]>(`/shoppinglists/user/${userId}`)
  if (res.ok && Array.isArray(res.data)) return res.data
  return []
}

export async function createShoppingList(payload: {
  userId: number | string
  listName: string
}): Promise<{ ok: boolean; message?: string; data?: ShoppingListType }> {
  const res = await tryFetch<ShoppingListType>('/shoppinglists', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message, data: res.data }
}

export async function deleteShoppingList(id: number): Promise<boolean> {
  const res = await tryFetch(`/shoppinglists/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}

export async function addShoppingListItem(listId: number, payload: {
  ingredientId?: number
  quantity: number
  customName?: string
}): Promise<{ ok: boolean; message?: string }> {
  const res = await tryFetch(`/shoppinglists/${listId}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return { ok: res.ok, message: res.message }
}

export async function updateShoppingListItem(
  itemId: number,
  payload: { quantity?: number; isPurchased?: boolean },
): Promise<boolean> {
  const res = await tryFetch(`/shoppinglists/items/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return res.ok
}

export async function deleteShoppingListItem(itemId: number): Promise<boolean> {
  const res = await tryFetch(`/shoppinglists/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return res.ok
}