'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { DocumentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'

export default function NewSubmissionPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    documentTypeId: '',
    vendorCompanyName: '',
    vendorContactName: user?.fullName ?? '',
    vendorContactEmail: user?.email ?? '',
    vendorContactPhone: '',
    referenceNumber: '',
    documentDate: '',
    documentValue: '',
    notes: '',
  })

  useEffect(() => {
    api.get('/api/document-types').then(({ data }) => {
      const types = data.documentTypes ?? data
      setDocTypes(Array.isArray(types) ? types : [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentTypeId) { toast.error('Pilih jenis dokumen'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/vendor/submissions', {
        ...form,
        documentValue: form.documentValue ? parseFloat(form.documentValue) : null,
        documentDate: form.documentDate ? new Date(form.documentDate).toISOString() : null,
      })
      toast.success(`Pengajuan ${data.submissionNumber} berhasil dibuat!`)
      router.push(`/vendor/submissions/${data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal membuat pengajuan')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">Pengajuan Baru</h1>
        <p className="text-muted-foreground text-sm mb-8">Isi informasi dokumen yang akan diajukan</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Dokumen */}
          <Card className="bg-card/80 border-border">
            <CardHeader><CardTitle className="text-foreground text-base">Informasi Dokumen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">Judul Dokumen *</Label>
                <Input value={form.title} onChange={set('title')} required
                  placeholder="Contoh: Invoice Jasa Konsultasi Q1 2026"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Jenis Dokumen *</Label>
                <select value={form.documentTypeId} onChange={set('documentTypeId')} required
                  className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih jenis dokumen --</option>
                  {docTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">Nomor Referensi</Label>
                  <Input value={form.referenceNumber} onChange={set('referenceNumber')}
                    placeholder="INV-2026-001"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">Tanggal Dokumen</Label>
                  <Input type="date" value={form.documentDate} onChange={set('documentDate')}
                    className="bg-muted border-border text-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Nilai Dokumen (Rp)</Label>
                <Input type="number" value={form.documentValue} onChange={set('documentValue')}
                  placeholder="50000000"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
              </div>
            </CardContent>
          </Card>

          {/* Informasi Vendor */}
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Informasi Vendor</CardTitle>
              <CardDescription className="text-muted-foreground">Data perusahaan yang mengajukan dokumen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">Nama Perusahaan *</Label>
                <Input value={form.vendorCompanyName} onChange={set('vendorCompanyName')} required
                  placeholder="PT Maju Jaya"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground/80">Nama Kontak *</Label>
                  <Input value={form.vendorContactName} onChange={set('vendorContactName')} required
                    placeholder="Budi Santoso"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground/80">No. Telepon *</Label>
                  <Input value={form.vendorContactPhone} onChange={set('vendorContactPhone')} required
                    placeholder="08123456789"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Email Kontak *</Label>
                <Input type="email" value={form.vendorContactEmail} onChange={set('vendorContactEmail')} required
                  placeholder="budi@majujaya.com"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/70" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Catatan</Label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Informasi tambahan..."
                  className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2 flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Upload className="w-4 h-4" /> Buat Pengajuan</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}
              className="border-border text-foreground/80 hover:bg-muted">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
