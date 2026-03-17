'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { AuthResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', {
        email,
        password,
      })
      setAuth(data.user, data.token, data.refreshToken)
      toast.success(`Selamat datang, ${data.user.fullName}!`)

      // Redirect berdasarkan role
      const role = data.user.role
      if (role === 'Vendor') router.push('/vendor/submissions')
      else if (role === 'Validator') router.push('/validator/queue')
      else router.push('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login gagal. Periksa email dan password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">DTC System</h1>
          <p className="text-slate-400 text-sm mt-1">Document Track Action Control</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Masuk ke Sistem</CardTitle>
            <CardDescription className="text-slate-400">
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Belum punya akun vendor?{' '}
                <a href="/register" className="text-blue-400 hover:text-blue-300">
                  Daftar di sini
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 DTC System. All rights reserved.
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    confirmPassword: '', companyName: '', contactPhone: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Password dan konfirmasi tidak cocok'); return
    }
    if (form.password.length < 8) {
      toast.error('Password minimal 8 karakter'); return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/register-vendor', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        contactPhone: form.contactPhone,
      })
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registrasi gagal.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Registrasi Berhasil!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Akun vendor Anda sudah dibuat. Silakan login untuk mulai mengajukan dokumen.
          </p>
          <Button onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Masuk Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">DTC System</h1>
          <p className="text-slate-400 text-sm mt-1">Daftar sebagai Vendor</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Buat Akun Vendor</CardTitle>
            <CardDescription className="text-slate-400">
              Isi data berikut untuk mulai mengajukan dokumen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { key: 'fullName', label: 'Nama Lengkap', placeholder: 'Nama lengkap PIC', type: 'text' },
                { key: 'companyName', label: 'Nama Perusahaan', placeholder: 'PT Maju Jaya', type: 'text' },
                { key: 'email', label: 'Email', placeholder: 'email@perusahaan.com', type: 'email' },
                { key: 'contactPhone', label: 'No. WhatsApp', placeholder: '08123456789', type: 'text' },
                { key: 'password', label: 'Password', placeholder: 'Min. 8 karakter', type: 'password' },
                { key: 'confirmPassword', label: 'Konfirmasi Password', placeholder: 'Ulangi password', type: 'password' },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-slate-300">{field.label} *</Label>
                  <Input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={set(field.key)}
                    required
                    placeholder={field.placeholder}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              ))}

              <Button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mendaftar...</>
                  : 'Daftar Sekarang'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <p className="text-xs text-slate-500">
                Sudah punya akun?{' '}
                <a href="/login" className="text-blue-400 hover:text-blue-300">Masuk di sini</a>
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-600 mt-6">© 2026 DTC System. All rights reserved.</p>
      </div>
    </div>
  )
}
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
            <FileText className="w-4 h-4 text-white" />
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

        <Separator className="bg-slate-800" />

        {/* Bell */}
        <div className="px-4 py-2">
          <button onClick={() => router.push('/notifications')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Notifikasi</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
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
                <DropdownMenuItem
                  onClick={() => setTheme(nextTheme)}
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {currentTheme === 'dark' ? (
                    <Moon className="w-4 h-4 mr-2" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2" />
                  )}
                  {themeLabel}
                </DropdownMenuItem>
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
              <FileText className="w-4 h-4 text-white" />
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
                  <AvatarFallback className="bg-blue-700 text-white text-xs">{initials}</AvatarFallback>
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
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors">
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
'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, ClipboardList, Activity,
  Loader2, TrendingUp, AlertTriangle, Clock,
  CheckCircle, ArrowRight, QrCode
} from 'lucide-react'

interface AdminRadar {
  overview: {
    totalActive: number
    preArrival: number
    atFrontDesk: number
    pendingConfirmation: number
    inReview: number
    droppedPendingAck: number
    waitingPickup: number
    slaBreached: number
    escalationSent: number
  }
  escalations: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    holderName: string
    slaBreached: boolean
    escalationSent: boolean
  }>
  teamPerformance: Array<{
    userId: string
    name: string
    inReview: number
    breached: number
  }>
}

interface ValidatorRadar {
  summary: {
    incomingDocuments: number
    atFrontDesk: number
    droppedForMe: number
    myActiveReview: number
    slaWarning: number
    slaBreach: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    slaBreached: boolean
    urgency: string
  }>
}

interface VendorRadar {
  myDocuments: {
    total: number
    draft: number
    submitted: number
    inTransit: number
    inReview: number
    returnedToMe: number
    approved: number
    rejected: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    action: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [radar, setRadar] = useState<AdminRadar | ValidatorRadar | VendorRadar | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radarRes, usersRes] = await Promise.allSettled([
          api.get('/api/radar'),
          api.get('/api/users?pageSize=1'),
        ])
        if (radarRes.status === 'fulfilled') setRadar(radarRes.value.data)
        if (usersRes.status === 'fulfilled') {
          setTotalUsers(usersRes.value.data.totalCount
            ?? usersRes.value.data.total ?? 0)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const role = user?.role

  // ── ADMIN / SYSADMIN DASHBOARD ────────────────────────────
  const adminRadar = radar as AdminRadar
  const validatorRadar = radar as ValidatorRadar
  const vendorRadar = radar as VendorRadar

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {user?.fullName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Role: {user?.role} · {dateStr}
          </p>
        </div>

        {/* ── ADMIN / SYSADMIN ── */}
        {(role === 'SysAdmin' || role === 'Admin') && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Dokumen Aktif', value: adminRadar?.overview?.totalActive ?? '-', icon: <FileText className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Sedang Direview', value: adminRadar?.overview?.inReview ?? '-', icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { label: 'SLA Breach', value: adminRadar?.overview?.slaBreached ?? '-', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/20' },
                { label: 'Total User', value: totalUsers || '-', icon: <Users className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Status overview */}
            {adminRadar?.overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Pre-Arrival', value: adminRadar.overview.preArrival, color: 'text-yellow-400' },
                  { label: 'Di Front Desk', value: adminRadar.overview.atFrontDesk, color: 'text-orange-400' },
                  { label: 'Menunggu Konfirmasi', value: adminRadar.overview.pendingConfirmation, color: 'text-blue-400' },
                  { label: 'Dititip Pending', value: adminRadar.overview.droppedPendingAck, color: 'text-pink-400' },
                ].map(s => (
                  <div key={s.label} className="bg-card/70 border border-border/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Escalations */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Eskalasi & SLA Breach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : adminRadar?.escalations?.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Tidak ada eskalasi</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.escalations?.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 bg-red-900/10 border border-red-700/30 rounded-lg">
                          <div>
                            <p className="text-foreground text-xs font-medium">{e.documentNumber}</p>
                            <p className="text-muted-foreground text-xs">{e.holderName ?? '-'}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            e.slaBreached ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {e.slaBreached ? 'SLA Breach' : 'Eskalasi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team performance */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Performa Tim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : adminRadar?.teamPerformance?.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Tidak ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.teamPerformance?.map(t => (
                        <div key={String(t.userId)} className="flex items-center justify-between p-2 bg-card/70 rounded-lg">
                          <p className="text-foreground text-xs">{t.name}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-blue-400">{t.inReview} review</span>
                            {t.breached > 0 && <span className="text-red-400">{t.breached} breach</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card className="bg-card border-border">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h2 className="text-foreground text-sm font-medium">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Antrian Review', href: '/validator/queue', color: 'bg-purple-600 hover:bg-purple-700' },
                    { label: 'Scan QR', href: '/mobile/scan', color: 'bg-blue-600 hover:bg-blue-700' },
                    { label: 'User Management', href: '/admin/users', color: 'bg-slate-600 hover:bg-slate-500' },
                    { label: 'Document Types', href: '/admin/document-types', color: 'bg-green-700 hover:bg-green-600' },
                  ].map(action => (
                    <button key={action.label} onClick={() => router.push(action.href)}
                      className={`${action.color} text-white text-sm text-center py-2.5 px-3 rounded-lg transition-colors`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── VALIDATOR ── */}
        {role === 'Validator' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Dokumen Menuju Saya', value: validatorRadar?.summary?.incomingDocuments ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Clock className="w-5 h-5" /> },
                { label: 'Sedang Saya Review', value: validatorRadar?.summary?.myActiveReview ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/20', icon: <ClipboardList className="w-5 h-5" /> },
                { label: 'SLA Warning', value: validatorRadar?.summary?.slaWarning ?? 0, color: 'text-red-400', bg: 'bg-red-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {validatorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm">Perlu Aksi Segera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {validatorRadar.needsAction.slice(0, 5).map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/documents/${d.id}/scan`)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        d.urgency === 'critical' ? 'bg-red-900/20 border border-red-700/30 hover:bg-red-900/30' :
                        d.urgency === 'warning' ? 'bg-orange-900/20 border border-orange-700/30 hover:bg-orange-900/30' :
                        'bg-card/70 border border-border/50 hover:bg-card/80'
                      }`}>
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-muted-foreground text-xs">{d.statusLabel}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/validator/queue')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                Antrian Review
              </button>
              <button onClick={() => router.push('/mobile/scan')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" /> Scan QR
              </button>
            </div>
          </>
        )}

        {/* ── VENDOR ── */}
        {role === 'Vendor' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Dokumen', value: vendorRadar?.myDocuments?.total ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Diproses', value: (vendorRadar?.myDocuments?.inReview ?? 0) + (vendorRadar?.myDocuments?.submitted ?? 0), color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                { label: 'Disetujui', value: vendorRadar?.myDocuments?.approved ?? 0, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Perlu Aksi', value: vendorRadar?.needsAction?.length ?? 0, color: 'text-red-400', bg: 'bg-red-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      : <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {vendorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm text-orange-400">⚠️ Perlu Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vendorRadar.needsAction.map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/vendor/submissions/${d.id}`)}
                      className="flex items-center justify-between p-3 bg-card/70 border border-border/50 rounded-lg cursor-pointer hover:bg-card/80 transition-colors">
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-orange-400 text-xs">{d.action}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <button onClick={() => router.push('/vendor/submissions/new')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors">
              + Pengajuan Baru
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
using Microsoft.AspNetCore.RateLimiting;
namespace Dtc.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }


    /// <summary>Register as vendor (public endpoint)</summary>
    [HttpPost("register-vendor")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RegisterVendor([FromBody] VendorRegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterVendorAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request.RefreshToken);
        if (response is null)
            return Unauthorized(new { error = "Invalid or expired refresh token." });
        return Ok(response);
    }

    [Authorize]
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] RefreshRequest request)
    {
        await _authService.RevokeTokenAsync(request.RefreshToken);
        return Ok(new { message = "Token revoked." });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        return Ok(new { userId, email, name, role });
    }
}
namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _service;

    public DocumentsController(IDocumentService service)
    {
        _service = service;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    /// <summary>
    /// List documents with optional filters
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? documentTypeId = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, search, documentTypeId);
        return Ok(result);
    }

    /// <summary>
    /// Get document by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }

    /// <summary>
    /// Create new document (auto-numbering)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update document metadata
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result is null) return NotFound(new { error = "Document not found." });
        return Ok(result);
    }

    /// <summary>
    /// Soft-delete document (SysAdmin, Admin)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.AdminOrAbove)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound(new { error = "Document not found." });
        return Ok(new { message = "Document deleted." });
    }

    /// <summary>
    /// Upload file to document
    /// </summary>
    [HttpPost("{id:guid}/upload")]
    public async Task<IActionResult> Upload(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _service.UploadFileAsync(id, stream, file.FileName, file.ContentType, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(502, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Download document file
    /// </summary>
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await _service.DownloadFileAsync(id);
        if (result is null) return NotFound(new { error = "File not found." });

        var (stream, fileName, contentType) = result.Value;
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// List document versions
    /// </summary>
    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid id)
    {
        var versions = await _service.GetVersionsAsync(id);
        return Ok(versions);
    }

    /// <summary>
    /// Upload new version
    /// </summary>
    [HttpPost("{id:guid}/versions")]
    public async Task<IActionResult> UploadVersion(Guid id, IFormFile file, [FromQuery] string? notes = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _service.UploadNewVersionAsync(id, stream, file.FileName, file.ContentType, notes, GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
