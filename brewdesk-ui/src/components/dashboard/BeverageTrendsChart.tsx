'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  orders: {
    label: 'Cups Served',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

const defaultBeverageData = [
  { time: '09:00', orders: 12 },
  { time: '10:00', orders: 28 },
  { time: '11:00', orders: 45 },
  { time: '12:00', orders: 18 },
  { time: '14:00', orders: 22 },
  { time: '15:00', orders: 54 },
  { time: '16:00', orders: 38 },
  { time: '17:00', orders: 15 },
]

interface BeverageTrendsChartProps {
  data?: typeof defaultBeverageData
  title?: string
  description?: string
  className?: string
}

export function BeverageTrendsChart({
  data = defaultBeverageData,
  title = 'Pantry Demand by Hour',
  description = 'Peak order volumes during morning & afternoon beverage rounds',
  className,
}: BeverageTrendsChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="orders"
              type="natural"
              fill="url(#fillOrders)"
              fillOpacity={0.4}
              stroke="var(--color-orders)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
