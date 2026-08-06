'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { register } from '@/lib/api'
import { AuthShell } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setLoading(true)
    const res = await register({ fullName, email, password })
    setLoading(false)
    if (res.ok) {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      router.push('/login')
    } else {
      toast.error(res.message || 'Đăng ký thất bại')
    }
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Tham gia cộng đồng ẩm thực Facecook."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </>
      }
    >
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="pl-10"
            />
          </div>
        </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="pl-10"
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Tạo tài khoản
        </Button>
      </form>
    </AuthShell>
  )
}
