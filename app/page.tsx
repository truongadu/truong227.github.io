import Link from 'next/link'
import { ArrowRight, ChefHat, Heart, PlusCircle, Star, Utensils } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RecipeGrid } from '@/components/recipe-grid'

const FEATURES = [
  {
    icon: Utensils,
    title: 'Công thức tuyển chọn',
    desc: 'Những món ăn tinh tế từ ẩm thực thế giới, hướng dẫn rõ ràng từng bước.',
  },
  {
    icon: Star,
    title: 'Đánh giá thực tế',
    desc: 'Xếp hạng sao và bình luận từ cộng đồng giúp bạn chọn món hoàn hảo.',
  },
  {
    icon: Heart,
    title: 'Lưu món yêu thích',
    desc: 'Tạo bộ sưu tập riêng và truy cập lại công thức bạn yêu thích bất cứ lúc nào.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-dish.png" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 md:py-32 lg:px-8 lg:py-40">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <ChefHat className="size-4" />
            Nghệ thuật ẩm thực tại gia
          </span>
          <h1 className="max-w-2xl font-serif text-4xl font-bold leading-tight text-balance sm:text-5xl md:text-6xl">
            Nấu nên những bữa ăn đáng nhớ
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Khám phá bộ sưu tập công thức nấu ăn được tuyển chọn kỹ lưỡng, đánh
            giá món ăn, lưu lại yêu thích và chia sẻ cảm hứng cùng cộng đồng đam
            mê ẩm thực.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/recipes" className={buttonVariants({ size: 'lg', className: 'rounded-full px-8' })}>
              Khám phá món ăn
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/submit" className={buttonVariants({ size: 'lg', variant: 'outline', className: 'rounded-full px-8' })}>
              <PlusCircle className="size-4" />
              Đăng công thức
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card p-7"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-6" />
              </span>
              <h3 className="mt-5 font-serif text-xl font-semibold">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured recipes */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Thực đơn nổi bật
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
              Món ăn được yêu thích
            </h2>
          </div>
          <Link href="/recipes" className={buttonVariants({ variant: 'ghost', className: 'hidden sm:inline-flex' })}>
            Xem tất cả
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <RecipeGrid showSearch={false} limit={6} sortByLikes={true} />
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/recipes" className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
            Xem tất cả món ăn
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
