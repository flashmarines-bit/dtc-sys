'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { FileText, Send, User, LogOut, Menu, X, Home, MapPin } from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { label: 'Submissions',  href: '/submissions', icon: <Home size={18} />,    modul: 'Modul 3' },
  { label: 'Tracking',     href: '/tracking',    icon: <MapPin size={18} />,  modul: 'Modul 1' },
  { label: 'Ajukan Fisik', href: '/tracking/new', icon: <Send size={18} />,    modul: 'Modul 1' },
  { label: 'Profil',       href: '/profile',     icon: <User size={18} />,    modul: '' },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => { logout(); router.push('/login') }
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── TOP NAVBAR ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, padding: '0 20px', gap: 8 }}>

          {/* Logo */}
          <button onClick={() => router.push('/submissions')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="white" />
            </div>
            <div style={{ display: 'none' }} className="sm-show">
              <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', lineHeight: 1, margin: 0 }}>DTC Vendor</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Portal Pengajuan</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href)
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                    background: active ? '#185FA5' : 'transparent',
                    color: active ? 'white' : '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f1f5f9' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.modul && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      color: active ? 'white' : '#64748b',
                      borderRadius: 4, padding: '1px 5px',
                    }}>{item.modul}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div style={{ flex: 1 }} />

          {/* User info + logout — desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{user?.fullName}</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{user?.email}</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <button onClick={handleLogout}
              style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}
              title="Keluar">
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none', padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            className="mobile-menu-btn">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{initials}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', margin: 0 }}>{user?.fullName}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{user?.email}</p>
              </div>
            </div>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href)
              return (
                <button key={item.href}
                  onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: active ? '#185FA5' : 'transparent', color: active ? 'white' : '#0f172a', marginBottom: 2 }}>
                  {item.icon}
                  {item.label}
                  {item.modul && <span style={{ fontSize: 10, fontWeight: 700, background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: active ? 'white' : '#64748b', borderRadius: 4, padding: '1px 5px', marginLeft: 'auto' }}>{item.modul}</span>}
                </button>
              )
            })}
            <button onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', color: '#dc2626', background: 'transparent', marginTop: 4 }}>
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#ffffff', borderTop: '1px solid #e2e8f0', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }} className="mobile-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 8px' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: active ? '#185FA5' : '#94a3b8', fontFamily: 'inherit', minWidth: 64 }}>
                {item.icon}
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#185FA5' }} />}
              </button>
            )
          })}
        </div>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .sm-show { display: block !important; } }
        @media (min-width: 768px) { .mobile-nav { display: none !important; } .mobile-menu-btn { display: none !important; } }
        @media (max-width: 767px) { nav > button { display: none !important; } }
      `}</style>
    </div>
  )
}
