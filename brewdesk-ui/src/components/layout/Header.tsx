'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import { Bell, ChevronRight, Menu, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Route label map ───────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':                          'Dashboard',
  '/dashboard/maker':                    'Dashboard',
  '/dashboard/admin':                    'Dashboard',
  '/dashboard/chef':                     'Dashboard',
  '/dashboard/manager':                  'Dashboard',
  '/dashboard/round':                    'Current Round',
  '/dashboard/order':                    'Order Beverage',
  '/dashboard/orders':                   'Orders',
  '/dashboard/my-orders':                'My Orders',
  '/dashboard/summary':                  'Beverage Summary',
  '/dashboard/profile':                  'Profile',
  '/dashboard/users':                    'Users',
  '/dashboard/beverages':                'Beverages',
  '/dashboard/attendance':               'Attendance',
  '/dashboard/attendance/my':            'My Attendance',
  '/dashboard/attendance/records':       'Records',
  '/dashboard/attendance/calendar':      'Calendar',
  '/dashboard/attendance/employees':     'Employees',
  '/dashboard/attendance/departments':   'Departments',
  '/dashboard/attendance/shifts':        'Shifts',
  '/dashboard/attendance/simulator':     'Simulator',
  '/dashboard/attendance/team':          'Team View',
  '/admin/users':                        'Users',
}

// ── Breadcrumb builder ────────────────────────────────────────────────────────

interface Crumb { label: string; href: string }

function buildCrumbs(pathname: string): Crumb[] {
  // Check if this is an attendance sub-page
  if (pathname.startsWith('/dashboard/attendance/')) {
    const leafLabel = ROUTE_LABELS[pathname]
    if (leafLabel) {
      return [
        { label: 'Attendance', href: '/dashboard/attendance' },
        { label: leafLabel,    href: pathname },
      ]
    }
  }
  const label = ROUTE_LABELS[pathname]
  return label ? [{ label, href: pathname }] : [{ label: 'BrewDesk', href: '/dashboard' }]
}

// ── Role chip colours ─────────────────────────────────────────────────────────

const ROLE_CHIP: Record<string, string> = {
  SUPER_ADMIN:       'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  ADMIN:             'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  REPORTING_MANAGER: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  CHEF:              'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  EMPLOYEE:          'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin',
  REPORTING_MANAGER: 'Manager', CHEF: 'Chef', EMPLOYEE: 'Employee',
}

const AVATAR_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  REPORTING_MANAGER: 'bg-blue-100 text-blue-700',
  CHEF: 'bg-amber-100 text-amber-700',
  EMPLOYEE: 'bg-teal-100 text-teal-700',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const crumbs = buildCrumbs(pathname)
  const roleChip = ROLE_CHIP[user?.role ?? 'EMPLOYEE']
  const avatarColor = AVATAR_COLORS[user?.role ?? 'EMPLOYEE']

  const themeIcon =
    theme === 'dark'  ? <Moon className="h-[15px] w-[15px]" /> :
    theme === 'light' ? <Sun  className="h-[15px] w-[15px]" /> :
                        <Monitor className="h-[15px] w-[15px]" />

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:px-5">

      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="flex-1 min-w-0">
        <ol className="flex items-center gap-1.5">
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
              {i < crumbs.length - 1 ? (
                <Link
                  href={crumb.href}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="text-[14px] font-semibold text-foreground truncate"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-0.5 shrink-0">

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {themeIcon}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pb-1">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')} className="text-sm gap-2">
              <Sun className="h-3.5 w-3.5" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="text-sm gap-2">
              <Moon className="h-3.5 w-3.5" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="text-sm gap-2">
              <Monitor className="h-3.5 w-3.5" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button
          type="button"
          className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-[15px] w-[15px]" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                'hover:bg-[hsl(220_20%_96%)] dark:hover:bg-muted',
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className={cn('text-[10px] font-bold', avatarColor)}>
                  {user ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-semibold text-foreground">{user?.name}</span>
                <span className={cn('text-[10px] font-medium rounded-sm px-1.5 py-0', roleChip)}>
                  {ROLE_LABELS[user?.role ?? 'EMPLOYEE']}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              <span className={cn('inline-block text-[10px] font-medium rounded px-1.5 py-0.5 mt-1.5', roleChip)}>
                {ROLE_LABELS[user?.role ?? 'EMPLOYEE']}
              </span>
            </div>
            <div className="py-1">
              <DropdownMenuItem asChild className="text-[13px]">
                <a href="/dashboard/profile">Profile settings</a>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
