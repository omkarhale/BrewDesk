'use client'

import { useState } from 'react'
import {
  Zap, RefreshCw, Loader2, CalendarDays, Users,
  TrendingUp, AlertCircle, ChevronDown, ChevronUp, Wallet, Plus, Minus,
} from 'lucide-react'
import { useAdminRunAccrual, useAdminRunAccrualRange, useAdminAdjustBalance, useAdminEmployeeBalances, useAdminLeaveTypes } from '@/hooks/useLeave'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── helpers ────────────────────────────────────────────────────────────────────
function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthsBefore(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Run Single Period Card ──────────────────────────────────────────────────────
function RunAccrualCard() {
  const [period, setPeriod] = useState(currentPeriod())
  const run = useAdminRunAccrual()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Run Monthly Accrual</CardTitle>
            <CardDescription className="text-[12px]">
              Credit 1.25 days of PL to all active employees for a specific month. Safe to rerun — already-accrued months are skipped.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[13px]">Period <span className="text-muted-foreground font-normal">(YYYY-MM)</span></Label>
          <Input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="text-[13px] w-48"
          />
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map(n => {
            const p = monthsBefore(n)
            return (
              <button key={p} type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-md border px-3 py-1 text-[12px] font-medium transition-colors',
                  period === p
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300'
                    : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted',
                )}>
                {n === 0 ? 'This month' : n === 1 ? 'Last month' : p}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => run.mutate(period)}
            disabled={run.isPending || !period}
            className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
          >
            {run.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" />Running…</>
              : <><Zap className="h-4 w-4" />Run Accrual for {period}</>
            }
          </Button>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10 px-3.5 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-blue-800 dark:text-blue-300">
              Idempotent — running the same period twice will not double-credit employees. Employees who joined after this period are automatically skipped.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Backfill Range Card ─────────────────────────────────────────────────────────
function BackfillCard() {
  const [from, setFrom] = useState(monthsBefore(5))
  const [to, setTo] = useState(currentPeriod())
  const runRange = useAdminRunAccrualRange()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Backfill Accrual Range</CardTitle>
            <CardDescription className="text-[12px]">
              Run accrual for multiple months at once. Useful for onboarding new employees or fixing missing periods.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">From</Label>
            <Input type="month" value={from} onChange={e => setFrom(e.target.value)} className="text-[13px]" max={to} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">To</Label>
            <Input type="month" value={to} onChange={e => setTo(e.target.value)} className="text-[13px]" min={from} max={currentPeriod()} />
          </div>
        </div>

        <Button
          onClick={() => runRange.mutate({ from, to })}
          disabled={runRange.isPending || !from || !to}
          variant="outline"
          className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300"
        >
          {runRange.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
            : <><RefreshCw className="h-4 w-4" />Backfill {from} → {to}</>
          }
        </Button>
      </CardContent>
    </Card>
  )
}

// ── Manual Balance Adjustment Card ─────────────────────────────────────────────
function AdjustBalanceCard() {
  const [empId, setEmpId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [showBalances, setShowBalances] = useState(false)

  const { data: employees = [] } = useEmployeesQuery()
  const { data: leaveTypes = [] } = useAdminLeaveTypes()
  const adjust = useAdminAdjustBalance()
  const { data: empBalances = [], isLoading: balLoading } = useAdminEmployeeBalances(Number(empId) || 0)

  const handleSubmit = async () => {
    if (!empId || !typeId || !amount) return
    await adjust.mutateAsync({
      employeeId: Number(empId),
      leaveTypeId: Number(typeId),
      amount: parseFloat(amount),
      reason,
    })
    setAmount('')
    setReason('')
  }

  const parsedAmount = parseFloat(amount)
  const isPositive = !isNaN(parsedAmount) && parsedAmount > 0
  const isNegative = !isNaN(parsedAmount) && parsedAmount < 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-[15px]">Manual Balance Adjustment</CardTitle>
            <CardDescription className="text-[12px]">
              Add or deduct days from an employee's leave balance. Use positive numbers to add, negative to deduct.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Employee</Label>
            <Select value={empId} onValueChange={v => { setEmpId(v); setShowBalances(false) }}>
              <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select employee…" /></SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.active).map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{e.employeeCode}</span>
                    {e.userName || e.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Leave Type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select leave type…" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.filter(t => t.active).map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{t.code}</span>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[13px]">
              Adjustment Days
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                (positive = add, negative = deduct)
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                isPositive ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-900/20'
                : isNegative ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20'
                : 'border-border bg-muted/30 text-muted-foreground',
              )}>
                {isNegative ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g. 5 or -2"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={cn(
                  'text-[13px]',
                  isPositive && 'border-emerald-400 focus-visible:ring-emerald-500',
                  isNegative && 'border-red-400 focus-visible:ring-red-500',
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              placeholder="HR note for audit trail…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="text-[13px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={adjust.isPending || !empId || !typeId || !amount || isNaN(parsedAmount)}
            className={cn(
              'gap-2',
              isNegative
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
            )}
          >
            {adjust.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" />Adjusting…</>
              : isNegative
                ? <><Minus className="h-4 w-4" />Deduct {Math.abs(parsedAmount) || ''} Days</>
                : <><Plus className="h-4 w-4" />Add {parsedAmount || ''} Days</>
            }
          </Button>

          {empId && (
            <button
              type="button"
              onClick={() => setShowBalances(v => !v)}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
            >
              {showBalances ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showBalances ? 'Hide' : 'View'} current balances
            </button>
          )}
        </div>

        {/* Current balances for selected employee */}
        {showBalances && empId && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2.5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Current Balances — {employees.find(e => String(e.id) === empId)?.userName}
              </p>
            </div>
            {balLoading ? (
              <div className="p-4 text-[13px] text-muted-foreground">Loading…</div>
            ) : empBalances.length === 0 ? (
              <div className="p-4 text-[13px] text-muted-foreground">No balances yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Type', 'Accrued', 'Adjusted', 'Used', 'Available'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empBalances.map(b => (
                    <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[12px] text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">{b.leaveTypeCode}</span>
                        <span className="ml-2 text-[13px]">{b.leaveTypeName}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{b.accrued.toFixed(2)}</td>
                      <td className={cn('px-4 py-2.5 text-[13px] font-medium', b.adjusted > 0 ? 'text-emerald-600' : b.adjusted < 0 ? 'text-red-500' : '')}>
                        {b.adjusted > 0 ? '+' : ''}{b.adjusted.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-amber-600">{b.used.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'font-bold text-[14px]',
                          b.available > 0 ? 'text-teal-600' : 'text-red-500'
                        )}>
                          {b.available.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function LeaveAccrualAdminPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-1">Accrual & Balance Management</h1>
          <p className="text-teal-100 text-base">
            Trigger monthly PL accrual, backfill past periods, and manually adjust employee leave balances.
          </p>
        </div>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {/* Info banner */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: TrendingUp, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/10', title: 'PL Accrual', desc: '1.25 days credited per month per eligible employee' },
          { icon: CalendarDays, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/10', title: 'Joining Date Based', desc: 'Accrual starts from the employee\'s joining date, prorated in first month' },
          { icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10', title: 'Idempotent', desc: 'Running the same period twice never double-credits anyone' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.title} className={cn('rounded-xl p-4 flex items-start gap-3', item.color.split(' ').slice(1).join(' '))}>
              <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', item.color.split(' ')[0])} />
              <div>
                <p className="text-[13px] font-semibold">{item.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cards */}
      <RunAccrualCard />
      <BackfillCard />
      <AdjustBalanceCard />
    </div>
  )
}
