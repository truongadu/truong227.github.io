import { type Recipe, type AppUser } from '@/lib/api'
import { getVietnameseOrForeignName } from '@/lib/name-generator'
import { recipeFallbackImage } from '@/lib/api'

export interface SocialPost {
  id: number
  authorId?: number | string
  authorName: string
  authorAvatar?: string
  authorLikes?: number
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
  isRecipeArticle?: boolean
  isUserCreated?: boolean
}

const userLikesCacheMap = new Map<string, number>()

/**
 * Calculates total interaction likes count for any user ID by summing
 * the actual likes received across all posts authored by that user.
 */
export function getUserTotalLikes(
  userId: number | string,
  allPosts?: SocialPost[],
): number {
  if (!userId) return 0
  const strId = String(userId)

  if (allPosts && allPosts.length > 0) {
    const userPosts = getPostsForUser(userId, allPosts)
    const total = userPosts.reduce((sum, p) => sum + (p.initialLikes || 0), 0)
    userLikesCacheMap.set(strId, total)
    return total
  }

  if (userLikesCacheMap.has(strId)) {
    return userLikesCacheMap.get(strId)!
  }

  return 0
}

/**
 * Builds synchronized & shuffled social feed posts linked with database users.
 */
export function getSynchronizedFeedPosts(
  recipes: Recipe[] = [],
  allUsers: AppUser[] = [],
  userPosts: SocialPost[] = [],
): SocialPost[] {
  const userCount = allUsers.length > 0 ? allUsers.length : 1523

  const recipePosts: SocialPost[] = recipes.map((r, index) => {
    // Deterministic pseudo-random shuffle to distribute posts realistically across 1,523 database users
    const shuffledIndex = Math.abs((r.recipeId * 47 + index * 19 + 13) % userCount)
    const dbUser = allUsers.length > 0 ? allUsers[shuffledIndex] : undefined

    const authorId = r.userId || dbUser?.userId || (shuffledIndex + 1)
    const authorName = dbUser?.fullName || getVietnameseOrForeignName(authorId, (r as { sellerName?: string }).sellerName)
    const authorAvatar = dbUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorId}`

    // Realistic likes count received on this post (8 to 35 likes)
    const initialLikes = Math.abs((r.recipeId * 13 + 7) % 28) + 8

    return {
      id: r.recipeId,
      authorId,
      authorName,
      authorAvatar,
      timeAgo: 'Bài đăng cộng đồng',
      content: r.description || `Chia sẻ công thức món ${r.recipeName} thơm ngon khó cưỡng!`,
      imageUrl: r.imageUrl || recipeFallbackImage(r.recipeId),
      attachedRecipeId: r.recipeId,
      recipeName: r.recipeName,
      cookingTime: r.cookingTime,
      initialLikes,
      isRecipeArticle: true,
    }
  })

  const postMap = new Map<number, SocialPost>()
  if (Array.isArray(userPosts)) {
    userPosts.forEach((p) => {
      if (p && typeof p === 'object' && p.id) {
        postMap.set(p.id, p)
      }
    })
  }
  if (Array.isArray(recipePosts)) {
    recipePosts.forEach((p) => {
      if (p && typeof p === 'object' && p.id && !postMap.has(p.id)) {
        postMap.set(p.id, p)
      }
    })
  }
  const allFeedPosts = Array.from(postMap.values())

  // Update authorLikes for each post based on total accumulated likes of all their posts
  return allFeedPosts.map((p) => {
    const authorTotalLikes = getUserTotalLikes(p.authorId || 1, allFeedPosts)
    return {
      ...p,
      authorLikes: authorTotalLikes,
    }
  })
}

/**
 * Filters all feed posts for a specific user ID for Profile page.
 */
export function getPostsForUser(
  targetUserId: number | string,
  allPosts: SocialPost[],
): SocialPost[] {
  if (!targetUserId) return []
  const strId = String(targetUserId)
  return allPosts.filter((p) => String(p.authorId) === strId)
}
