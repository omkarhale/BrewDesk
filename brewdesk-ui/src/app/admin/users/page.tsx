'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Search, MoreVertical, Copy, Check, AlertCircle, UserPlus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUsers, useCreateUser, useUpdateUser, useDisableUser, useEnableUser, useResetPassword } from '@/hooks/useUsers'
import { UserResponse } from '@/types/user'
import { Role } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  role: z.enum(['ADMIN', 'MAKER', 'EMPLOYEE'], { required_error: 'Role is required' }),
})

type UserFormValues = z.infer<typeof userFormSchema>

type FilterRole = 'all' | Role
type FilterStatus = 'all' | 'active' | 'disabled'
type FilterPassword = 'all' | 'set' | 'required'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleBadgeVariant(role: Role): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'ADMIN':
      return 'default'
    case 'MAKER':
      return 'secondary'
    case 'EMPLOYEE':
      return 'outline'
    default:
      return 'outline'
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading, error, refetch } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const disableUser = useDisableUser()
  const enableUser = useEnableUser()
  const resetPassword = useResetPassword()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPassword, setFilterPassword] = useState<FilterPassword>('all')

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)

  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [actionUser, setActionUser] = useState<UserResponse | null>(null)

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [successData, setSuccessData] = useState<{ name: string; email: string; role: Role; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'EMPLOYEE',
    },
  })

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'disabled' && !user.active)
    const matchesPassword =
      filterPassword === 'all' ||
      (filterPassword === 'set' && !user.mustChangePassword) ||
      (filterPassword === 'required' && user.mustChangePassword)

    return matchesSearch && matchesRole && matchesStatus && matchesPassword
  })

  const handleCreateUser = async (values: UserFormValues) => {
    try {
      const result = await createUser.mutateAsync(values)
      setIsCreateSheetOpen(false)
      form.reset()
      setSuccessData({
        name: result.name,
        email: result.email,
        role: result.role,
        temporaryPassword: result.temporaryPassword,
      })
      setIsSuccessDialogOpen(true)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleUpdateUser = async (values: UserFormValues) => {
    if (!editingUser) return
    try {
      await updateUser.mutateAsync({ id: editingUser.id, request: values })
      setIsEditSheetOpen(false)
      setEditingUser(null)
      form.reset()
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleDisableUser = async () => {
    if (!actionUser) return
    try {
      await disableUser.mutateAsync(actionUser.id)
      setIsDisableDialogOpen(false)
      setActionUser(null)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleEnableUser = async () => {
    if (!actionUser) return
    try {
      await enableUser.mutateAsync(actionUser.id)
      setIsEnableDialogOpen(false)
      setActionUser(null)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleResetPassword = async () => {
    if (!actionUser) return
    try {
      const result = await resetPassword.mutateAsync(actionUser.id)
      setIsResetPasswordDialogOpen(false)
      setSuccessData({
        name: actionUser.name,
        email: actionUser.email,
        role: actionUser.role,
        temporaryPassword: result.temporaryPassword,
      })
      setIsSuccessDialogOpen(true)
      setActionUser(null)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const openEditSheet = (user: UserResponse) => {
    setEditingUser(user)
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    setIsEditSheetOpen(true)
  }

  const openDisableDialog = (user: UserResponse) => {
    setActionUser(user)
    setIsDisableDialogOpen(true)
  }

  const openEnableDialog = (user: UserResponse) => {
    setActionUser(user)
    setIsEnableDialogOpen(true)
  }

  const openResetPasswordDialog = (user: UserResponse) => {
    setActionUser(user)
    setIsResetPasswordDialogOpen(true)
  }

  const copyPassword = () => {
    if (successData?.temporaryPassword) {
      navigator.clipboard.writeText(successData.temporaryPassword)
      setCopied(true)
      toast.success('Password copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterRole('all')
    setFilterStatus('all')
    setFilterPassword('all')
  }

  const hasActiveFilters = searchQuery || filterRole !== 'all' || filterStatus !== 'all' || filterPassword !== 'all'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage BrewDesk users, roles and account access.</p>
        </div>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={(value) => setFilterRole(value as FilterRole)}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="MAKER">MAKER</SelectItem>
            <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPassword} onValueChange={(value) => setFilterPassword(value as FilterPassword)}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Password status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="set">Password set</SelectItem>
            <SelectItem value="required">Password change required</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Failed to load users</h3>
            <p className="text-muted-foreground mb-4">Please check your connection and try again.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filteredUsers && filteredUsers.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            {hasActiveFilters ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No matching users</h3>
                <p className="text-muted-foreground mb-4">Try changing your search or filters.</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No users yet</h3>
                <p className="text-muted-foreground mb-4">Create your first BrewDesk user to get started.</p>
                <Button onClick={() => setIsCreateSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Password Status</th>
                  <th className="text-left p-4 font-medium text-sm text-muted-foreground">Created</th>
                  <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${user.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {user.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${user.mustChangePassword ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                        {user.mustChangePassword ? 'Password change required' : 'Password set'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditSheet(user)}>Edit user</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>Reset password</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.active ? (
                            <DropdownMenuItem onClick={() => openDisableDialog(user)} className="text-destructive">
                              Disable user
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openEnableDialog(user)}>Enable user</DropdownMenuItem>
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

      {/* Create User Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Create user</SheetTitle>
            <SheetDescription>Add a new user to BrewDesk. A temporary password will be generated.</SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                {...form.register('name')}
                placeholder="Enter name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                {...form.register('email')}
                placeholder="Enter email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value as Role)}>
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="MAKER">MAKER</SelectItem>
                  <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsCreateSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating...' : 'Create user'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit User Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit user</SheetTitle>
            <SheetDescription>Update user information and role.</SheetDescription>
          </SheetHeader>
          <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                {...form.register('name')}
                placeholder="Enter name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...form.register('email')}
                placeholder="Enter email"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value as Role)}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="MAKER">MAKER</SelectItem>
                  <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
            <SheetFooter className="mt-8">
              <Button type="button" variant="outline" onClick={() => setIsEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Disable User Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable {actionUser?.name}?</DialogTitle>
            <DialogDescription>
              This user will no longer be able to access BrewDesk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisableUser} disabled={disableUser.isPending}>
              {disableUser.isPending ? 'Disabling...' : 'Disable user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable User Dialog */}
      <Dialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable {actionUser?.name}?</DialogTitle>
            <DialogDescription>
              This user will regain access to BrewDesk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnableUser} disabled={enableUser.isPending}>
              {enableUser.isPending ? 'Enabling...' : 'Enable user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password for {actionUser?.name}?</DialogTitle>
            <DialogDescription>
              A new temporary password will be generated. The user will be required to change the password after logging in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              User Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="font-medium">{successData?.name}</p>
              <p className="text-sm text-muted-foreground">{successData?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Role</p>
              <Badge variant={successData ? getRoleBadgeVariant(successData.role) : 'outline'}>
                {successData?.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Temporary Password</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
                  {successData?.temporaryPassword}
                </div>
                <Button size="icon" variant="outline" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Share this password securely. The user must change it after login.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
