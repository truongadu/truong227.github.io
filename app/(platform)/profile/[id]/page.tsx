import { Suspense } from 'react'
import ProfileClient from '../profile-client'

export const dynamic = 'force-dynamic'

export default function UserProfileDynamicPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-center text-xs text-muted-foreground">Đang tải...</div>}>
      <ProfileClient />
    </Suspense>
  )
}
