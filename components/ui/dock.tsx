"use client"

import React, { type PropsWithChildren } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string
  iconSize?: number
  iconMagnification?: number
  disableMagnification?: boolean
  iconDistance?: number
  direction?: "top" | "middle" | "bottom"
  children: React.ReactNode
}

const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto flex h-[48px] w-max items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-background/70 p-1.5 backdrop-blur-md shadow-sm"
)

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      direction = "middle",
      iconSize,
      iconMagnification,
      disableMagnification,
      iconDistance,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {children}
      </div>
    )
  }
)

Dock.displayName = "Dock"

export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  className?: string
  children?: React.ReactNode
  props?: PropsWithChildren
}

const DockIcon = ({
  size,
  className,
  children,
  ...props
}: DockIconProps) => {
  return (
    <div
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 select-none hover:bg-secondary text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center size-full">{children}</div>
    </div>
  )
}

DockIcon.displayName = "DockIcon"

export { Dock, DockIcon, dockVariants }
