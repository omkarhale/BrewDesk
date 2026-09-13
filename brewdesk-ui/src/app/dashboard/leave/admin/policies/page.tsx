'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X, Loader2, Building2, Trash2, Pencil } from 'lucide-react'
import {
  useAdminLeavePolicies, useAdminCreateLeavePolicy, useAdminUpdateLeavePolicy,
  useAdminToggleLeavePolicy, useAdminAssignDepartment, useAdminRemoveDepartment,
  useAdminLeaveTypes,
} from '@/hooks/useLeave'
import { leavePolicySchema, LeavePolicyFormValues } from '@/schemas/leave.schema'
import { LeavePolicy } from '@/types/leave'
import { useEmployeesQuery } from '@/hooks/useEmployeeManagement'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getDepartments } from '@/api/attendance'
import { useQuery } from '@tanstack/react-query'

function useDepartments() {
  return useQuery({ queryKey: ['attendance', 'departments'], queryFn: getDepartments })
}

// ── Policy Form ───────────────────────────────────────────────────────────────
function PolicyForm({ editing, onClose }: { editing?: LeavePolicy; onClose: () => void }) {
  const create = useAdminCreateLeavePolicy()
  const update = useAdminUpdateLeavePolicy()
  const { data: leaveTypes = [] } = useAdminLeaveTypes()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LeavePolicyFormValues>({
    resolver: zodResolver(leavePolicySchema),
    defaultValues: editing ? {
      leaveTypeId: editing.leaveTypeId, policyName: editing.policyName,
      accrualStartRule: editing.accrualStartRule, minimumNoticeDays: editing.minimumNoticeDays,
      maximumConsecutiveDays: editing.maximumConsecutiveDays, backdatedAllowed: editing.backdatedAllowed,
      cancellationAllowed: editing.cancellationAllowed, approvalRequired: editing.approvalRequired,
      effectiveFrom: editing.effectiveFrom ?? '', effectiveTo: editing.effectiveTo ?? '',
    } : {
      accrualStartRule: 'JOINING_DATE', minimumNoticeDays: 0, maximumConsecutiveDays: 30,
      backdatedAllowed: false, cancellationAllowed: true, approvalRequired: true,
    },
  })

  const onSubmit = async (data: LeavePolicyFormValues) => {
    const payload = { ...data, effectiveFrom: data.effectiveFrom || null, effectiveTo: data.effectiveTo || null }
    if (editing) { await update.mutateAsync({ id: editing.id, req: payload as any }) }
    else { await create.mutateAsync(payload as any) }
    onClose()
  }

  const isPending = create.isPending || update.isPending
  const BoolRow = ({ label, field }: { label: string; field: keyof LeavePolicyFormValues }) => (
    <div className="flex items-center justify-between">
      <Label className="text-[13px]">{label}</Label>
      <Switch checked={!!watch(field as any)} onCheckedChange={v => setValue(field as any, v)} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Leave Type <span className="text-destructive">*</span></Label>
          <Select value={watch('leaveTypeId') ? String(watch('leaveTypeId')) : ''}
            onValueChange={v => setValue('leaveTypeId', Number(v), { shouldValidate: true })}>
            <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select leave type" /></SelectTrigger>
            <SelectContent>
              {leaveTypes.map(lt => (
                <SelectItem key={lt.id} value={String(lt.id)}>
                  <span className="font-mono mr-2 text-xs text-muted-foreground">{lt.code}</span>{lt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leaveTypeId && <p className="text-xs text-destructive">{errors.leaveTypeId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="policyName">Policy Name <span className="text-destructive">*</span></Label>
          <Input id="policyName" {...register('policyName')} placeholder="e.g. Engineering PL Policy" className="text-[13px]" />
          {errors.policyName && <p className="text-xs text-destructive">{errors.policyName.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Accrual Start Rule</Label>
          <Select value={watch('accrualStartRule')} onValueChange={v => setValue('accrualStartRule', v as any)}>
            <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="JOINING_DATE">Joining Date</SelectItem>
              <SelectItem value="CALENDAR_YEAR">Calendar Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minNotice">Min Notice Days</Label>
          <Input id="minNotice" type="number" min={0} {...register('minimumNoticeDays', { valueAsNumber: true })} className="text-[13px]" />
          {errors.minimumNoticeDays && <p className="text-xs text-destructive">{errors.minimumNoticeDays.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxConsec">Max Consecutive Days</Label>
          <Input id="maxConsec" type="number" min={1} {...register('maximumConsecutiveDays', { valueAsNumber: true })} className="text-[13px]" />
          {errors.maximumConsecutiveDays && <p className="text-xs text-destructive">{errors.maximumConsecutiveDays.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="effFrom">Effective From</Label>
          <Input id="effFrom" type="date" {...register('effectiveFrom')} className="text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effTo">Effective To</Label>
          <Input id="effTo" type="date" {...register('effectiveTo')} className="text-[13px]" />
          {errors.effectiveTo && <p className="text-xs text-destructive">{errors.effectiveTo.message}</p>}
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Rules</p>
        <BoolRow label="Backdated Requests Allowed" field="backdatedAllowed" />
        <BoolRow label="Cancellation Allowed" field="cancellationAllowed" />
        <BoolRow label="Approval Required" field="approvalRequired" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="h-8 text-[13px]">Cancel</Button>
        <Button type="submit" disabled={isPending} className="h-8 gap-1.5 text-[13px]">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {editing ? 'Save Changes' : 'Create Policy'}
        </Button>
      </div>
    </form>
  )
}

// ── Policy Card ───────────────────────────────────────────────────────────────
function PolicyCard({ policy, onEdit }: { policy: LeavePolicy; onEdit: (p: LeavePolicy) => void }) {
  const toggle = useAdminToggleLeavePolicy()
  const assign = useAdminAssignDepartment()
  const remove = useAdminRemoveDepartment()
  const { data: departments = [] } = useDepartments()

  const [deptId, setDeptId] = useState('')

  const unassigned = departments.filter(d => !policy.departments.some(pd => pd.departmentId === d.id))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-[15px]">{policy.policyName}</CardTitle>
              <span className="font-mono text-[11px] text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-0.5 rounded">{policy.leaveTypeCode}</span>
              <span className={cn('text-[11px] rounded-full px-2 py-0.5 font-semibold',
                policy.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800')}>
                {policy.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <CardDescription className="text-[12px] mt-0.5">{policy.leaveTypeName}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(policy)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Switch checked={policy.active} onCheckedChange={v => toggle.mutate({ id: policy.id, active: v })} disabled={toggle.isPending} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Rules summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px]">
          {[
            ['Min Notice', `${policy.minimumNoticeDays}d`],
            ['Max Consecutive', `${policy.maximumConsecutiveDays}d`],
            ['Accrual Start', policy.accrualStartRule === 'JOINING_DATE' ? 'Joining Date' : 'Calendar Year'],
            ['Backdated', policy.backdatedAllowed ? '✓ Yes' : '✗ No'],
            ['Cancellation', policy.cancellationAllowed ? '✓ Yes' : '✗ No'],
            ['Approval', policy.approvalRequired ? '✓ Required' : 'Auto'],
          ].map(([label, value]) => (
            <div key={label} className="bg-muted/30 rounded-md px-2.5 py-1.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wide">{label}</p>
              <p className="font-medium mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Departments */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Assigned Departments
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {policy.departments.length === 0
              ? <p className="text-[12px] text-muted-foreground italic">No departments assigned</p>
              : policy.departments.map(d => (
                  <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[12px] px-2.5 py-0.5">
                    {d.departmentName}
                    <button onClick={() => remove.mutate({ policyId: policy.id, departmentId: d.departmentId })}
                      className="ml-1 hover:text-red-500 transition-colors" disabled={remove.isPending}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))
            }
          </div>
          {unassigned.length > 0 && (
            <div className="flex gap-2">
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger className="h-8 text-[12px] flex-1"><SelectValue placeholder="Assign department…" /></SelectTrigger>
                <SelectContent>
                  {unassigned.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-[12px]" disabled={!deptId || assign.isPending}
                onClick={() => { if (deptId) { assign.mutate({ policyId: policy.id, departmentId: Number(deptId) }); setDeptId('') } }}>
                {assign.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminLeavePoliciesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<LeavePolicy | undefined>()
  const { data: policies = [], isLoading } = useAdminLeavePolicies()

  const openCreate = () => { setEditing(undefined); setShowForm(true) }
  const openEdit   = (p: LeavePolicy) => { setEditing(p); setShowForm(true) }
  const close      = () => { setShowForm(false); setEditing(undefined) }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Leave Policies</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Assign leave types to departments with configurable rules.</p>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-[13px]">
          <Plus className="h-3.5 w-3.5" /> New Policy
        </Button>
      </div>

      {showForm && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
            <CardTitle className="text-[15px]">{editing ? `Edit — ${editing.policyName}` : 'New Leave Policy'}</CardTitle>
            <button onClick={close} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
          </CardHeader>
          <CardContent className="p-5"><PolicyForm editing={editing} onClose={close} /></CardContent>
        </Card>
      )}

      {isLoading
        ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        : policies.length === 0
          ? <Card className="border-dashed"><CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-lg mb-1">No policies configured</p>
              <p className="text-[13px] text-muted-foreground mb-4">Create a policy to assign leave types to departments.</p>
              <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create Policy</Button>
            </CardContent></Card>
          : <div className="space-y-4">
              {policies.map(p => <PolicyCard key={p.id} policy={p} onEdit={openEdit} />)}
            </div>
      }
    </div>
  )
}
