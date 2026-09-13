'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, X, Loader2, Tag } from 'lucide-react'
import { useAdminLeaveTypes, useAdminCreateLeaveType, useAdminUpdateLeaveType, useAdminToggleLeaveType } from '@/hooks/useLeave'
import { leaveTypeSchema, LeaveTypeFormValues } from '@/schemas/leave.schema'
import { LeaveType } from '@/types/leave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Form ──────────────────────────────────────────────────────────────────────
function LeaveTypeForm({ editing, onClose }: { editing?: LeaveType; onClose: () => void }) {
  const create = useAdminCreateLeaveType()
  const update = useAdminUpdateLeaveType()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: editing ? {
      code: editing.code, name: editing.name, description: editing.description ?? '',
      paid: editing.paid, genderEligibility: editing.genderEligibility,
      accrualFrequency: editing.accrualFrequency, accrualAmount: editing.accrualAmount,
      yearlyAllocation: editing.yearlyAllocation, halfDayAllowed: editing.halfDayAllowed,
      carryForwardEnabled: editing.carryForwardEnabled, carryForwardLimit: editing.carryForwardLimit,
      documentRequired: editing.documentRequired,
    } : {
      paid: true, genderEligibility: 'ALL', accrualFrequency: 'NONE',
      accrualAmount: 0, yearlyAllocation: 0, halfDayAllowed: true,
      carryForwardEnabled: false, carryForwardLimit: 0, documentRequired: false,
    },
  })

  const onSubmit = async (data: LeaveTypeFormValues) => {
    if (editing) { await update.mutateAsync({ id: editing.id, req: data }) }
    else { await create.mutateAsync(data) }
    onClose()
  }

  const isPending = create.isPending || update.isPending
  const accrualFreq = watch('accrualFrequency')

  const BoolRow = ({ label, field }: { label: string; field: keyof LeaveTypeFormValues }) => (
    <div className="flex items-center justify-between">
      <Label className="text-[13px]">{label}</Label>
      <Switch checked={!!watch(field as any)} onCheckedChange={v => setValue(field as any, v)} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lt-code">Code <span className="text-destructive">*</span></Label>
          <Input id="lt-code" {...register('code')} placeholder="e.g. PL" className="font-mono uppercase text-[13px]" disabled={!!editing} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lt-name">Name <span className="text-destructive">*</span></Label>
          <Input id="lt-name" {...register('name')} placeholder="e.g. Privilege Leave" className="text-[13px]" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea rows={2} {...register('description')}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Optional description…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Gender Eligibility</Label>
          <Select value={watch('genderEligibility')} onValueChange={v => setValue('genderEligibility', v as any)}>
            <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['ALL','MALE','FEMALE','OTHER'] as const).map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Accrual Frequency</Label>
          <Select value={watch('accrualFrequency')} onValueChange={v => setValue('accrualFrequency', v as any)}>
            <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['NONE','MONTHLY','YEARLY'] as const).map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {accrualFreq === 'MONTHLY' && (
        <div className="space-y-1.5">
          <Label htmlFor="accrualAmount">Monthly Accrual Amount (days)</Label>
          <Input id="accrualAmount" type="number" step="0.01" {...register('accrualAmount', { valueAsNumber: true })} className="text-[13px]" placeholder="1.25" />
          {errors.accrualAmount && <p className="text-xs text-destructive">{errors.accrualAmount.message}</p>}
        </div>
      )}
      {accrualFreq === 'YEARLY' && (
        <div className="space-y-1.5">
          <Label htmlFor="yearlyAlloc">Yearly Allocation (days)</Label>
          <Input id="yearlyAlloc" type="number" step="0.5" {...register('yearlyAllocation', { valueAsNumber: true })} className="text-[13px]" placeholder="12" />
          {errors.yearlyAllocation && <p className="text-xs text-destructive">{errors.yearlyAllocation.message}</p>}
        </div>
      )}

      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Policy Flags</p>
        <BoolRow label="Paid Leave" field="paid" />
        <BoolRow label="Half-Day Allowed" field="halfDayAllowed" />
        <BoolRow label="Document Required" field="documentRequired" />
        <BoolRow label="Carry Forward" field="carryForwardEnabled" />
        {watch('carryForwardEnabled') && (
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="cfLimit">Carry Forward Limit (days)</Label>
            <Input id="cfLimit" type="number" step="0.5" {...register('carryForwardLimit', { valueAsNumber: true })} className="text-[13px]" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="h-8 text-[13px]">Cancel</Button>
        <Button type="submit" disabled={isPending} className="h-8 gap-1.5 text-[13px]">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {editing ? 'Save Changes' : 'Create Leave Type'}
        </Button>
      </div>
    </form>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
function TypeRow({ lt, onEdit }: { lt: LeaveType; onEdit: (lt: LeaveType) => void }) {
  const toggle = useAdminToggleLeaveType()
  return (
    <tr className="border-t border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-[13px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded">{lt.code}</span>
      </td>
      <td className="px-4 py-3 text-[13px] font-medium">{lt.name}</td>
      <td className="px-4 py-3 text-[12px] text-muted-foreground">{lt.genderEligibility}</td>
      <td className="px-4 py-3 text-[12px]">
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
          lt.paid ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800')}>
          {lt.paid ? 'Paid' : 'Unpaid'}
        </span>
      </td>
      <td className="px-4 py-3 text-[12px] text-muted-foreground">{lt.accrualFrequency === 'MONTHLY' ? `${lt.accrualAmount}/mo` : lt.accrualFrequency === 'YEARLY' ? `${lt.yearlyAllocation}/yr` : '—'}</td>
      <td className="px-4 py-3">
        <Switch checked={lt.active} onCheckedChange={v => toggle.mutate({ id: lt.id, active: v })} disabled={toggle.isPending} />
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(lt)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminLeaveTypesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<LeaveType | undefined>()
  const { data: types = [], isLoading } = useAdminLeaveTypes()

  const openCreate = () => { setEditing(undefined); setShowForm(true) }
  const openEdit   = (lt: LeaveType) => { setEditing(lt); setShowForm(true) }
  const close      = () => { setShowForm(false); setEditing(undefined) }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Leave Types</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Configure leave categories, eligibility, accrual and carry-forward rules.</p>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-[13px]">
          <Plus className="h-3.5 w-3.5" /> New Leave Type
        </Button>
      </div>

      {showForm && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
            <CardTitle className="text-[15px]">{editing ? `Edit — ${editing.name}` : 'New Leave Type'}</CardTitle>
            <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
          </CardHeader>
          <CardContent className="p-5">
            <LeaveTypeForm editing={editing} onClose={close} />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {['Code','Name','Gender','Paid','Accrual','Active',''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    </tr>
                  ))
                : types.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                      No leave types configured. <button className="text-teal-600 underline" onClick={openCreate}>Create the first one.</button>
                    </td></tr>
                  : types.map(lt => <TypeRow key={lt.id} lt={lt} onEdit={openEdit} />)
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
