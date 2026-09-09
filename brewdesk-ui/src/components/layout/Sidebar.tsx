'use client'

import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'
import { Role } from '@/types/auth'
import {
  Activity,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coffee,
  FileEdit,
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

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Shared items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const profileLeaf: NavLeaf = {
  kind: 'leaf', label: 'Profile', href: '/dashboard/profile', icon: User,
}

// â”€â”€ Attendance groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const adminAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance',    href: '/dashboard/attendance/my',                         icon: CalendarDays },
    { kind: 'leaf', label: 'Regularization',   href: '/dashboard/attendance/regularization',             icon: FileEdit },
    { kind: 'leaf', label: 'Overview',          href: '/dashboard/attendance',                           icon: LayoutDashboard },
    { kind: 'leaf', label: 'Records',           href: '/dashboard/attendance/records',                   icon: ScrollText },
    { kind: 'leaf', label: 'Calendar',          href: '/dashboard/attendance/calendar',                  icon: CalendarDays },
    { kind: 'leaf', label: 'Employees',         href: '/dashboard/attendance/employees',                 icon: UserCircle2 },
    { kind: 'leaf', label: 'Departments',       href: '/dashboard/attendance/departments',               icon: Building2 },
    { kind: 'leaf', label: 'Shifts',            href: '/dashboard/attendance/shifts',                    icon: Clock },
    { kind: 'leaf', label: 'Approvals',         href: '/dashboard/attendance/regularization/approvals', icon: CheckSquare },
    { kind: 'leaf', label: 'Reg. Monitor',      href: '/dashboard/attendance/regularization/admin',     icon: ClipboardCheck },
    { kind: 'leaf', label: 'Simulator',         href: '/dashboard/attendance/simulator',                 icon: TerminalSquare },
    { kind: 'leaf', label: 'Events',            href: '/dashboard/attendance/events',                    icon: Activity },
  ],
}

const managerAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance', href: '/dashboard/attendance/my',                          icon: CalendarDays },
    { kind: 'leaf', label: 'Regularization',href: '/dashboard/attendance/regularization',              icon: FileEdit },
    { kind: 'leaf', label: 'Team View',     href: '/dashboard/attendance/team',                        icon: Users },
    { kind: 'leaf', label: 'Approvals',     href: '/dashboard/attendance/regularization/approvals',   icon: CheckSquare },
  ],
}

const staffAttendanceGroup: NavGroup = {
  kind: 'group', id: 'attendance', label: 'Attendance', icon: Fingerprint,
  children: [
    { kind: 'leaf', label: 'My Attendance', href: '/dashboard/attendance/my',              icon: CalendarDays },
    { kind: 'leaf', label: 'Regularization',href: '/dashboard/attendance/regularization',  icon: FileEdit },
  ],
}

// â”€â”€ Pantry groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Role-specific nav trees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Role display metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROLE_META: Record<Role, { label: string; chipClass: string; avatarClass: string }> = {
  SUPER_ADMIN:       { label: 'Super Admin', chipClass: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',             avatarClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ADMIN:             { label: 'Admin',       chipClass: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400', avatarClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  REPORTING_MANAGER: { label: 'Manager',     chipClass: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',         avatarClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  CHEF:              { label: 'Chef',        chipClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',     avatarClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  EMPLOYEE:          { label: 'Employee',    chipClass: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',         avatarClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
}

// â”€â”€ Active path helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Section label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
      {label}
    </p>
  )
}

// â”€â”€ LeafLink â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        'group flex items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-all duration-100',
        indent ? 'pl-8 pr-3' : 'px-3',
        active
          ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
          : 'text-[hsl(220_15%_40%)] hover:bg-[hsl(220_20%_96%)] hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground',
      )}
    >
      <Icon className={cn(
        'h-[15px] w-[15px] shrink-0 transition-colors',
        active ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground/70 group-hover:text-foreground',
      )} />
      <span className="flex-1 truncate leading-5">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
      )}
    </Link>
  )
}

// â”€â”€ GroupSection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          'group flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-100',
          active
            ? 'text-teal-700 dark:text-teal-400'
            : 'text-[hsl(220_15%_40%)] hover:bg-[hsl(220_20%_96%)] hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground',
        )}
      >
        <Icon className={cn(
          'h-[15px] w-[15px] shrink-0',
          active ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground/70 group-hover:text-foreground',
        )} />
        <span className="flex-1 truncate text-left leading-5">{group.label}</span>
        <ChevronDown className={cn(
          'h-3 w-3 shrink-0 transition-transform duration-200',
          open ? 'rotate-180' : '',
          active ? 'text-teal-500' : 'text-muted-foreground/50',
        )} />
      </button>

      {/* Animated children */}
      <div className={cn(
        'overflow-hidden transition-all duration-200 ease-in-out',
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      )}>
        <div className="mt-0.5 space-y-px pb-1">
          {group.children.map((child) => (
            <LeafLink key={child.href} item={child} pathname={pathname} indent onClose={onClose} />
          ))}
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Main Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // Group nav items into sections for visual separation
  const topItems = navItems.filter(
    (i) => i.kind === 'leaf' && (i as NavLeaf).label === 'Dashboard',
  )
  const adminItems = navItems.filter(
    (i) => i.kind === 'leaf' && (i as NavLeaf).label === 'Users',
  )
  const groupItems = navItems.filter((i) => i.kind === 'group')
  const bottomItems = navItems.filter(
    (i) => i.kind === 'leaf' && (i as NavLeaf).label === 'Profile',
  )

  const renderItem = (item: NavItem) =>
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
    )

  return (
    <aside className="flex h-full flex-col bg-sidebar border-r border-[hsl(var(--sidebar-border))] w-60">

      {/* â”€â”€ Logo â”€â”€ */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
            <Coffee className="h-3.5 w-3.5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}>
            BrewDesk
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* â”€â”€ Navigation â”€â”€ */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2" aria-label="Main navigation">

        {/* Dashboard + Admin top-level leaves */}
        {topItems.length > 0 && (
          <div className="space-y-px">
            {topItems.map(renderItem)}
          </div>
        )}

        {adminItems.length > 0 && (
          <>
            <SectionLabel label="Admin" />
            <div className="space-y-px">
              {adminItems.map(renderItem)}
            </div>
          </>
        )}

        {/* Feature groups */}
        {groupItems.length > 0 && (
          <>
            <SectionLabel label="Workspace" />
            <div className="space-y-px">
              {groupItems.map(renderItem)}
            </div>
          </>
        )}

        {/* Profile at bottom of nav */}
        {bottomItems.length > 0 && (
          <>
            <SectionLabel label="Account" />
            <div className="space-y-px">
              {bottomItems.map(renderItem)}
            </div>
          </>
        )}
      </nav>

      {/* â”€â”€ User footer â”€â”€ */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[hsl(220_20%_96%)] dark:hover:bg-muted transition-colors">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback
              className={cn('text-[11px] font-bold', meta.avatarClass)}
            >
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate text-foreground leading-tight">
              {user?.name ?? 'User'}
            </p>
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium leading-tight mt-0.5',
              meta.chipClass,
            )}>
              {user?.role === 'SUPER_ADMIN' && <Shield className="h-2.5 w-2.5" />}
              {meta.label}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="ml-auto h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={logout} />
    </aside>
  )
}

