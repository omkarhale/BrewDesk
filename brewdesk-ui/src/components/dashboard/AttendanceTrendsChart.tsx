'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  present: {
    label: 'Present',
    color: 'hsl(var(--primary))',
  },
  late: {
    label: 'Late Arrival',
    color: 'hsl(var(--chart-3))',
  },
  onLeave: {
    label: 'On Leave',
    color: 'hsl(var(--chart-2))',
  },
  absent: {
    label: 'Absent',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig

// Sample weekly operational attendance data
const defaultData = [
  { day: 'Mon', present: 42, late: 4, onLeave: 2, absent: 1 },
  { day: 'Tue', present: 45, late: 2, onLeave: 2, absent: 0 },
  { day: 'Wed', present: 44, late: 3, onLeave: 1, absent: 1 },
  { day: 'Thu', present: 46, late: 1, onLeave: 2, absent: 0 },
  { day: 'Fri', present: 41, late: 5, onLeave: 3, absent: 0 },
]

interface AttendanceTrendsChartProps {
  data?: typeof defaultData
  title?: string
  description?: string
  className?: string
}

export function AttendanceTrendsChart({
  data = defaultData,
  title = 'Weekly Attendance Distribution',
  description = 'Attendance statuses recorded over the past 5 work days',
  className,
}: AttendanceTrendsChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="present"
              stackId="a"
              fill="var(--color-present)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="late"
              stackId="a"
              fill="var(--color-late)"
            />
            <Bar
              dataKey="onLeave"
              stackId="a"
              fill="var(--color-onLeave)"
            />
            <Bar
              dataKey="absent"
              stackId="a"
              fill="var(--color-absent)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
