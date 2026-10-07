'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'
import {
  Building2,
  CalendarDays,
  CheckSquare,
  Clock,
  Coffee,
  FileEdit,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  ScrollText,
  Search,
  Sun,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react'

interface CommandMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandMenu({ open: externalOpen, onOpenChange: setExternalOpen }: CommandMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (setExternalOpen) setExternalOpen(next)
      if (!isControlled) setInternalOpen(next)
    },
    [isControlled, setExternalOpen]
  )

  const router = useRouter()
  const { user, logout } = useAuth()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, setOpen])

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin
  const isManager = user?.role === 'REPORTING_MANAGER' || isAdmin
  const isChef = user?.role === 'CHEF'

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search sections... (⌘K)" />
      <CommandList>
        <CommandEmpty>No matching commands found.</CommandEmpty>

        {/* General / Core Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </CommandItem>
        </CommandGroup>

        {/* Attendance & HRMS */}
        <CommandGroup heading="Attendance & HRMS">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/my'))}>
            <CalendarDays className="mr-2 h-4 w-4 text-emerald-600" />
            <span>My Attendance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/regularization'))}>
            <FileEdit className="mr-2 h-4 w-4 text-amber-600" />
            <span>Regularization Requests</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/leave'))}>
            <CalendarDays className="mr-2 h-4 w-4 text-blue-600" />
            <span>Leave Management</span>
          </CommandItem>
          {isManager && (
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/team'))}>
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span>Team Attendance</span>
            </CommandItem>
          )}
          {isAdmin && (
            <>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/records'))}>
                <ScrollText className="mr-2 h-4 w-4" />
                <span>Attendance Records Log</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/employees'))}>
                <Users className="mr-2 h-4 w-4" />
                <span>Employee Management</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/departments'))}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Departments</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/attendance/shifts'))}>
                <Clock className="mr-2 h-4 w-4" />
                <span>Work Shifts</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {/* Pantry & Beverages */}
        <CommandGroup heading="Pantry & Beverages">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/order'))}>
            <Coffee className="mr-2 h-4 w-4 text-amber-600" />
            <span>Order Beverage</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/my-orders'))}>
            <ScrollText className="mr-2 h-4 w-4" />
            <span>My Orders</span>
          </CommandItem>
          {(isChef || isAdmin) && (
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/orders'))}>
              <UtensilsCrossed className="mr-2 h-4 w-4 text-rose-600" />
              <span>Live Kitchen Orders</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/summary'))}>
            <Coffee className="mr-2 h-4 w-4" />
            <span>Beverage Consumption Summary</span>
          </CommandItem>
        </CommandGroup>

        {/* Administration */}
        {isAdmin && (
          <CommandGroup heading="Administration">
            <CommandItem onSelect={() => runCommand(() => router.push('/admin/users'))}>
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span>User & Role Management</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Preferences & System */}
        <CommandGroup heading="Preferences & Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings/themes'))}>
            <Palette className="mr-2 h-4 w-4 text-primary" />
            <span>Custom Themes & Color Palette</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Switch to Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Switch to Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => logout())}>
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Log Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
