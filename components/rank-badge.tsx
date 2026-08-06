'use client'

import { cn } from '@/lib/utils'
import { getMembershipRank, type MembershipRank } from '@/lib/api'
import { Sprout, Leaf, Star, Sparkles, Crown } from 'lucide-react'

const RANK_STYLES: Record<
  MembershipRank,
  { bg: string; text: string; ring: string }
> = {
  dong: {
    bg: 'bg-[#cd7f32]/15',
    text: 'text-[#8B4513]',
    ring: 'ring-[#cd7f32]/50',
  },
  bac: {
    bg: 'bg-[#c0c0c0]/15',
    text: 'text-[#696969]',
    ring: 'ring-[#c0c0c0]/50',
  },
  vang: {
    bg: 'bg-[#ffd700]/15',
    text: 'text-[#B8860B]',
    ring: 'ring-[#ffd700]/60',
  },
  bachkim: {
    bg: 'bg-[#3b82f6]/15',
    text: 'text-[#1e40af]',
    ring: 'ring-[#3b82f6]/60',
  },
  kimcuong: {
    bg: 'bg-[#a855f7]/20',
    text: 'text-[#6b21a8]',
    ring: 'ring-[#a855f7]/70',
  },
}

const RankIconComponent = ({ rank }: { rank: MembershipRank }) => {
  switch (rank) {
    case 'dong':
      return <Sprout className="size-3.5" />
    case 'bac':
      return <Leaf className="size-3.5" />
    case 'vang':
      return <Star className="size-3.5 fill-amber-500 text-amber-500" />
    case 'bachkim':
      return <Sparkles className="size-3.5 text-blue-500" />
    case 'kimcuong':
      return <Crown className="size-3.5 text-purple-500" />
  }
}

interface RankBadgeProps {
  totalLikes: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function RankBadge({
  totalLikes,
  size = 'sm',
  showLabel = true,
  className,
}: RankBadgeProps) {
  const rank = getMembershipRank(totalLikes)
  const styles = RANK_STYLES[rank.rank]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold ring-1',
        styles.bg,
        styles.text,
        styles.ring,
        sizeClasses[size],
        className,
      )}
      aria-label={`Hạng thành viên: ${rank.label}`}
    >
      <RankIconComponent rank={rank.rank} />
      {showLabel && <span>{rank.label}</span>}
    </span>
  )
}

interface RankAvatarFrameProps {
  totalLikes: number
  children: React.ReactNode
  className?: string
}

export function RankAvatarFrame({
  totalLikes,
  children,
  className,
}: RankAvatarFrameProps) {
  const rank = getMembershipRank(totalLikes)

  const frameStyles: Record<MembershipRank, string> = {
    dong: 'ring-2 ring-[#cd7f32] shadow-[0_0_10px_#cd7f3250]',
    bac: 'ring-2 ring-[#c0c0c0] shadow-[0_0_10px_#c0c0c050]',
    vang: 'ring-2 ring-[#ffd700] shadow-[0_0_14px_#ffd70060]',
    bachkim:
      'ring-2 ring-[#3b82f6] shadow-[0_0_18px_#3b82f670] ring-offset-1 ring-offset-background',
    kimcuong:
      'ring-2 ring-[#a855f7] shadow-[0_0_22px_#a855f780] ring-offset-2 ring-offset-background',
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <div className={cn('rounded-full', frameStyles[rank.rank])}>
        {children}
      </div>
    </div>
  )
}

interface RankProgressProps {
  totalLikes: number
}

export function RankProgress({ totalLikes }: RankProgressProps) {
  const rank = getMembershipRank(totalLikes)
  const RANKS = [
    { rank: 'dong', label: 'Đồng', min: 0 },
    { rank: 'bac', label: 'Bạc', min: 10 },
    { rank: 'vang', label: 'Vàng', min: 50 },
    { rank: 'bachkim', label: 'Bạch Kim', min: 200 },
    { rank: 'kimcuong', label: 'Kim Cương', min: 500 },
  ] as const

  const currentIdx = RANKS.findIndex((r) => r.rank === rank.rank)
  const next = RANKS[currentIdx + 1]

  const progressPct = next
    ? Math.min(
        100,
        ((totalLikes - rank.minSales) / (next.min - rank.minSales)) * 100,
      )
    : 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <RankBadge totalLikes={totalLikes} size="sm" />
        {next ? (
          <span className="text-muted-foreground text-xs">
            {totalLikes}/{next.min} lượt yêu thích → <strong>{next.label}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#6b21a8]">
            Hạng cao nhất!
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: rank.gradient
              ? `linear-gradient(to right, ${rank.color}, ${rank.color}cc)`
              : rank.color,
          }}
        />
      </div>
    </div>
  )
}