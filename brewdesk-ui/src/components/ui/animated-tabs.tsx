'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface AnimatedTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  layoutId?: string
  className?: string
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onChange,
  layoutId = 'active-tab-indicator',
  className,
}: AnimatedTabsProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 text-muted-foreground',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'text-foreground font-semibold shadow-xs'
                : 'hover:text-foreground text-muted-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', bounce: 0.15, duration: 0.4 }
                }
                className="absolute inset-0 z-[-1] rounded-lg bg-background shadow-xs border border-border/80"
              />
            )}
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
