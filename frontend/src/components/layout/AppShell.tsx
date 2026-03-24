'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
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
  Truck, Library, Send, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { usePushNotification } from '@/hooks/usePushNotification'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useEffect, useState } from 'react'

// Role constants
const INTERNAL_ROLES = ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User']
const ALL_ROLES = ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User', 'Vendor']

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  mobileIcon?: React.ReactNode
  roles: string[]
  showInBottomNav?: boolean
}

interface NavModule {
  id: string
  label: string
  description: string
  color: string
  activeColor: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  roles: string[]
  items: NavItem[]
  defaultHref: string
}

const NAV_MODULES: NavModule[] = [
  {
    id: 'tracking',
    label: 'Modul 1',
    description: 'Doc Tracking',
    color: 'text-blue-500',
    activeColor: 'bg-blue-500 text-white',
    bgColor: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    icon: <Truck className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
    defaultHref: '/dashboard',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, mobileIcon: <Home className="w-5 h-5" />, roles: ['SysAdmin', 'Admin', 'User'], showInBottomNav: true },
      { label: 'Doc Tracking', href: '/documents', icon: <Package className="w-4 h-4" />, mobileIcon: <Package className="w-5 h-5" />, roles: ALL_ROLES, showInBottomNav: false },
      { label: 'Scan QR', href: '/mobile/scan', icon: <QrCode className="w-4 h-4" />, mobileIcon: <QrCode className="w-5 h-5" />, roles: ALL_ROLES, showInBottomNav: true },
    ]
  },
  {
    id: 'library',
    label: 'Modul 2',
    description: 'E-Library',
    color: 'text-emerald-500',
    activeColor: 'bg-emerald-500 text-white',
    bgColor: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: <Library className="w-3.5 h-3.5" />,
    roles: INTERNAL_ROLES,
    defaultHref: '/library',
    items: [
      { label: 'E-Library', href: '/library', icon: <BookOpen className="w-4 h-4" />, mobileIcon: <BookOpen className="w-5 h-5" />, roles: INTERNAL_ROLES, showInBottomNav: false },
    ]
  },
  {
    id: 'vendor',
    label: 'Modul 3',
    description: 'Vendor Submission',
    color: 'text-violet-500',
    activeColor: 'bg-violet-500 text-white',
    bgColor: 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    icon: <Send className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
    defaultHref: '/vendor/submissions',
    items: [
      { label: 'Pengajuan Saya', href: '/vendor/submissions', icon: <Upload className="w-4 h-4" />, mobileIcon: <Upload className="w-5 h-5" />, roles: ['Vendor'], showInBottomNav: true },
      { label: 'Antrian Review', href: '/validator/queue', icon: <ClipboardList className="w-4 h-4" />, mobileIcon: <ClipboardList className="w-5 h-5" />, roles: ['Validator', 'SysAdmin', 'Admin', 'FrontDesk', 'User'], showInBottomNav: true },
    ]
  },
]

const ADMIN_ITEMS: NavItem[] = [
  { label: 'User Management', href: '/admin/users', icon: <Users className="w-4 h-4" />, roles: ['SysAdmin', 'Admin'], showInBottomNav: false },
  { label: 'Document Types', href: '/admin/document-types', icon: <FolderOpen className="w-4 h-4" />, roles: ['SysAdmin', 'Admin'], showInBottomNav: false },
  { label: 'Org Functions', href: '/admin/org-functions', icon: <Building2 className="w-4 h-4" />, roles: ['SysAdmin', 'Admin'], showInBottomNav: false },
  { label: 'System Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" />, roles: ['SysAdmin'], showInBottomNav: false },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const { permission, subscribe } = usePushNotification()

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count')
        setUnreadCount(data.unreadCount ?? 0)
      } catch { }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); router.push('/login') }
  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const visibleModules = NAV_MODULES
    .filter(mod => user?.role && mod.roles.includes(user.role))
    .map(mod => ({ ...mod, items: mod.items.filter(item => user?.role && item.roles.includes(user.role)) }))
    .filter(mod => mod.items.length > 0)

  const visibleAdminItems = ADMIN_ITEMS.filter(item => user?.role && item.roles.includes(user.role))

  // Deteksi modul aktif berdasarkan pathname
  const activeModule = visibleModules.find(mod =>
    mod.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  )

  // Menu sidebar berdasarkan modul aktif
  const sidebarItems = activeModule?.items ?? []
  const bottomNavItems = visibleModules.flatMap(m => m.items).filter(i => i.showInBottomNav).slice(0, 4)

  const getModuleDefaultHref = (mod: NavModule) => {
    if (mod.id === 'tracking' && user?.role === 'Vendor') return '/documents'
    if (mod.id === 'vendor' && user?.role !== 'Vendor') return '/validator/queue'
    return mod.defaultHref
  }

  const getRoleBadge = (role: string) => ({
    SysAdmin:  'bg-red-500/15 text-red-500 border border-red-500/20',
    Admin:     'bg-orange-500/15 text-orange-500 border border-orange-500/20',
    Validator: 'bg-blue-500/15 text-blue-500 border border-blue-500/20',
    Vendor:    'bg-violet-500/15 text-violet-500 border border-violet-500/20',
  }[role] ?? 'bg-muted text-muted-foreground border border-border')

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-[72px] px-6 gap-4">

          {/* Logo */}
          <button onClick={() => router.push('/home')} className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-foreground font-bold text-sm leading-tight">DTC System</p>
            </div>
          </button>

          <div className="hidden md:block h-5 w-px bg-border" />

          {/* Spacer */}
          <div className="flex-1" />

          {/* MODULE SWITCHER — rata kanan, ukuran besar */}
          <div className="flex items-center gap-2 bg-muted/60 rounded-2xl p-1.5">
            {visibleModules.map(mod => {
              const isActive = activeModule?.id === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => router.push(getModuleDefaultHref(mod))}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                    isActive
                      ? cn("shadow-md", mod.activeColor)
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  )}
                >
                  <span className={cn(isActive ? "text-white" : mod.color)}>{mod.icon}</span>
                  <span>{mod.label}</span>
                  <span className={cn("text-xs font-normal", isActive ? "text-white/80" : "text-muted-foreground/70")}>
                    · {mod.description}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button onClick={() => router.push('/notifications')}
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-accent transition-colors border border-transparent hover:border-border">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs text-foreground font-medium leading-tight truncate max-w-24">{user?.fullName}</p>
                  <span className={cn("text-xs px-1 py-0.5 rounded font-medium", getRoleBadge(user?.role ?? ''))}>{user?.role}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground hidden md:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-semibold">Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2"><User className="w-4 h-4" /> Profil</DropdownMenuItem>
                  <div className="px-2 py-2"><ThemeToggle /></div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2">
                  <LogOut className="w-4 h-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── BODY: SIDEBAR + CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR — menu dalam modul aktif */}
        <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col flex-shrink-0">

          {/* Modul label */}
          {activeModule && (
            <div className={cn("mx-3 mt-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg border", activeModule.bgColor, activeModule.borderColor)}>
              <span className={activeModule.color}>{activeModule.icon}</span>
              <div>
                <p className={cn("text-xs font-bold", activeModule.color)}>{activeModule.label}</p>
                <p className="text-muted-foreground text-xs">{activeModule.description}</p>
              </div>
            </div>
          )}

          {/* Menu items */}
          <nav className="flex-1 px-3 py-2 space-y-0.5">
            {sidebarItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                    isActive ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}>
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
                </button>
              )
            })}
          </nav>

          <Separator />

          {/* Admin section */}
          {visibleAdminItems.length > 0 && (
            <div className="px-3 py-3">
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2">Admin</p>
              <div className="space-y-0.5">
                {visibleAdminItems.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <button key={item.href} onClick={() => router.push(item.href)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}>
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* User info */}
          <div className="p-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/40">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium truncate">{user?.fullName}</p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium", getRoleBadge(user?.role ?? ''))}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {permission === 'default' && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
              <p className="text-primary text-xs">Aktifkan notifikasi untuk update real-time</p>
              <button onClick={subscribe} className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-lg transition-colors">Aktifkan</button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {bottomNavItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={cn("flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-12", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <span className={cn("transition-transform", isActive && "scale-110")}>{item.mobileIcon ?? item.icon}</span>
                <span className="text-xs font-medium leading-none">{item.label.split(' ')[0]}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
