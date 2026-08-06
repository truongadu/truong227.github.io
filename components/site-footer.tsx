import Link from 'next/link'
import { ChefHat } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ChefHat className="size-4" />
            </span>
            <span className="font-serif text-lg font-bold">Facecook</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Trang chủ
            </Link>
            <Link href="/recipes" className="transition-colors hover:text-foreground">
              Món ăn
            </Link>
            <Link href="/favorites" className="transition-colors hover:text-foreground">
              Yêu thích
            </Link>
            <Link href="/profile" className="transition-colors hover:text-foreground">
              Hồ sơ
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Facecook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
