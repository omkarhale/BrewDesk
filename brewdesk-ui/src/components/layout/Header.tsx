'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { getInitials } from '@/lib/utils'
import { Bell, Menu, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'

const ROLE_BADGE: Record<string, 'danger' | 'upcoming' | 'success'> = {
  SUPER_ADMIN: 'danger',
  ADMIN:       'danger',
  REPORTING_MANAGER: 'upcoming',
  CHEF:        'upcoming',
  EMPLOYEE:    'success',
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/maker': 'Dashboard',
  '/dashboard/admin': 'Dashboard',
  '/dashboard/round': 'Current Round',
  '/dashboard/order': 'Order Beverage',
  '/dashboard/orders': 'Orders',
  '/dashboard/my-orders': 'My Orders',
  '/dashboard/summary': 'Beverage Summary',
  '/dashboard/profile': 'Profile',
  '/dashboard/users': 'Users',
  '/dashboard/beverages': 'Beverages',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const pageTitle = routeLabels[pathname] ?? 'BrewDesk'

  const themeIcon =
    theme === 'dark' ? <Moon className="h-4 w-4" /> :
    theme === 'light' ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              {themeIcon}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications (decorative — no backend endpoint yet) */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {user ? getInitials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge
                  variant={ROLE_BADGE[user?.role ?? 'EMPLOYEE'] ?? 'success'}
                  className="text-[9px] px-1 py-0 h-4"
                >
                  {user?.role}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/profile">Profile</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
