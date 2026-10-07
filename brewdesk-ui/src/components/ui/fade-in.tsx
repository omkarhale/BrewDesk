'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface FadeInProps {
  delay?: number
  duration?: number
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  children: React.ReactNode
  id?: string
  style?: React.CSSProperties
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.35,
  distance = 12,
  direction = 'up',
  className,
  id,
  style,
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <div id={id} style={style} className={className}>
        {children}
      </div>
    )
  }

  const initialY = direction === 'up' ? distance : direction === 'down' ? -distance : 0
  const initialX = direction === 'left' ? distance : direction === 'right' ? -distance : 0

  return (
    <motion.div
      id={id}
      style={style}
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
