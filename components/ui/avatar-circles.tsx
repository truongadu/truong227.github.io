"use client"

import { cn } from "@/lib/utils"

export interface AvatarItem {
  imageUrl: string
  profileUrl: string
  name?: string
}

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: AvatarItem[]
  onClick?: () => void
}

export const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
  onClick,
}: AvatarCirclesProps) => {
  return (
    <div
      onClick={onClick}
      className={cn("z-10 flex -space-x-2.5 rtl:space-x-reverse items-center cursor-pointer group", className)}
    >
      {avatarUrls.map((url, index) => (
        <span
          key={index}
          className="relative inline-block"
        >
          <img
            className="h-7 w-7 rounded-full border-2 border-background object-cover bg-secondary"
            src={url.imageUrl}
            width={28}
            height={28}
            alt={url.name || `Avatar ${index + 1}`}
          />
        </span>
      ))}
      {(numPeople ?? 0) > 0 && (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-center text-[10px] font-bold text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          +{numPeople}
        </span>
      )}
    </div>
  )
}
