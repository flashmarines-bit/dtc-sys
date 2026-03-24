'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Truck, Library, Send, LayoutDashboard,
  ArrowRight, FileText, Users, Settings,
  ChevronRight, Bell, LogOut
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { api } from '@/lib/api'

interface Module {
  id: string
  label: string
  subtitle: string
  description: string
  longDesc: string
  href: string
  icon: React.ReactNode
  bigIcon: React.ReactNode
  color: string
  bgGradient: string
  borderColor: string
  badgeColor: string
  roles: string[]
  features: string[]
}

// Role constants — sama dengan Roles.cs di backend
const INTERNAL_ROLES = ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User']
const ALL_ROLES = ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User', 'Vendor']

const MODULES: Module[] = [
  {
    id: 'tracking',
    label: 'Modul 1',
    subtitle: 'Document Physical Tracking',
    description: 'Lacak perjalanan dokumen fisik secara real-time',
    longDesc: 'Monitor seluruh perjalanan dokumen fisik dari pengiriman hingga penerimaan dengan sistem QR Code, OTP handover, dan SLA monitoring otomatis.',
    href: '/dashboard',
    icon: <Truck className="w-6 h-6" />,
    bigIcon: <Truck className="w-16 h-16" />,
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    borderColor: 'border-blue-500/30 hover:border-blue-500/70',
    badgeColor: 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
    roles: ['SysAdmin', 'Admin', 'Verificator', 'User', 'Vendor'], // Semua role — vendor bisa tracking dokumen mereka
    features: ['QR Code Scan', 'OTP Handover', 'SLA Monitoring', 'Eskalasi Otomatis'],
  },
  {
    id: 'library',
    label: 'Modul 2',
    subtitle: 'E-Library',
    description: 'Kelola arsip dokumen digital terpusat',
    longDesc: 'Simpan, cari, dan kelola seluruh dokumen digital dengan sistem versioning, kategorisasi, dan kontrol akses berbasis peran.',
    href: '/library',
    icon: <Library className="w-6 h-6" />,
    bigIcon: <Library className="w-16 h-16" />,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    roles: ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User'],
    features: ['Versioning Dokumen', 'Full-text Search', 'Expiry Tracking', 'Kontrol Akses'],
  },
  {
    id: 'vendor',
    label: 'Modul 3',
    subtitle: 'Vendor Submission',
    description: 'Portal pengajuan dan validasi dokumen vendor',
    longDesc: 'Vendor mengajukan dokumen untuk dianalisis oleh AI dan divalidasi oleh tim internal. Dokumen yang disetujui otomatis mendapat nomor resmi.',
    href: '/vendor/submissions',
    icon: <Send className="w-6 h-6" />,
    bigIcon: <Send className="w-16 h-16" />,
    color: 'text-violet-500',
    bgGradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    borderColor: 'border-violet-500/30 hover:border-violet-500/70',
    badgeColor: 'bg-violet-500/15 text-violet-500 border border-violet-500/30',
    roles: ALL_ROLES,
    features: ['Upload & OCR', 'Analisis AI', 'Review & Validasi', 'Penomoran Otomatis'],
  },
]

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [greeting, setGreeting] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam')
    setDateStr(new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  useEffect(() => {
    api.get('/api/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); router.push('/login') }

  // Cek semua roles user — support multi-role
  const userRoles: string[] = user?.roles && user.roles.length > 0
    ? user.roles
    : user?.role ? [user.role] : []

  const visibleModules = MODULES.filter(m =>
    userRoles.some(r => m.roles.includes(r))
  )

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const getRoleBadge = (role: string) => ({
    SysAdmin:  'bg-red-500/15 text-red-500 border border-red-500/20',
    Admin:     'bg-orange-500/15 text-orange-500 border border-orange-500/20',
    Validator: 'bg-blue-500/15 text-blue-500 border border-blue-500/20',
    Vendor:    'bg-violet-500/15 text-violet-500 border border-violet-500/20',
  }[role] ?? 'bg-muted text-muted-foreground border border-border')

  const getModuleHref = (mod: Module) => {
    // Modul 1: Vendor diarahkan ke /documents (tracking), bukan /dashboard
    if (mod.id === 'tracking' && user?.role === 'Vendor') {
      return '/documents'
    }
    // Modul 3: Validator/Admin/SysAdmin ke antrian review
    if (mod.id === 'vendor' && user?.role !== 'Vendor') {
      return '/validator/queue'
    }
    return mod.href
  }

  return (
    <div className="min-h-screen bg-background">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm leading-tight">DTC System</p>
              <p className="text-muted-foreground text-xs">Document Control v1.0</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {(user?.role === 'SysAdmin' || user?.role === 'Admin') && (
              <button onClick={() => router.push('/admin/users')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Users className="w-3.5 h-3.5" /> Admin
              </button>
            )}
            <button onClick={() => router.push('/notifications')}
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-accent transition-colors border border-transparent hover:border-border">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-xs text-foreground font-medium leading-tight">{user?.fullName}</p>
                  <span className={cn("text-xs px-1 py-0.5 rounded font-medium", getRoleBadge(user?.role ?? ''))}>{user?.role}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground hidden md:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-semibold">Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2"><ThemeToggle /></div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 gap-2">
                  <LogOut className="w-4 h-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="mb-10">
          <p className="text-muted-foreground text-sm mb-1">{dateStr}</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {greeting}, <span className="text-primary">{user?.fullName}</span> 👋
          </h1>
          <p className="text-muted-foreground">Pilih modul yang ingin Anda akses hari ini.</p>
        </div>

        {/* MODULE CARDS */}
        <div className={cn(
          "grid gap-6",
          visibleModules.length === 1 ? "grid-cols-1 max-w-md" :
          visibleModules.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {visibleModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => router.push(getModuleHref(mod))}
              className={cn(
                "group relative text-left rounded-2xl border-2 bg-card overflow-hidden transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1 active:translate-y-0",
                mod.borderColor
              )}
            >
              {/* Background gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", mod.bgGradient)} />

              {/* Content */}
              <div className="relative p-7">
                {/* Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", mod.badgeColor)}>
                    {mod.label}
                  </span>
                  <ArrowRight className={cn(
                    "w-5 h-5 transition-all duration-300 group-hover:translate-x-1",
                    mod.color
                  )} />
                </div>

                {/* Icon */}
                <div className={cn("mb-5 transition-transform duration-300 group-hover:scale-110", mod.color)}>
                  {mod.bigIcon}
                </div>

                {/* Title & desc */}
                <h2 className="text-xl font-bold text-foreground mb-1">{mod.subtitle}</h2>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{mod.longDesc}</p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {mod.features.map(feature => (
                    <div key={feature} className={cn(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg",
                      "bg-background/60 border border-border/50 text-muted-foreground"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", mod.color.replace('text-', 'bg-'))} />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className={cn(
                  "mt-5 pt-4 border-t border-border/50 flex items-center justify-between"
                )}>
                  <span className={cn("text-sm font-medium", mod.color)}>Buka Modul</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all duration-300",
                    "bg-background/60 border border-border/50 text-muted-foreground",
                    "group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                  )}>
                    Masuk <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Admin quick links */}
        {(user?.role === 'SysAdmin' || user?.role === 'Admin') && (
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Administrasi</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'User Management', href: '/admin/users', icon: <Users className="w-3.5 h-3.5" /> },
                { label: 'Document Types', href: '/admin/document-types', icon: <FileText className="w-3.5 h-3.5" /> },
                ...(user?.role === 'SysAdmin' ? [{ label: 'System Settings', href: '/admin/settings', icon: <Settings className="w-3.5 h-3.5" /> }] : []),
              ].map(item => (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-card border border-border hover:border-primary/30 hover:bg-accent transition-all">
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
