'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { login } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Vui lòng nhập email và mật khẩu')
      return
    }
    setLoading(true)
    const res = await login({ email, password })
    setLoading(false)
    if (res.ok && res.data) {
      signIn({ ...res.data, email: res.data.email || email })
      toast.success('Đăng nhập thành công')
      router.push('/recipes')
    } else {
      toast.error(res.message || 'Sai email hoặc mật khẩu')
    }
  }

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng trở lại với Facecook."
    
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Đăng ký ngay
          </Link>
        </>
      }
    >
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>
    </AuthShell>
  )
}
