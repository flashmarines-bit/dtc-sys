'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { DocumentType } from '@/types'
import { Upload, FileText, X, Loader2, ChevronLeft, AlertCircle } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

export default function NewSubmissionPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    documentTypeId: '',
    vendorCompanyName: user?.fullName ?? '',
    vendorContactName: user?.fullName ?? '',
    vendorContactEmail: user?.email ?? '',
    vendorContactPhone: '',
    referenceNumber: '',
    documentDate: '',
    documentValue: '',
    notes: '',
    contractNumber: '',
  })

  useEffect(() => {
    api.get('/api/document-types').then(({ data }) => {
      const types = data.documentTypes ?? data ?? []
      setDocTypes(types)
      if (types.length > 0) setForm(f => ({ ...f, documentTypeId: types[0].id }))
    }).catch(() => {})
    if (user) {
      setForm(f => ({
        ...f,
        vendorCompanyName: (user as any).companyName ?? user.fullName,
        vendorContactName: user.fullName,
        vendorContactEmail: user.email,
      }))
    }
  }, [user])

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Hanya file PDF yang diperbolehkan'); return }
    if (f.size > 50 * 1024 * 1024) { setError('Ukuran file maksimal 50MB'); return }
    setFile(f)
    setError('')
    if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace('.pdf', '') }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Upload file PDF terlebih dahulu'); return }
    if (!form.title || !form.documentTypeId || !form.vendorContactPhone) {
      setError('Judul, jenis dokumen, dan nomor telepon wajib diisi'); return
    }
    setLoading(true)
    setError('')
    try {
      // Step 1: Create submission
      const { data: sub } = await api.post('/api/vendor/submissions', {
        title: form.title,
        description: form.description || undefined,
        documentTypeId: form.documentTypeId,
        vendorCompanyName: form.vendorCompanyName,
        vendorContactName: form.vendorContactName,
        vendorContactEmail: form.vendorContactEmail,
        vendorContactPhone: form.vendorContactPhone,
        referenceNumber: form.referenceNumber || undefined,
        documentDate: form.documentDate || undefined,
        documentValue: form.documentValue ? parseFloat(form.documentValue) : undefined,
        notes: form.notes || undefined,
        contractNumber: form.contractNumber || undefined,
      })

      // Step 2: Upload file
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/api/vendor/submissions/${sub.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      router.push(`/submissions/${sub.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Gagal membuat pengajuan')
    } finally {
      setLoading(false)
    }
  }

  const inp = (label: string, field: keyof typeof form, opts?: {
    type?: string, placeholder?: string, required?: boolean, hint?: string
  }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label} {opts?.required !== false && <span className="text-red-500">*</span>}
        {opts?.required === false && <span className="text-[var(--muted-foreground)] font-normal text-xs ml-1">(opsional)</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={opts?.placeholder}
        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
      />
      {opts?.hint && <p className="text-xs text-[var(--muted-foreground)]">{opts.hint}</p>}
    </div>
  )

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Pengajuan Baru</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Upload dokumen PDF untuk diverifikasi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[var(--primary)]" /> Upload Dokumen PDF
          </h2>

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragOver
                  ? "border-[var(--primary)] bg-blue-50"
                  : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]"
              )}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <Upload className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
              <p className="font-medium text-[var(--foreground)] text-sm">Seret file PDF ke sini</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">atau klik untuk memilih file</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-3">PDF · Maks. 50MB</p>
              <input id="fileInput" type="file" accept=".pdf" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--foreground)] truncate">{file.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => setFile(null)}
                className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--primary)]" /> Informasi Dokumen
          </h2>
          {inp('Judul Dokumen', 'title', { placeholder: 'Judul dokumen yang diajukan' })}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Jenis Dokumen <span className="text-red-500">*</span></label>
            <select value={form.documentTypeId}
              onChange={e => setForm(f => ({ ...f, documentTypeId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all">
              {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>)}
            </select>
          </div>
          {inp('Deskripsi', 'description', { required: false, placeholder: 'Deskripsi singkat dokumen' })}
          {inp('Nomor Referensi', 'referenceNumber', { required: false, placeholder: 'No. PO / Kontrak / Referensi' })}
          {inp('Nomor Kontrak', 'contractNumber', { required: false, placeholder: 'Nomor kontrak terkait' })}
          {inp('Tanggal Dokumen', 'documentDate', { type: 'date', required: false })}
          {inp('Nilai Dokumen', 'documentValue', { type: 'number', required: false, placeholder: '0', hint: 'Dalam Rupiah (IDR)' })}
        </div>

        {/* Contact Info */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--primary)]" /> Informasi Kontak
          </h2>
          {inp('Nama Perusahaan', 'vendorCompanyName', { placeholder: 'PT. Nama Perusahaan' })}
          {inp('Nama PIC', 'vendorContactName', { placeholder: 'Nama penanggung jawab' })}
          {inp('Email PIC', 'vendorContactEmail', { type: 'email', placeholder: 'email@perusahaan.com' })}
          {inp('No. Telepon PIC', 'vendorContactPhone', { placeholder: '08xxxxxxxxxx', hint: 'Untuk konfirmasi dan notifikasi' })}
          {inp('Catatan', 'notes', { required: false, placeholder: 'Catatan tambahan untuk reviewer' })}
        </div>

        <button type="submit" disabled={loading || !file}
          className={cn(
            "w-full py-4 rounded-2xl font-semibold text-white transition-all shadow-md",
            "bg-[var(--primary)] hover:bg-blue-700 active:scale-[0.99]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}>
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim...</>
            : <><Upload className="w-5 h-5" /> Kirim Pengajuan</>
          }
        </button>
      </form>
    </Shell>
  )
}
