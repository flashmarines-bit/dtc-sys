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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card/80">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Registrasi Berhasil!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Akun vendor Anda sudah dibuat. Silakan login untuk mulai mengajukan dokumen.
          </p>
          <Button onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-foreground w-full">
            Masuk Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <FileText className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">DTC System</h1>
          <p className="text-muted-foreground text-sm mt-1">Daftar sebagai Vendor</p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground text-lg">Buat Akun Vendor</CardTitle>
            <CardDescription className="text-muted-foreground">
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
                  <Label className="text-foreground/80">{field.label} *</Label>
                  <Input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={set(field.key)}
                    required
                    placeholder={field.placeholder}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
              ))}

              <Button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-foreground">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mendaftar...</>
                  : 'Daftar Sekarang'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground/70">
                Sudah punya akun?{' '}
                <a href="/login" className="text-blue-400 hover:text-blue-300">Masuk di sini</a>
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground/50 mt-6">© 2026 DTC System. All rights reserved.</p>
      </div>
    </div>
  )
}
