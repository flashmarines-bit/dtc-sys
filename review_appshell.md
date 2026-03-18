'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  FileText, Upload, ClipboardList, LayoutDashboard,
  LogOut, User, ChevronRight, Users, Settings,
  FolderOpen, Bell, QrCode, Home, Package, BookOpen,
  Moon, Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { usePushNotification } from '@/hooks/usePushNotification'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useEffect, useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  mobileIcon?: React.ReactNode
  roles: string[]
  showInBottomNav?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard', href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    mobileIcon: <Home className="w-5 h-5" />,
    roles: ['SysAdmin', 'Admin', 'User'],
    showInBottomNav: true
  },
  {
    label: 'Pengajuan Saya', href: '/vendor/submissions',
    icon: <Upload className="w-4 h-4" />,
    mobileIcon: <Upload className="w-5 h-5" />,
    roles: ['Vendor'],
    showInBottomNav: true
  },
  {
    label: 'Doc Tracking', href: '/documents',
    icon: <Package className="w-4 h-4" />,
    mobileIcon: <Package className="w-5 h-5" />,
    roles: ['Validator', 'SysAdmin', 'Admin', 'FrontDesk'],
    showInBottomNav: false
  },
  {
    label: 'Antrian Review', href: '/validator/queue',
    icon: <ClipboardList className="w-4 h-4" />,
    mobileIcon: <ClipboardList className="w-5 h-5" />,
    roles: ['Validator', 'SysAdmin', 'Admin'],
    showInBottomNav: true
  },
  {
    label: 'Scan QR', href: '/mobile/scan',
    icon: <QrCode className="w-4 h-4" />,
    mobileIcon: <QrCode className="w-5 h-5" />,
    roles: ['Validator', 'SysAdmin', 'Admin', 'FrontDesk', 'Vendor'],
    showInBottomNav: true
  },
  {
    label: 'User Management', href: '/admin/users',
    icon: <Users className="w-4 h-4" />,
    roles: ['SysAdmin', 'Admin'],
    showInBottomNav: false
  },
  {
    label: 'System Settings', href: '/admin/settings',
    icon: <Settings className="w-4 h-4" />,
    roles: ['SysAdmin'],
    showInBottomNav: false
  },
  {
    label: 'E-Library', href: '/library',
    icon: <BookOpen className="w-4 h-4" />,
    mobileIcon: <BookOpen className="w-5 h-5" />,
    roles: ['SysAdmin', 'Admin', 'Validator', 'User'],
    showInBottomNav: false
  },
  {
    label: 'Document Types', href: '/admin/document-types',
    icon: <FolderOpen className="w-4 h-4" />,
    roles: ['SysAdmin', 'Admin'],
    showInBottomNav: false
  },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const { permission, subscribe } = usePushNotification()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count')
        setUnreadCount(data.unreadCount ?? 0)
      } catch { /* silent */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const themeLabel =
    theme === 'system'
      ? 'Tema: Sistem'
      : theme === 'dark'
      ? 'Tema: Gelap'
      : 'Tema: Terang'

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const visibleNav = NAV_ITEMS.filter(item =>
    user?.role && item.roles.includes(user.role)
  )

  const bottomNavItems = visibleNav.filter(item => item.showInBottomNav).slice(0, 4)

  const initials = user?.fullName
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="text-card-foreground font-semibold text-sm">DTC System</p>
            <p className="text-muted-foreground text-xs">v1.0.0</p>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
              {item.icon}
              <span>{item.label}</span>
              {pathname.startsWith(item.href) && (
                <ChevronRight className="w-3 h-3 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        <Separator className="bg-card" />

        {/* Bell */}
        <div className="px-4 py-2">
          <button onClick={() => router.push('/notifications')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Notifikasi</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <Separator className="bg-border" />

        {/* User */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm text-card-foreground truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-popover-foreground">Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                  <User className="w-4 h-4 mr-2" /> Profil
                </DropdownMenuItem>
                <div className="px-2 py-2 min-w-56">
                  <ThemeToggle />
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-foreground" />
            </div>
            <span className="text-card-foreground font-semibold text-sm">DTC System</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/notifications')}
              className="relative p-2 text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-700 text-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuLabel className="text-popover-foreground text-xs">{user?.fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Push notification prompt */}
        {permission === 'default' && (
          <div className="bg-blue-900/30 border-b border-blue-700/50 px-4 py-2 flex items-center justify-between">
            <p className="text-blue-300 text-xs">Aktifkan notifikasi untuk update real-time</p>
            <button onClick={subscribe}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-foreground px-3 py-1 rounded-lg transition-colors">
              Aktifkan
            </button>
          </div>
        )}

        {children}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {bottomNavItems.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-12",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                <span className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}>
                  {item.mobileIcon ?? item.icon}
                </span>
                <span className="text-xs font-medium leading-none">
                  {item.label.split(' ')[0]}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
