/**
 * Encodes a user ID into a clean string for URL profile links.
 * Example: userId = 10 -> "10"
 */
export function encodeUserId(userId: number | string): string {
  if (!userId) return ''
  return String(userId)
}

/**
 * Decodes an encoded hash back to numeric string or raw user ID.
 */
export function decodeUserId(hash: string): string {
  if (!hash) return ''
  if (/^\d+$/.test(hash)) return hash
  try {
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) base64 += '='
    const decoded = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
    const match = decoded.match(/facecook_id_(.+)$/)
    if (match) return match[1]
    return hash
  } catch {
    return hash
  }
}

/**
 * Encodes a post/status ID into a clean string for status URL links.
 * Example: postId = 9001 -> "9001"
 */
export function encodePostId(postId: number | string): string {
  if (!postId) return ''
  return String(postId)
}

/**
 * Decodes an encoded post hash back to numeric string or raw post ID.
 */
export function decodePostId(hash: string): string {
  if (!hash) return ''
  if (/^\d+$/.test(hash)) return hash
  try {
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4 !== 0) base64 += '='
    const decoded = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('utf-8')
    const match = decoded.match(/facecook_post_(.+)$/)
    if (match) return match[1]
    return hash
  } catch {
    return hash
  }
}
