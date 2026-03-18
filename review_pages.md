]633;E;cat /workspaces/dtc-sys/frontend/src/app/vendor/submissions/page.tsx;a8f8343a-3a0b-4c2b-9e3b-39cfd5d09255]633;C'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, FileText, Clock, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pending:             { label: 'Menunggu',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3 h-3" /> },
  Analysing:           { label: 'Dianalisis',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  UnderReview:         { label: 'Direview',     color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <FileText className="w-3 h-3" /> },
  Accepted:            { label: 'Disetujui',    color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  Rejected:            { label: 'Ditolak',      color: 'bg-red-500/20 text-red-400 border-red-500/30',     icon: <XCircle className="w-3 h-3" /> },
  ReturnedForRevision: { label: 'Perlu Revisi', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <RotateCcw className="w-3 h-3" /> },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-500/20 text-slate-400', icon: null }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

export default function VendorSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get<VendorSubmission[]>('/api/vendor/submissions')
      setSubmissions(data)
    } catch {
      toast.error('Gagal memuat daftar pengajuan')
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => ['Pending', 'Analysing', 'UnderReview'].includes(s.statusLabel)).length,
    approved: submissions.filter(s => s.statusLabel === 'Accepted').length,
    rejected: submissions.filter(s => ['Rejected', 'ReturnedForRevision'].includes(s.statusLabel)).length,
  }

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Pengajuan Dokumen</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola pengajuan dokumen Anda</p>
          </div>
          <Button
            onClick={() => router.push('/vendor/submissions/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Pengajuan Baru
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Diproses', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Disetujui', value: stats.approved, color: 'text-green-400' },
            { label: 'Ditolak', value: stats.rejected, color: 'text-red-400' },
          ].map(s => (
            <Card key={s.label} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base">Daftar Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-slate-400 ml-3">Memuat data...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Belum ada pengajuan</p>
                <p className="text-slate-500 text-sm mt-1">Klik "Pengajuan Baru" untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => router.push(`/vendor/submissions/${sub.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 cursor-pointer transition-colors border border-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{sub.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {sub.submissionNumber} · {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.aiScore && (
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-slate-400">AI Score</p>
                          <p className="text-sm font-medium text-blue-400">{sub.aiScore}/10</p>
                        </div>
                      )}
                      <StatusBadge status={sub.statusLabel} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
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
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">Pengajuan Baru</h1>
        <p className="text-slate-400 text-sm mb-8">Isi informasi dokumen yang akan diajukan</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Dokumen */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white text-base">Informasi Dokumen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Judul Dokumen *</Label>
                <Input value={form.title} onChange={set('title')} required
                  placeholder="Contoh: Invoice Jasa Konsultasi Q1 2026"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Jenis Dokumen *</Label>
                <select value={form.documentTypeId} onChange={set('documentTypeId')} required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih jenis dokumen --</option>
                  {docTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nomor Referensi</Label>
                  <Input value={form.referenceNumber} onChange={set('referenceNumber')}
                    placeholder="INV-2026-001"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tanggal Dokumen</Label>
                  <Input type="date" value={form.documentDate} onChange={set('documentDate')}
                    className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Nilai Dokumen (Rp)</Label>
                <Input type="number" value={form.documentValue} onChange={set('documentValue')}
                  placeholder="50000000"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
            </CardContent>
          </Card>

          {/* Informasi Vendor */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Informasi Vendor</CardTitle>
              <CardDescription className="text-slate-400">Data perusahaan yang mengajukan dokumen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nama Perusahaan *</Label>
                <Input value={form.vendorCompanyName} onChange={set('vendorCompanyName')} required
                  placeholder="PT Maju Jaya"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nama Kontak *</Label>
                  <Input value={form.vendorContactName} onChange={set('vendorContactName')} required
                    placeholder="Budi Santoso"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">No. Telepon *</Label>
                  <Input value={form.vendorContactPhone} onChange={set('vendorContactPhone')} required
                    placeholder="08123456789"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email Kontak *</Label>
                <Input type="email" value={form.vendorContactEmail} onChange={set('vendorContactEmail')} required
                  placeholder="budi@majujaya.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Catatan</Label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Informasi tambahan..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Upload className="w-4 h-4" /> Buat Pengajuan</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}
              className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle,
         RotateCcw, Clock, FileText, AlertTriangle } from 'lucide-react'

const STATUS_STEPS = [
  { key: 'Pending',             label: 'Menunggu Upload',  desc: 'File PDF belum diupload' },
  { key: 'Analysing',           label: 'Dianalisis',       desc: 'OCR & AI sedang memproses' },
  { key: 'UnderReview',         label: 'Direview',         desc: 'Validator sedang mereview' },
  { key: 'Accepted',            label: 'Disetujui',        desc: 'Dokumen diterima' },
]

export default function VendorSubmissionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSub()
  }, [id])

  // FIX: Auto-refresh pakai sub sebagai dependency agar tidak stale closure
  useEffect(() => {
    if (sub?.statusLabel !== 'Analysing') return
    const interval = setInterval(fetchSub, 10000)
    return () => clearInterval(interval)
  }, [sub?.statusLabel])

  const fetchSub = async () => {
    try {
      const { data } = await api.get<VendorSubmission>(`/api/vendor/submissions/${id}`)
      setSub(data)
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diterima')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/api/vendor/submissions/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('File berhasil diupload! Analisis dimulai...')
      await fetchSub()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleResubmit = async () => {
    try {
      const { data } = await api.post(`/api/vendor/submissions/${id}/resubmit`, {
        notes: 'Resubmission dari vendor'
      })
      toast.success('Resubmission berhasil! Silakan upload file baru.')
      router.push(`/vendor/submissions/${data.newSubmissionId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal resubmit')
    }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-slate-400 ml-3">Memuat data...</span>
      </div>
    </AppShell>
  )

  if (!sub) return (
    <AppShell>
      <div className="p-8 text-slate-400">Submission tidak ditemukan.</div>
    </AppShell>
  )

  const canUpload = sub.statusLabel === 'Pending'
  const canResubmit = sub.statusLabel === 'Rejected' || sub.statusLabel === 'ReturnedForRevision'
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === sub.statusLabel)
  const isTerminal = ['Accepted', 'Rejected', 'ReturnedForRevision'].includes(sub.statusLabel)

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">{sub.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{sub.submissionNumber} · {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            sub.statusLabel === 'Rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            sub.statusLabel === 'ReturnedForRevision' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Analysing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        {/* Progress stepper */}
        {!isTerminal && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx < currentStepIdx ? 'bg-green-600 text-white' :
                        idx === currentStepIdx ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' :
                        'bg-slate-700 text-slate-500'
                      }`}>
                        {idx < currentStepIdx ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <p className={`text-xs mt-2 text-center max-w-16 ${idx === currentStepIdx ? 'text-blue-400' : idx < currentStepIdx ? 'text-green-400' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-6 ${idx < currentStepIdx ? 'bg-green-600' : 'bg-slate-700'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status cards untuk terminal states */}
        {sub.statusLabel === 'Accepted' && (
          <Card className="bg-green-900/20 border-green-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">Pengajuan Disetujui!</p>
                  {sub.resultDocumentNumber && (
                    <p className="text-green-300/70 text-sm mt-1">
                      Nomor Dokumen: <span className="font-bold text-green-300">{sub.resultDocumentNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'Rejected' && (
          <Card className="bg-red-900/20 border-red-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Pengajuan Ditolak</p>
                  {sub.rejectionReason && (
                    <p className="text-red-300/70 text-sm mt-1">{sub.rejectionReason}</p>
                  )}
                  {sub.resubmissionCount < sub.maxResubmissions && (
                    <Button onClick={handleResubmit} size="sm"
                      className="mt-3 bg-red-700 hover:bg-red-600 text-white gap-2">
                      <RotateCcw className="w-3 h-3" /> Ajukan Ulang ({sub.maxResubmissions - sub.resubmissionCount}x tersisa)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'ReturnedForRevision' && (
          <Card className="bg-orange-900/20 border-orange-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-400 font-medium">Perlu Revisi</p>
                  {sub.returnNotes && (
                    <p className="text-orange-300/70 text-sm mt-1">{sub.returnNotes}</p>
                  )}
                  <Button onClick={handleResubmit} size="sm"
                    className="mt-3 bg-orange-700 hover:bg-orange-600 text-white gap-2">
                    <RotateCcw className="w-3 h-3" /> Ajukan Ulang dengan Revisi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Upload section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> File Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canUpload ? (
                <div>
                  <p className="text-slate-400 text-xs mb-3">Upload file PDF (maks. 100MB, min. 300 DPI)</p>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload}
                    className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload">
                    <div className={`border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <><Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
                        <p className="text-slate-400 text-sm">Mengupload...</p></>
                      ) : (
                        <><Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Klik untuk pilih PDF</p>
                        <p className="text-slate-500 text-xs mt-1">atau drag & drop</p></>
                      )}
                    </div>
                  </label>
                </div>
              ) : sub.fileName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm truncate max-w-40">{sub.fileName}</p>
                    <p className="text-slate-400 text-xs">{sub.pageCount > 0 ? `${sub.pageCount} halaman` : 'Sedang diproses'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Belum ada file</p>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Detail Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'Perusahaan', value: sub.vendorCompanyName },
                { label: 'Ref', value: sub.referenceNumber || '-' },
                { label: 'Nilai', value: sub.documentValue ? `Rp ${sub.documentValue.toLocaleString('id-ID')}` : '-' },
                { label: 'Kadaluarsa', value: new Date(sub.expiresAt).toLocaleDateString('id-ID') },
                { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Analysing indicator */}
        {sub.statusLabel === 'Analysing' && (
          <Card className="bg-blue-900/20 border-blue-700/50 mt-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">Analisis sedang berjalan...</p>
                  <p className="text-blue-300/70 text-xs mt-0.5">OCR & AI sedang memproses dokumen Anda. Halaman ini akan otomatis refresh.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ClipboardList, Loader2, Star, AlertCircle, CheckCircle } from 'lucide-react'

function AiScoreBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-slate-500 text-xs">-</span>
  const color = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-sm font-bold ${color}`}>{score}/10</span>
}

export default function ValidatorQueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorSubmission[]>('/api/validator/queue')
      .then(({ data }) => setQueue(data))
      .catch(() => toast.error('Gagal memuat antrian'))
      .finally(() => setLoading(false))
  }, [])

  const readyToReview = queue.filter(s => s.statusLabel === 'UnderReview' && s.analysisCompleted)
  const analyzing = queue.filter(s => ['Pending', 'Analysing'].includes(s.statusLabel))

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Antrian Review</h1>
          <p className="text-slate-400 text-sm mt-1">
            {readyToReview.length} pengajuan siap direview
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Siap Review</p>
                  <p className="text-2xl font-bold text-white">{readyToReview.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Sedang Dianalisis</p>
                  <p className="text-2xl font-bold text-white">{analyzing.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Antrian</p>
                  <p className="text-2xl font-bold text-white">{queue.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue list */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base">Daftar Antrian</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-slate-400 ml-3">Memuat antrian...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-slate-400">Antrian kosong</p>
                <p className="text-slate-500 text-sm mt-1">Semua pengajuan telah diproses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(sub => (
                  <div key={sub.id}
                    onClick={() => router.push(`/validator/review/${sub.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 cursor-pointer transition-colors border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${sub.analysisCompleted ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{sub.title}</p>
                          {!sub.analysisCompleted && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Analisis...</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                        </p>
                        {sub.detectedDocumentType && (
                          <p className="text-slate-400 text-xs mt-1">
                            Tipe: <span className="text-blue-400">{sub.detectedDocumentType}</span>
                            {sub.detectedSignatoryName && ` · Penandatangan: ${sub.detectedSignatoryName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400 mb-1">AI Score</p>
                        <AiScoreBadge score={sub.aiScore} />
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400 mb-1">DPI</p>
                        <span className={`text-xs font-medium ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ? `${sub.detectedDpi} DPI` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText,
         Loader2, Star, Shield, AlertTriangle, ExternalLink } from 'lucide-react'

export default function ValidatorReviewPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCategory, setRejectCategory] = useState('KualitasScanTidakMemadai')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    api.get<VendorSubmission>(`/api/validator/review/${id}`)
      .then(({ data }) => setSub(data))
      .catch(() => toast.error('Gagal memuat data submission'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/approve`)
      toast.success('Pengajuan disetujui! Dokumen berhasil dibuat.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyetujui')
    } finally { setActing(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Isi alasan penolakan'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/reject`, {
        rejectionCategory: rejectCategory,
        rejectionReason: rejectReason,
        validatorNotes: null
      })
      toast.success('Pengajuan ditolak. Email notifikasi terkirim ke vendor.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menolak')
    } finally { setActing(false) }
  }

  const handleReturn = async () => {
    if (!returnNotes.trim()) { toast.error('Isi catatan revisi'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/return-for-revision`, { returnNotes })
      toast.success('Pengajuan dikembalikan untuk revisi.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal mengembalikan')
    } finally { setActing(false) }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-slate-400 ml-3">Memuat data...</span>
      </div>
    </AppShell>
  )

  if (!sub) return (
    <AppShell>
      <div className="p-8 text-slate-400">Submission tidak ditemukan.</div>
    </AppShell>
  )

  const extractedFields = sub.extractedFieldsJson
    ? (() => { try { return JSON.parse(sub.extractedFieldsJson!) } catch { return null } })()
    : null

  const canAct = sub.statusLabel === 'UnderReview'
  const isPending = sub.statusLabel === 'Pending' || sub.statusLabel === 'Analysing'

  return (
    <AppShell>
      <div className="p-8 max-w-4xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Antrian
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{sub.title}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Hasil Analisis AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!sub.analysisCompleted ? (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analisis sedang berjalan...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">AI Score</p>
                        <p className={`text-2xl font-bold ${
                          (sub.aiScore ?? 0) >= 8 ? 'text-green-400' :
                          (sub.aiScore ?? 0) >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{sub.aiScore ?? '-'}<span className="text-sm text-slate-400">/10</span></p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">Grade</p>
                        <p className="text-lg font-bold text-blue-400">{sub.aiGradeLabel ?? '-'}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">DPI</p>
                        <p className={`text-lg font-bold ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ?? '-'}
                          {sub.detectedDpi && <span className="text-xs text-slate-400 ml-1">dpi</span>}
                        </p>
                      </div>
                    </div>
                    {sub.aiSummary && (
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">Ringkasan AI</p>
                        <p className="text-slate-300 text-sm">{sub.aiSummary}</p>
                      </div>
                    )}
                    {sub.detectedDocumentType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Tipe Terdeteksi:</span>
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                          {sub.detectedDocumentType}
                        </span>
                      </div>
                    )}
                    {sub.detectedSignatoryName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Penandatangan:</span>
                        <span className="text-white">{sub.detectedSignatoryName}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {extractedFields && Object.keys(extractedFields).length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Field Terekstrak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(extractedFields).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
                        <span className="text-slate-400 text-sm min-w-32">{k}</span>
                        <span className="text-white text-sm">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showRejectForm && (
              <Card className="bg-red-900/10 border-red-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-400 text-base">Tolak Pengajuan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Kategori</label>
                    <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm">
                      <option value="KualitasScanTidakMemadai">Kualitas Scan Tidak Memadai</option>
                      <option value="DokumenTidakLengkap">Dokumen Tidak Lengkap</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Alasan *</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      rows={3} placeholder="Jelaskan alasan penolakan..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReject} disabled={acting}
                      className="bg-red-600 hover:bg-red-700 text-white gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Konfirmasi Tolak
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showReturnForm && (
              <Card className="bg-orange-900/10 border-orange-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 text-base">Kembalikan untuk Revisi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Catatan Revisi *</label>
                    <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
                      rows={3} placeholder="Jelaskan apa yang perlu diperbaiki..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReturn} disabled={acting}
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Konfirmasi Kembalikan
                    </Button>
                    <Button variant="outline" onClick={() => setShowReturnForm(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isPending && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {sub.statusLabel === 'Analysing' ? 'Analisis AI sedang berjalan...' : 'Menunggu diproses...'}
                  </div>
                </CardContent>
              </Card>
            )}
            {canAct && !showRejectForm && !showReturnForm && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleApprove} disabled={acting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Setujui
                  </Button>
                  <Button onClick={() => { setShowReturnForm(true); setShowRejectForm(false) }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <RotateCcw className="w-4 h-4" /> Kembalikan untuk Revisi
                  </Button>
                  <Button onClick={() => { setShowRejectForm(true); setShowReturnForm(false) }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Info Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Perusahaan', value: sub.vendorCompanyName },
                  { label: 'Kontak', value: sub.vendorContactName },
                  { label: 'Email', value: sub.vendorContactEmail },
                  { label: 'File', value: sub.fileName || '-' },
                  { label: 'Halaman', value: sub.pageCount ? `${sub.pageCount} hal` : '-' },
                  { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white text-right text-xs truncate max-w-32">{item.value}</span>
                  </div>
                ))}
                {sub.originalPdfUrl && (
                  <a href={sub.originalPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs mt-2">
                    <ExternalLink className="w-3 h-3" /> Lihat PDF Asli
                  </a>
                )}
              </CardContent>
            </Card>

            {!sub.dpiPass && sub.detectedDpi && (
              <Card className="bg-red-900/20 border-red-700/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">DPI Terlalu Rendah</p>
                      <p className="text-red-300/70 text-xs mt-1">{sub.detectedDpi} DPI (min. 300)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Dienkripsi & terverifikasi</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Loader2, UserCheck, UserX, Shield } from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  companyName?: string
}

const ROLES = ['SysAdmin', 'Admin', 'Validator', 'User', 'Vendor']

const ROLE_COLORS: Record<string, string> = {
  SysAdmin:  'bg-red-500/20 text-red-400 border-red-500/30',
  Admin:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Validator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  User:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Vendor:    'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'User', isActive: true
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users?pageSize=100')
      setUsers(data.users ?? data.items ?? data ?? [])
    } catch { toast.error('Gagal memuat users') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditUser(null)
    setForm({ fullName: '', email: '', password: '', role: 'User', isActive: true })
    setShowModal(true)
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role, isActive: u.isActive })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.fullName || !form.email) { toast.error('Nama dan email wajib diisi'); return }
    if (!editUser && !form.password) { toast.error('Password wajib untuk user baru'); return }
    setSaving(true)
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {})
        })
        toast.success('User berhasil diperbarui')
      } else {
        await api.post('/api/users', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive
        })
        toast.success('User berhasil dibuat')
      }
      setShowModal(false)
      await fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleToggleActive = async (u: User) => {
    try {
      await api.put(`/api/users/${u.id}`, { ...u, isActive: !u.isActive })
      toast.success(`User ${u.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      await fetchUsers()
    } catch { toast.error('Gagal mengubah status') }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus user ${u.fullName}?`)) return
    try {
      await api.delete(`/api/users/${u.id}`)
      toast.success('User dihapus')
      await fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menghapus')
    }
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }))
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola pengguna dan hak akses sistem</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-xs">Total User</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-xs">Aktif</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-xs">Validator</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">
                {stats.byRole.find(r => r.role === 'Validator')?.count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-xs">Vendor</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {stats.byRole.find(r => r.role === 'Vendor')?.count ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-white text-base flex-1">Daftar Pengguna</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama, email, role..."
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-slate-400 ml-3">Memuat data...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Pengguna</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Bergabung</div>
                  <div className="col-span-2 text-right">Aksi</div>
                </div>
                {filtered.map(u => (
                  <div key={u.id} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.fullName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.fullName}</p>
                          <p className="text-slate-400 text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] ?? 'bg-slate-500/20 text-slate-400'}`}>
                        <Shield className="w-3 h-3" /> {u.role}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                        {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="col-span-2 text-slate-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(u)}
                        className={`p-1.5 rounded transition-colors ${u.isActive ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-green-900/30 text-slate-400 hover:text-green-400'}`}>
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDelete(u)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Tidak ada user yang cocok dengan pencarian
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Create/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Lengkap *</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
                placeholder="Nama lengkap" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="email@perusahaan.com" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="••••••••" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Role *</Label>
              <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                className="w-4 h-4 accent-blue-500" />
              <Label htmlFor="isActive" className="text-slate-300 cursor-pointer">User Aktif</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Loader2, Mail, Clock, FileText, Shield, RefreshCw } from 'lucide-react'

interface Setting {
  key: string
  value: string
  description?: string
}

const SETTING_GROUPS = [
  {
    title: 'Email / SMTP',
    icon: <Mail className="w-4 h-4 text-blue-400" />,
    keys: [
      { key: 'Email:SmtpServer',   label: 'SMTP Server',     placeholder: 'smtp.gmail.com' },
      { key: 'Email:SmtpPort',     label: 'SMTP Port',       placeholder: '587' },
      { key: 'Email:SenderEmail',  label: 'Sender Email',    placeholder: 'noreply@company.com' },
      { key: 'Email:SenderName',   label: 'Sender Name',     placeholder: 'DTC System' },
      { key: 'Email:AppPassword',  label: 'App Password',    placeholder: '••••••••••••••••', type: 'password' },
      { key: 'Email:ValidatorEmail', label: 'Validator Email', placeholder: 'validator@company.com' },
    ]
  },
  {
    title: 'SLA Thresholds',
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    keys: [
      { key: 'Sla:UnprocessedHours',   label: 'Alert: Belum Diproses (jam)',  placeholder: '4' },
      { key: 'Sla:PendingReviewHours', label: 'Alert: Belum Direview (jam)',  placeholder: '8' },
      { key: 'Sla:ExpiryWarningDays',  label: 'Alert: Mendekati Kadaluarsa (hari)', placeholder: '3' },
    ]
  },
  {
    title: 'Document Rules',
    icon: <FileText className="w-4 h-4 text-green-400" />,
    keys: [
      { key: 'Document:MinDpi',         label: 'Minimum DPI',              placeholder: '300' },
      { key: 'Document:MaxFileSizeMb',  label: 'Max File Size (MB)',       placeholder: '100' },
      { key: 'Document:ExpiryDays',     label: 'Submission Expiry (hari)', placeholder: '30' },
      { key: 'Document:MaxResubmissions', label: 'Max Resubmissions',      placeholder: '3' },
    ]
  },
  {
    title: 'Security',
    icon: <Shield className="w-4 h-4 text-red-400" />,
    keys: [
      { key: 'Security:RateLimit:AuthPerMinute',    label: 'Rate Limit Auth (req/menit)',    placeholder: '10' },
      { key: 'Security:RateLimit:UploadPerMinute',  label: 'Rate Limit Upload (req/menit)',  placeholder: '20' },
      { key: 'Security:RateLimit:GlobalPerMinute',  label: 'Rate Limit Global (req/menit)',  placeholder: '200' },
    ]
  },
]

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/api/system-settings')
      const map: Record<string, string> = {}
      const arr = Array.isArray(data) ? data : data.settings ?? []
      arr.forEach((s: Setting) => { map[s.key] = s.value })
      setSettings(map)
    } catch { toast.error('Gagal memuat settings') }
    finally { setLoading(false) }
  }

  const handleChange = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    setDirty(d => new Set(d).add(key))
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      const value = settings[key] ?? ''
      // Coba update dulu, kalau 404 baru create
      try {
        await api.put(`/api/system-settings/${encodeURIComponent(key)}`, { key, value })
      } catch (e: any) {
        if (e.response?.status === 404) {
          await api.post('/api/system-settings', { key, value })
        } else throw e
      }
      setDirty(d => { const nd = new Set(d); nd.delete(key); return nd })
      toast.success(`${key} disimpan`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(null) }
  }

  const handleSaveGroup = async (keys: string[]) => {
    for (const key of keys) {
      if (dirty.has(key)) await handleSave(key)
    }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-slate-400 ml-3">Memuat settings...</span>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">System Settings</h1>
            <p className="text-slate-400 text-sm mt-1">Konfigurasi sistem DTC</p>
          </div>
          <Button onClick={fetchSettings} variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="space-y-6">
          {SETTING_GROUPS.map(group => (
            <Card key={group.title} className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  {group.icon} {group.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  {group.keys.filter(k => dirty.has(k.key)).length > 0 && (
                    <span className="text-yellow-400">
                      {group.keys.filter(k => dirty.has(k.key)).length} perubahan belum disimpan
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.keys.map(item => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-slate-300 text-xs block mb-1">{item.label}</label>
                      <div className="flex gap-2">
                        <Input
                          type={item.type ?? 'text'}
                          value={settings[item.key] ?? ''}
                          onChange={e => handleChange(item.key, e.target.value)}
                          placeholder={item.placeholder}
                          className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm flex-1 ${
                            dirty.has(item.key) ? 'border-yellow-500/50' : ''
                          }`}
                        />
                        {dirty.has(item.key) && (
                          <Button onClick={() => handleSave(item.key)}
                            disabled={saving === item.key} size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 px-3">
                            {saving === item.key
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Save className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {group.keys.some(k => dirty.has(k.key)) && (
                  <div className="pt-2 border-t border-slate-700">
                    <Button
                      onClick={() => handleSaveGroup(group.keys.map(k => k.key))}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm"
                      size="sm">
                      <Save className="w-3 h-3" /> Simpan Semua Perubahan di Grup Ini
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, FileText, Hash } from 'lucide-react'

interface DocType {
  id: string
  name: string
  code: string
  description?: string
  numberingFormat: string
  sequencePadding: number
  isActive?: boolean
  createdAt?: string
}

export default function DocumentTypesPage() {
  const [types, setTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<DocType | null>(null)
  const [saving, setSaving] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    numberingFormat: '{CODE}/{YEAR}/{SEQ:5}',
    sequencePadding: 5, isActive: true
  })

  useEffect(() => { fetchTypes() }, [])

  const fetchTypes = async () => {
    try {
      const { data } = await api.get('/api/document-types?pageSize=100')
      const arr = data.documentTypes ?? data.items ?? (Array.isArray(data) ? data : [])
      setTypes(arr)
    } catch { toast.error('Gagal memuat document types') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', code: '', description: '', numberingFormat: '{CODE}/{YEAR}/{SEQ:5}', sequencePadding: 5, isActive: true })
    setShowModal(true)
  }

  const openEdit = (t: DocType) => {
    setEditItem(t)
    setForm({
      name: t.name, code: t.code, description: t.description ?? '',
      numberingFormat: t.numberingFormat, sequencePadding: t.sequencePadding,
      isActive: t.isActive ?? true
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nama dan kode wajib diisi'); return }
    setSaving(true)
    try {
      const payload = { ...form, sequencePadding: Number(form.sequencePadding) }
      if (editItem) {
        await api.put(`/api/document-types/${editItem.id}`, payload)
        toast.success('Document type diperbarui')
      } else {
        await api.post('/api/document-types', payload)
        toast.success('Document type dibuat')
      }
      setShowModal(false)
      await fetchTypes()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (t: DocType) => {
    if (!confirm(`Hapus document type "${t.name}"?`)) return
    try {
      await api.delete(`/api/document-types/${t.id}`)
      toast.success('Document type dihapus')
      await fetchTypes()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menghapus')
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Document Types</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola jenis dokumen dan format penomoran</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLegend(true)}
              className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 transition-colors">
              📖 Panduan Format Penomoran
            </button>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Tambah Tipe
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-slate-400 ml-3">Memuat...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map(t => (
              <Card key={t.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{t.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded mt-0.5">
                          <Hash className="w-3 h-3" />{t.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {t.description && (
                    <p className="text-slate-400 text-xs mb-3">{t.description}</p>
                  )}
                  <div className="bg-slate-700/50 rounded p-2">
                    <p className="text-slate-500 text-xs mb-0.5">Format Penomoran</p>
                    <code className="text-blue-300 text-xs font-mono">{t.numberingFormat}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
            {types.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>Belum ada document type</p>
              </div>
            )}
          </div>
        )}
      </div>

            {/* Legend Dialog */}
      <Dialog open={showLegend} onOpenChange={setShowLegend}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white !max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">📖 Panduan Format Penomoran</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-3">

            {/* Variable table */}
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-700/60 border-b border-slate-600">
                    <th className="text-left px-4 py-2.5 text-slate-300 font-medium w-28">Variabel</th>
                    <th className="text-left px-4 py-2.5 text-slate-300 font-medium">Keterangan</th>
                    <th className="text-left px-4 py-2.5 text-slate-300 font-medium w-44">Contoh Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {[
                    { var: '{YEAR}',   color: 'text-blue-400',   desc: 'Tahun 4 digit saat dokumen dibuat',              example: '2026' },
                    { var: '{CODE}',   color: 'text-green-400',  desc: 'Kode singkat tipe dokumen',                      example: 'INV, CTR, SP3' },
                    { var: '{TYPE}',   color: 'text-green-400',  desc: 'Nama lengkap tipe dokumen',                      example: 'Invoice, Contract' },
                    { var: '{DEPT}',   color: 'text-yellow-400', desc: 'Kode departemen dari Organization Function',     example: 'PHR, ENG, FIN' },
                    { var: '{FUNGSI}', color: 'text-yellow-400', desc: 'Nama lengkap Organization Function',             example: 'DWI Engineering' },
                    { var: '{SUFFIX}', color: 'text-orange-400', desc: 'Suffix kode dari Organization Function',         example: 'S0, R1, P2' },
                    { var: '{SEQ}',    color: 'text-purple-400', desc: 'Nomor urut otomatis, reset tiap tahun',          example: '1, 2, 42, 100' },
                    { var: '{SEQ:5}',  color: 'text-purple-400', desc: 'Nomor urut dengan zero-padding 5 digit',         example: '00001, 00042' },
                    { var: '{SEQ:3}',  color: 'text-purple-400', desc: 'Nomor urut dengan zero-padding 3 digit',         example: '001, 042, 100' },
                  ].map((item, i) => (
                    <tr key={item.var} className={i % 2 === 0 ? 'bg-slate-700/20' : ''}>
                      <td className="px-4 py-3">
                        <code className={`font-mono font-bold text-sm ${item.color}`}>{item.var}</code>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs leading-relaxed">{item.desc}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-medium">{item.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contoh lengkap */}
            <div>
              <p className="text-slate-300 text-sm font-medium mb-3">💡 Contoh Format Lengkap</p>
              <div className="space-y-2">
                {[
                  { fmt: 'INV/{YEAR}/{SEQ:5}',                    result: 'INV/2026/00042' },
                  { fmt: '{CODE}/{YEAR}/{DEPT}/{SEQ:5}',           result: 'CTR/2026/PHR/00001' },
                  { fmt: '{SEQ:3}/{CODE}/{YEAR}',                  result: '001/SP3/2026' },
                  { fmt: '{SEQ}/{TYPE}/{YEAR}-{SUFFIX}',           result: '1/Invoice/2026-S0' },
                ].map(ex => (
                  <div key={ex.fmt} className="flex items-center gap-3 bg-slate-700/30 px-4 py-2.5 rounded-lg">
                    <code className="text-blue-300 font-mono text-sm flex-1">{ex.fmt}</code>
                    <span className="text-slate-500 text-xs">→</span>
                    <span className="text-emerald-400 font-medium text-sm">{ex.result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-4">
              <p className="text-amber-400 text-xs font-medium mb-1">⚠️ Catatan Penting</p>
              <p className="text-slate-300 text-xs leading-relaxed">
                Variabel <code className="text-yellow-400 font-mono">{'{DEPT}'}</code>,{' '}
                <code className="text-yellow-400 font-mono">{'{FUNGSI}'}</code>, dan{' '}
                <code className="text-yellow-400 font-mono">{'{SUFFIX}'}</code>{' '}
                diisi otomatis dari <span className="text-blue-400 font-medium">Organization Function</span> yang dipilih
                saat dokumen dibuat. Pastikan data org function sudah dikonfigurasi sebelum menggunakan variabel ini.
              </p>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editItem ? 'Edit Document Type' : 'Tambah Document Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Nama *</Label>
                <Input value={form.name} onChange={set('name')} placeholder="Invoice"
                  className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Kode *</Label>
                <Input value={form.code} onChange={set('code')} placeholder="INV"
                  className="bg-slate-700 border-slate-600 text-white text-sm uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Deskripsi</Label>
              <Input value={form.description} onChange={set('description')} placeholder="Deskripsi singkat"
                className="bg-slate-700 border-slate-600 text-white text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Format Penomoran *</Label>
              <Input value={form.numberingFormat} onChange={set('numberingFormat')}
                placeholder="INV/{YEAR}/{SEQ:5}"
                className="bg-slate-700 border-slate-600 text-white text-sm font-mono" />
              <p className="text-slate-500 text-xs">
                Variabel: {'{YEAR}'}, {'{DEPT}'}, {'{SEQ:N}'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs">Sequence Padding</Label>
              <Input type="number" value={form.sequencePadding}
                onChange={e => setForm(f => ({...f, sequencePadding: parseInt(e.target.value)}))}
                min={1} max={10}
                className="bg-slate-700 border-slate-600 text-white text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="dtActive" checked={form.isActive}
                onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                className="w-4 h-4 accent-blue-500" />
              <Label htmlFor="dtActive" className="text-slate-300 text-sm cursor-pointer">Aktif</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Search, FileText, Loader2, Download,
  BookOpen, Calendar, Tag, ExternalLink, AlertTriangle
} from 'lucide-react'

interface LibraryDoc {
  id: string
  documentNumber: string
  title: string
  description?: string
  tags?: string
  category?: string
  libraryStatus: number
  libraryStatusLabel: string
  documentTypeName: string
  createdByUserName: string
  approvedAt?: string
  versionCount: number
  contentExpiresAt?: string
  contractNumber?: string
  isConfidential: boolean
  createdAt: string
}

export default function LibraryPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<LibraryDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/api/library?approvedOnly=true&pageSize=50')
      setDocs(data.documents ?? [])
    } catch { toast.error('Gagal memuat library') }
    finally { setLoading(false) }
  }

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { fetchDocs(); return }
    if (q.length < 3) return
    setSearching(true)
    try {
      const { data } = await api.get(`/api/library/search?q=${encodeURIComponent(q)}`)
      setDocs(data.documents ?? [])
    } catch { /* silent */ }
    finally { setSearching(false) }
  }

  const handleDownload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await api.get(`/api/library/${id}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `document-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Gagal download file') }
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 30
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" /> E-Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Arsip dokumen digital perusahaan
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {searching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
          )}
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Cari judul, tag, nomor kontrak, isi dokumen..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-slate-400 ml-3">Memuat library...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? 'Tidak ada hasil untuk pencarian ini' : 'Library kosong'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map(doc => (
              <Card key={doc.id}
                onClick={() => router.push(`/library/${doc.id}`)}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-500 cursor-pointer transition-all hover:bg-slate-800">
                <CardContent className="pt-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.isConfidential && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                          Rahasia
                        </span>
                      )}
                      {isExpiringSoon(doc.contentExpiresAt) && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                      <button
                        onClick={e => handleDownload(doc.id, e)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                    {doc.title}
                  </p>
                  <p className="text-slate-500 text-xs">{doc.documentNumber}</p>

                  {/* Tags */}
                  {doc.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.split(',').slice(0, 3).map(tag => (
                        <span key={tag.trim()}
                          className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-slate-500 text-xs">{doc.documentTypeName}</span>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      {doc.contentExpiresAt && (
                        <span className={`flex items-center gap-1 ${isExpiringSoon(doc.contentExpiresAt) ? 'text-yellow-400' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.contentExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span>{doc.versionCount}v</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: number
  priority: number
  entityType?: string
  entityId?: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
}

const PRIORITY_COLORS: Record<number, string> = {
  0: 'border-l-slate-500',
  1: 'border-l-blue-500',
  2: 'border-l-orange-500',
  3: 'border-l-red-500',
}

const PRIORITY_LABELS: Record<number, string> = {
  0: 'Low', 1: 'Normal', 2: 'High', 3: 'Critical'
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications?pageSize=50')
      setNotifications(Array.isArray(data) ? data : [])
    } catch { toast.error('Gagal memuat notifikasi') }
    finally { setLoading(false) }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch { toast.error('Gagal menandai') }
  }

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) await markRead(notif.id)
    if (notif.actionUrl) router.push(notif.actionUrl)
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-400" />
              Notifikasi
              {unread > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
          {unread > 0 && (
            <Button onClick={markAllRead} variant="outline" size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
              <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
            </Button>
          )}
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-slate-400 ml-3">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-4 p-4 border-l-4 cursor-pointer
                      transition-colors hover:bg-slate-700/30
                      ${PRIORITY_COLORS[notif.priority] ?? 'border-l-slate-600'}
                      ${!notif.isRead ? 'bg-slate-700/20' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        )}
                        {notif.priority >= 2 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            notif.priority === 3
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {PRIORITY_LABELS[notif.priority]}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(notif.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {notif.actionUrl && (
                      <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
