import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  colorClass?: string
  isLoading?: boolean
}

export function StatCard({ title, value, icon: Icon, description, colorClass = 'text-amber-600', isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-32 mt-3" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {description && (
          <p className="mt-3 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
