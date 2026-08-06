'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SharedPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile?tab=products')
  }, [router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Đang chuyển đến Sản phẩm trong Hồ sơ...</p>
    </div>
  )
}
