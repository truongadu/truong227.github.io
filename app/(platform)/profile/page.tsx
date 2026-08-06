'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'

export const dynamic = 'force-dynamic'

export default function ProfileRedirectPage() {
  const router = useRouter()
  const { userId, ready } = useAuth()

  useEffect(() => {
    if (ready) {
      const activeId = userId ? String(userId) : '1'
      router.replace(`/profile/${activeId}`)
    }
  }, [ready, userId, router])

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center text-xs text-muted-foreground">
      Đang chuyển hướng đến trang hồ sơ...
    </div>
  )
}
