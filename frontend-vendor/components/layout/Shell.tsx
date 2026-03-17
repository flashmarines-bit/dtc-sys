'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { FileText, Send, User, LogOut, Menu, X, Home, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/submissions', icon: <Home className="w-5 h-5" /> },
  { label: 'Pengajuan Baru', href: '/submissions/new', icon: <Send className="w-5 h-5" /> },
  { label: 'Profil', href: '/profile', icon: <User className="w-5 h-5" /> },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center h-16 px-4 gap-4">

          {/* Logo */}
          <button onClick={() => router.push('/submissions')}
            className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm text-[var(--foreground)] leading-tight">DTC Vendor</p>
              <p className="text-xs text-[var(--muted-foreground)]">Portal Pengajuan</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  )}>
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="flex-1" />

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--foreground)] leading-tight">{user?.fullName}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate max-w-40">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Keluar">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)]">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 space-y-1">
            {/* User info mobile */}
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div>
                <p className="font-medium text-sm text-[var(--foreground)]">{user?.fullName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
              </div>
            </div>
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href
              return (
                <button key={item.href}
                  onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  )}>
                  {item.icon}
                  {item.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
              )
            })}
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)] safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all min-w-16",
                  isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                )}>
                <span className={cn("transition-transform", isActive && "scale-110")}>{item.icon}</span>
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-[var(--primary)]" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
