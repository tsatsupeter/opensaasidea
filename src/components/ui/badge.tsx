import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand/10 text-brand border border-brand/20',
        accent: 'bg-accent/10 text-accent border border-accent/20',
        secondary: 'bg-surface-2 text-text-secondary border border-border',
        success: 'bg-emerald/10 text-emerald border border-emerald/20',
        warning: 'bg-amber/10 text-amber border border-amber/20',
        error: 'bg-rose/10 text-rose border border-rose/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
