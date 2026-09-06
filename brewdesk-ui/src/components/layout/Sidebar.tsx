'use client'

import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import {
    Building2,
    ChevronRight,
    ClipboardList,
    Clock,
    Coffee,
    Fingerprint,
    Layers,
    LayoutDashboard,
    LogOut,
    ScrollText,
    TerminalSquare,
    User,
    UserCircle2,
    Users,
    X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const employeeNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Current Round', href: '/dashboard/round', icon: Clock },
  { label: 'Order Beverage', href: '/dashboard/order', icon: Coffee },
  { label: 'My Orders', href: '/dashboard/my-orders', icon: ClipboardList },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
]

const makerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/maker', icon: LayoutDashboard },
  { label: 'Current Round', href: '/dashboard/round', icon: Clock },
  { label: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
  { label: 'Beverage Summary', href: '/dashboard/summary', icon: Layers },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Beverages', href: '/dashboard/beverages', icon: Coffee },
  { label: 'Rounds', href: '/dashboard/round', icon: Clock },
  { label: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
  { label: 'Attendance', href: '/dashboard/attendance', icon: Fingerprint },
  { label: 'Employees', href: '/dashboard/attendance/employees', icon: UserCircle2 },
  { label: 'Departments', href: '/dashboard/attendance/departments', icon: Building2 },
  { label: 'Shifts', href: '/dashboard/attendance/shifts', icon: Clock },
  { label: 'Simulator', href: '/dashboard/attendance/simulator', icon: TerminalSquare },
  { label: 'Records', href: '/dashboard/attendance/records', icon: ScrollText },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
]

function getRoleColor(role: string) {
  if (role === 'ADMIN') return 'danger'
  if (role === 'MAKER') return 'upcoming'
  return 'success'
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const navItems =
    user?.role === 'ADMIN' ? adminNav : user?.role === 'MAKER' ? makerNav : employeeNav

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/dashboard/maker') return pathname === '/dashboard/maker'
    if (href === '/dashboard/admin') return pathname === '/dashboard/admin'
    if (href === '/admin/users') return pathname === '/admin/users'
    if (href === '/dashboard/attendance') return pathname === '/dashboard/attendance'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full flex-col bg-sidebar border-r border-border w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <Coffee className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">BrewDesk</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 text-amber-400" />}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer: user info + logout */}
      <div className="px-3 py-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? 'User'}</p>
            <Badge
              variant={getRoleColor(user?.role ?? '') as 'danger' | 'upcoming' | 'success'}
              className="text-[10px] px-1.5 py-0"
            >
              {user?.role}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={logout}
      />
    </aside>
  )
}
