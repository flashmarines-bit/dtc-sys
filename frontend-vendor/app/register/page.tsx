'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { FileText, Mail, Lock, User, Building2, Phone, Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    companyName: '', phoneNumber: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password || !form.companyName) {
      setError('Semua field wajib diisi'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok'); return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter'); return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/register-vendor', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        phoneNumber: form.phoneNumber || null,
      })
      setAuth(data.user, data.token, data.refreshToken)
      router.push('/submissions')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, icon, type = 'text', field, placeholder, optional = false }: {
    label: string, icon: React.ReactNode, type?: string,
    field: keyof typeof form, placeholder: string, optional?: boolean
  }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label} {optional && <span className="text-[var(--muted-foreground)] font-normal">(opsional)</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">{icon}</span>
        <input
          type={type === 'password' ? (showPass ? 'text' : 'password') : type}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Daftar Vendor</h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">Buat akun untuk mengajukan dokumen</p>
        </div>

        <div className="bg-[var(--card)] rounded-2xl shadow-xl border border-[var(--border)] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <Field label="Nama Lengkap" icon={<User className="w-4 h-4" />} field="fullName" placeholder="Nama lengkap PIC" />
            <Field label="Email" icon={<Mail className="w-4 h-4" />} type="email" field="email" placeholder="email@perusahaan.com" />
            <Field label="Nama Perusahaan" icon={<Building2 className="w-4 h-4" />} field="companyName" placeholder="PT. Nama Perusahaan" />
            <Field label="No. Telepon" icon={<Phone className="w-4 h-4" />} field="phoneNumber" placeholder="08xxxxxxxxxx" optional />
            <Field label="Password" icon={<Lock className="w-4 h-4" />} type="password" field="password" placeholder="Min. 8 karakter" />
            <Field label="Konfirmasi Password" icon={<Lock className="w-4 h-4" />} type="password" field="confirmPassword" placeholder="Ulangi password" />

            <button type="submit" disabled={loading}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm text-white mt-2",
                "bg-[var(--primary)] hover:bg-blue-700 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 shadow-md transition-all"
              )}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...</> : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Sudah punya akun?{' '}
              <button onClick={() => router.push('/login')}
                className="text-[var(--primary)] font-semibold hover:underline">
                Masuk di sini
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">DTC System v1.0 · Vendor Portal</p>
      </div>
    </div>
  )
}
