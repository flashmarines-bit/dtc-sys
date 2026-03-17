'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { User, Building2, Mail, Phone, Lock, Loader2, CheckCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError('Password baru tidak cocok'); return }
    if (pwForm.newPassword.length < 8) { setError('Password minimal 8 karakter'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/api/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setSuccess('Password berhasil diubah!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Gagal mengubah password')
    } finally { setSaving(false) }
  }

  const handleLogout = () => { logout(); router.push('/login') }

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Profil Saya</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Informasi akun vendor Anda</p>
      </div>

      <div className="space-y-4">

        {/* Profile Card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-bold text-lg text-[var(--foreground)]">{user?.fullName}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
                Vendor
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: <Mail className="w-4 h-4" />, label: 'Email', value: user?.email },
              { icon: <Building2 className="w-4 h-4" />, label: 'Perusahaan', value: (user as any)?.companyName ?? '-' },
              { icon: <Phone className="w-4 h-4" />, label: 'Telepon', value: (user as any)?.contactPhone ?? '-' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--muted)] rounded-xl">
                <span className="text-[var(--muted-foreground)] flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--primary)]" /> Ubah Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {success}
              </div>
            )}
            {[
              { label: 'Password Saat Ini', field: 'currentPassword' as const },
              { label: 'Password Baru', field: 'newPassword' as const },
              { label: 'Konfirmasi Password Baru', field: 'confirmPassword' as const },
            ].map(({ label, field }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
                <input
                  type="password"
                  value={pwForm[field]}
                  onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                />
              </div>
            ))}
            <button type="submit" disabled={saving}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm text-white transition-all",
                "bg-[var(--primary)] hover:bg-blue-700 disabled:opacity-50",
                "flex items-center justify-center gap-2"
              )}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan Password'}
            </button>
          </form>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-4 rounded-2xl border-2 border-red-200 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
          <LogOut className="w-5 h-5" />
          Keluar dari Akun
        </button>

        <p className="text-center text-xs text-[var(--muted-foreground)]">DTC Vendor Portal v1.0</p>
      </div>
    </Shell>
  )
}
