import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        urgent: 'bg-red-100 text-red-700',
        high: 'bg-orange-100 text-orange-700',
        medium: 'bg-blue-100 text-blue-700',
        low: 'bg-gray-100 text-gray-600',
        backlog: 'bg-gray-100 text-gray-600 border border-gray-300',
        todo: 'bg-gray-100 text-gray-700 border border-gray-300',
        'in-progress': 'bg-blue-600 text-white',
        review: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
        done: 'bg-emerald-600 text-white',
        cancelled: 'bg-gray-200 text-gray-500',
        open: 'bg-emerald-100 text-emerald-700',
        default: 'bg-[#e6e7f2] text-[#424754]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
