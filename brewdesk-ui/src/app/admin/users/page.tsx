'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Sheet, SheetContent, SheetDescription,
    SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import {
    useCreateUser,
    useDisableUser, useEnableUser, useResetPassword,
    useUpdateUser,
    useUsers,
} from '@/hooks/useUsers'
import { Role, isSuperAdmin } from '@/types/auth'
import { UserResponse } from '@/types/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
    AlertCircle, Check, Copy, MoreVertical, Plus,
    Search, Shield, UserPlus, X,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// ── Role metadata ─────────────────────────────────────────────────────────────

const ALL_ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'SUPER_ADMIN',       label: 'Super Admin',        description: 'Full system access' },
  { value: 'ADMIN',             label: 'Admin',              description: 'HR & office admin' },
  { value: 'REPORTING_MANAGER', label: 'Reporting Manager',  description: 'Team lead — view own team' },
  { value: 'CHEF',              label: 'Chef',               description: 'Pantry operator' },
  { value: 'EMPLOYEE',          label: 'Employee',           description: 'Regular staff' },
]

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  SUPER_ADMIN:       'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  ADMIN:             'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
  REPORTING_MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  CHEF:              'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  EMPLOYEE:          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
}

// ── Form schema ───────────────────────────────────────────────────────────────

const userFormSchema = z.object({
  name:  z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  role:  z.enum(
    ['SUPER_ADMIN', 'ADMIN', 'REPORTING_MANAGER', 'CHEF', 'EMPLOYEE'],
    { required_error: 'Role is required' },
  ),
})
type UserFormValues = z.infer<typeof userFormSchema>

type FilterRole   = 'all' | Role
type FilterStatus = 'all' | 'active' | 'disabled'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading, error, refetch } = useUsers()
  const createUser   = useCreateUser()
  const updateUser   = useUpdateUser()
  const disableUser  = useDisableUser()
  const enableUser   = useEnableUser()
  const resetPassword = useResetPassword()

  const [search,       setSearch]       = useState('')
  const [filterRole,   setFilterRole]   = useState<FilterRole>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<UserResponse | null>(null)

  const [disableOpen,  setDisableOpen]  = useState(false)
  const [enableOpen,   setEnableOpen]   = useState(false)
  const [resetOpen,    setResetOpen]    = useState(false)
  const [actionUser,   setActionUser]   = useState<UserResponse | null>(null)

  const [successOpen, setSuccessOpen] = useState(false)
  const [successData, setSuccessData] = useState<{
    name: string; email: string; role: Role; temporaryPassword: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: '', email: '', role: 'EMPLOYEE' },
  })

  // Only SUPER_ADMIN can assign SUPER_ADMIN role
  const assignableRoles = ALL_ROLES.filter(
    (r) => r.value !== 'SUPER_ADMIN' || isSuperAdmin(currentUser?.role),
  )

  const filtered = users?.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = filterRole === 'all' || u.role === filterRole
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'active'   && u.active)
      || (filterStatus === 'disabled' && !u.active)
    return matchSearch && matchRole && matchStatus
  })

  const hasFilters = !!search || filterRole !== 'all' || filterStatus !== 'all'

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (values: UserFormValues) => {
    try {
      const result = await createUser.mutateAsync(values)
      setCreateOpen(false)
      form.reset()
      setSuccessData({ name: result.name, email: result.email, role: result.role, temporaryPassword: result.temporaryPassword })
      setSuccessOpen(true)
    } catch { /* handled by hook */ }
  }

  const handleUpdate = async (values: UserFormValues) => {
    if (!editTarget) return
    try {
      await updateUser.mutateAsync({ id: editTarget.id, request: values })
      setEditOpen(false); setEditTarget(null); form.reset()
    } catch { /* handled */ }
  }

  const handleDisable = async () => {
    if (!actionUser) return
    try { await disableUser.mutateAsync(actionUser.id); setDisableOpen(false); setActionUser(null) }
    catch { /* handled */ }
  }

  const handleEnable = async () => {
    if (!actionUser) return
    try { await enableUser.mutateAsync(actionUser.id); setEnableOpen(false); setActionUser(null) }
    catch { /* handled */ }
  }

  const handleReset = async () => {
    if (!actionUser) return
    try {
      const result = await resetPassword.mutateAsync(actionUser.id)
      setResetOpen(false)
      setSuccessData({ name: actionUser.name, email: actionUser.email, role: actionUser.role, temporaryPassword: result.temporaryPassword })
      setSuccessOpen(true); setActionUser(null)
    } catch { /* handled */ }
  }

  const openEdit = (u: UserResponse) => {
    setEditTarget(u)
    form.reset({ name: u.name, email: u.email, role: u.role })
    setEditOpen(true)
  }

  const copyPassword = () => {
    if (!successData?.temporaryPassword) return
    navigator.clipboard.writeText(successData.temporaryPassword)
    setCopied(true)
    toast.success('Password copied')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Role select used in both sheets ───────────────────────────────────────

  const RoleSelect = ({ id }: { id: string }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>Role</Label>
      <Select
        value={form.watch('role')}
        onValueChange={(v) => form.setValue('role', v as Role)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {assignableRoles.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              <div className="flex flex-col">
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {form.formState.errors.role && (
        <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
      )}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage BrewDesk users, roles and account access.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v as FilterRole)}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearch(''); setFilterRole('all'); setFilterStatus('all') }}>
            <X className="h-4 w-4 mr-2" />Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Failed to load users</h3>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !filtered?.length ? (
          <div className="p-12 flex flex-col items-center text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{hasFilters ? 'No matching users' : 'No users yet'}</h3>
            <p className="text-muted-foreground mb-4">
              {hasFilters ? 'Try different filters.' : 'Create the first BrewDesk user.'}
            </p>
            {!hasFilters && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add User
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['User', 'Role', 'Status', 'Password', 'Created', ''].map((h) => (
                    <th key={h} className={`text-left p-4 text-sm font-medium text-muted-foreground ${h === '' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered?.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs font-semibold bg-muted">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[u.role]}`}>
                        {u.role === 'SUPER_ADMIN' && <Shield className="h-3 w-3" />}
                        {ALL_ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs ${u.mustChangePassword ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                        {u.mustChangePassword ? 'Change required' : 'Set'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(u)}>Edit user</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setActionUser(u); setResetOpen(true) }}>
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {u.active ? (
                            <DropdownMenuItem className="text-destructive"
                              onClick={() => { setActionUser(u); setDisableOpen(true) }}>
                              Disable user
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => { setActionUser(u); setEnableOpen(true) }}>
                              Enable user
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create user</SheetTitle>
            <SheetDescription>Add a new user. A temporary password will be generated.</SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" {...form.register('name')} placeholder="Full name" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" {...form.register('email')} placeholder="work@company.com" />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <RoleSelect id="c-role" />
            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create user'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>Update user info and role.</SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="e-name">Name</Label>
              <Input id="e-name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" type="email" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <RoleSelect id="e-role" />
            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Disable */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable {actionUser?.name}?</DialogTitle>
            <DialogDescription>This user will lose access to BrewDesk.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisable} disabled={disableUser.isPending}>
              {disableUser.isPending ? 'Disabling…' : 'Disable user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable */}
      <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable {actionUser?.name}?</DialogTitle>
            <DialogDescription>This user will regain access to BrewDesk.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnableOpen(false)}>Cancel</Button>
            <Button onClick={handleEnable} disabled={enableUser.isPending}>
              {enableUser.isPending ? 'Enabling…' : 'Enable user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password for {actionUser?.name}?</DialogTitle>
            <DialogDescription>A new temporary password will be generated. The user must change it on next login.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleReset} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              User ready
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="font-semibold">{successData?.name}</p>
              <p className="text-sm text-muted-foreground">{successData?.email}</p>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${successData ? ROLE_BADGE_CLASSES[successData.role] : ''}`}>
              {successData?.role && (ALL_ROLES.find((r) => r.value === successData.role)?.label ?? successData.role)}
            </span>
            <div className="space-y-2">
              <p className="text-sm font-medium">Temporary Password</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border bg-muted/30 p-3 font-mono text-sm break-all">
                  {successData?.temporaryPassword}
                </div>
                <Button size="icon" variant="outline" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">Share this securely. The user must change it after logging in.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
