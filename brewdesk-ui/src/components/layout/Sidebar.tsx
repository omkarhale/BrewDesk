'use client'

import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import { Role } from '@/types/auth'
import {
    Building2,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    Clock,
    Coffee,
    Fingerprint,
    Layers,
    LayoutDashboard,
    LogOut,
    ScrollText,
    Shield,
    TerminalSquare,
    User,
    UserCircle2,
    Users,
    UtensilsCrossed,
    X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavLeaf {
  kind: 'leaf'
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  kind: 'group'
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: NavLeaf[]
}

type NavItem = NavLeaf | NavGroup

// ── Shared items ──────────────────────────────────────────────────────────────

const profileLeaf: NavLeaf = {
  kind: 'leaf', label: 'Profile', href: '/dashboard/profile', icon: User,
}

// ── Attendance groups ─────────────────────────────────────────────────────────

const adminAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance', href: '/dashboard/attendance/my',       icon: CalendarDays },
    { kind: 'leaf', label: 'Overview',      href: '/dashboard/attendance',           icon: LayoutDashboard },
    { kind: 'leaf', label: 'Records',       href: '/dashboard/attendance/records',   icon: ScrollText },
    { kind: 'leaf', label: 'Calendar',      href: '/dashboard/attendance/calendar',  icon: CalendarDays },
    { kind: 'leaf', label: 'Employees',     href: '/dashboard/attendance/employees', icon: UserCircle2 },
    { kind: 'leaf', label: 'Departments',   href: '/dashboard/attendance/departments', icon: Building2 },
    { kind: 'leaf', label: 'Shifts',        href: '/dashboard/attendance/shifts',    icon: Clock },
    { kind: 'leaf', label: 'Simulator',     href: '/dashboard/attendance/simulator', icon: TerminalSquare },
  ],
}

const managerAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance', href: '/dashboard/attendance/my',   icon: CalendarDays },
    { kind: 'leaf', label: 'Team View',     href: '/dashboard/attendance/team', icon: Users },
  ],
}

const staffAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance', href: '/dashboard/attendance/my', icon: CalendarDays },
  ],
}

// ── Pantry groups ─────────────────────────────────────────────────────────────

const adminPantryGroup: NavGroup = {
  kind: 'group', id: 'pantry', label: 'Pantry', icon: UtensilsCrossed,
  children: [
    { kind: 'leaf', label: 'Beverages', href: '/dashboard/beverages', icon: Coffee },
    { kind: 'leaf', label: 'Rounds',    href: '/dashboard/round',     icon: Clock },
    { kind: 'leaf', label: 'Orders',    href: '/dashboard/orders',    icon: ClipboardList },
    { kind: 'leaf', label: 'Summary',   href: '/dashboard/summary',   icon: Layers },
  ],
}

const chefPantryGroup: NavGroup = {
  kind: 'group', id: 'pantry', label: 'Pantry', icon: UtensilsCrossed,
  children: [
    { kind: 'leaf', label: 'Orders',  href: '/dashboard/orders',  icon: ClipboardList },
    { kind: 'leaf', label: 'Summary', href: '/dashboard/summary', icon: Layers },
    { kind: 'leaf', label: 'Rounds',  href: '/dashboard/round',   icon: Clock },
  ],
}

const employeePantryGroup: NavGroup = {
  kind: 'group', id: 'pantry', label: 'Pantry', icon: UtensilsCrossed,
  children: [
    { kind: 'leaf', label: 'Order Beverage', href: '/dashboard/order',     icon: Coffee },
    { kind: 'leaf', label: 'My Orders',      href: '/dashboard/my-orders', icon: ClipboardList },
    { kind: 'leaf', label: 'Current Round',  href: '/dashboard/round',     icon: Clock },
  ],
}

// ── Role-specific nav trees ───────────────────────────────────────────────────

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { kind: 'leaf', label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { kind: 'leaf', label: 'Users',     href: '/admin/users',      icon: Users },
    adminAttendanceGroup,
    adminPantryGroup,
    profileLeaf,
  ],
  ADMIN: [
    { kind: 'leaf', label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { kind: 'leaf', label: 'Users',     href: '/admin/users',      icon: Users },
    adminAttendanceGroup,
    adminPantryGroup,
    profileLeaf,
  ],
  REPORTING_MANAGER: [
    { kind: 'leaf', label: 'Dashboard', href: '/dashboard/manager', icon: LayoutDashboard },
    managerAttendanceGroup,
    employeePantryGroup,
    profileLeaf,
  ],
  CHEF: [
    { kind: 'leaf', label: 'Dashboard', href: '/dashboard/chef', icon: LayoutDashboard },
    staffAttendanceGroup,
    chefPantryGroup,
    profileLeaf,
  ],
  EMPLOYEE: [
    { kind: 'leaf', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    staffAttendanceGroup,
    employeePantryGroup,
    profileLeaf,
  ],
}

// ── Role display metadata ─────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; chipClass: string }> = {
  SUPER_ADMIN:       { label: 'Super Admin', chipClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ADMIN:             { label: 'Admin',       chipClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  REPORTING_MANAGER: { label: 'Manager',     chipClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  CHEF:              { label: 'Chef',        chipClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  EMPLOYEE:          { label: 'Employee',    chipClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
}

// ── Active path helpers ───────────────────────────────────────────────────────

const EXACT_MATCH = new Set([
  '/dashboard', '/dashboard/admin', '/dashboard/chef',
  '/dashboard/manager', '/dashboard/attendance', '/admin/users',
])

function isLeafActive(href: string, pathname: string) {
  return EXACT_MATCH.has(href) ? pathname === href : pathname.startsWith(href)
}

function isGroupActive(g: NavGroup, pathname: string) {
  return g.children.some((c) => isLeafActive(c.href, pathname))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LeafLink({
  item, pathname, indent = false, onClose,
}: { item: NavLeaf; pathname: string; indent?: boolean; onClose?: () => void }) {
  const active = isLeafActive(item.href, pathname)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-all duration-150',
        indent ? 'pl-9 pr-3' : 'px-3',
        active
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0',
        active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  )
}

function GroupSection({
  group, pathname, open, onToggle, onClose,
}: { group: NavGroup; pathname: string; open: boolean; onToggle: () => void; onClose?: () => void }) {
  const active = isGroupActive(group, pathname)
  const Icon = group.icon
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0',
          active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground group-hover:text-foreground')} />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200',
          open ? 'rotate-180' : '', active ? 'text-amber-500' : 'text-muted-foreground')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-200 ease-in-out',
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="mt-0.5 space-y-0.5 pb-1">
          {group.children.map((child) => (
            <LeafLink key={child.href} item={child} pathname={pathname} indent onClose={onClose} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const navItems = NAV_BY_ROLE[user?.role ?? 'EMPLOYEE']

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navItems
        .filter((i): i is NavGroup => i.kind === 'group')
        .map((g) => [g.id, isGroupActive(g, pathname)]),
    ),
  )

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((p) => ({ ...p, [id]: !p[id] }))
  }, [])

  const meta = ROLE_META[user?.role ?? 'EMPLOYEE']

  return (
    <aside className="flex h-full flex-col bg-sidebar border-r border-border w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <Coffee className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">BrewDesk</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) =>
          item.kind === 'leaf' ? (
            <LeafLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
          ) : (
            <GroupSection
              key={item.id}
              group={item}
              pathname={pathname}
              open={openGroups[item.id] ?? false}
              onToggle={() => toggleGroup(item.id)}
              onClose={onClose}
            />
          ),
        )}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name ?? 'User'}</p>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5', meta.chipClass)}>
              {user?.role === 'SUPER_ADMIN' && <Shield className="h-2.5 w-2.5" />}
              {meta.label}
            </span>
          </div>
        </div>
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={logout} />
    </aside>
  )
}
