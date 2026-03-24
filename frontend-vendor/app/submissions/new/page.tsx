'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { DocumentType, MetaSchemaField } from '@/types'
import { Upload, FileText, X, Loader2, ChevronLeft, AlertCircle, ChevronDown } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

// ─── Dynamic Field Renderer ───────────────────────────────────────────────────
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: MetaSchemaField
  value: string
  onChange: (val: string) => void
}) {
  const base =
    'w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all'

  const label = (
    <label className="text-sm font-medium text-[var(--foreground)]">
      {field.label}
      {field.required ? (
        <span className="text-red-500 ml-0.5">*</span>
      ) : (
        <span className="text-[var(--muted-foreground)] font-normal text-xs ml-1">(opsional)</span>
      )}
    </label>
  )

  let input: React.ReactNode

  if (field.type === 'textarea') {
    input = (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        rows={3}
        className={base + ' resize-none'}
      />
    )
  } else if (field.type === 'select' && field.options?.length) {
    input = (
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={base + ' appearance-none pr-10'}
        >
          <option value="">-- Pilih --</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
      </div>
    )
  } else if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={field.key}
          checked={value === 'true'}
          onChange={e => onChange(e.target.checked ? 'true' : 'false')}
          className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]"
        />
        <label htmlFor={field.key} className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
          {field.label}
          {!field.required && (
            <span className="text-[var(--muted-foreground)] font-normal text-xs ml-1">(opsional)</span>
          )}
        </label>
        {field.helpText && <p className="text-xs text-[var(--muted-foreground)]">{field.helpText}</p>}
      </div>
    )
  } else if (field.type === 'daterange') {
    const [from, to] = value.split('|')
    return (
      <div className="space-y-1.5">
        {label}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Dari</p>
            <input
              type="date"
              value={from ?? ''}
              onChange={e => onChange(`${e.target.value}|${to ?? ''}`)}
              className={base}
            />
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Sampai</p>
            <input
              type="date"
              value={to ?? ''}
              onChange={e => onChange(`${from ?? ''}|${e.target.value}`)}
              className={base}
            />
          </div>
        </div>
        {field.helpText && <p className="text-xs text-[var(--muted-foreground)]">{field.helpText}</p>}
      </div>
    )
  } else if (field.type === 'currency') {
    input = (
      <div className="relative">
        <span className="absolute left-4 top-3 text-sm text-[var(--muted-foreground)]">Rp</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? '0'}
          className={base + ' pl-10'}
        />
      </div>
    )
  } else {
    input = (
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        className={base}
      />
    )
  }

  return (
    <div className="space-y-1.5">
      {label}
      {input}
      {field.helpText && (
        <p className="text-xs text-[var(--muted-foreground)]">{field.helpText}</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewSubmissionPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({})

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingForms, setLoadingForms] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    vendorCompanyName: '',
    vendorContactName: '',
    vendorContactEmail: '',
    vendorContactPhone: '',
    referenceNumber: '',
    documentDate: '',
    documentValue: '',
    notes: '',
    contractNumber: '',
  })

  // Load forms dari endpoint vendor
  useEffect(() => {
    setLoadingForms(true)
    api.get('/api/vendor/forms')
      .then(({ data }) => {
        const types: DocumentType[] = Array.isArray(data) ? data : []
        setDocTypes(types)
        if (types.length > 0) {
          setSelectedType(types[0])
          initDynamicData(types[0])
        }
      })
      .catch(() => setError('Gagal memuat daftar jenis dokumen'))
      .finally(() => setLoadingForms(false))
  }, [])

  // Prefill contact info dari user
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        vendorCompanyName: (user as any).companyName ?? user.fullName,
        vendorContactName: user.fullName,
        vendorContactEmail: user.email,
      }))
    }
  }, [user])

  const initDynamicData = (dt: DocumentType) => {
    const init: Record<string, string> = {}
    for (const field of dt.schema ?? []) {
      init[field.key] = field.defaultValue ?? ''
    }
    setDynamicData(init)
  }

  const handleSelectType = (id: string) => {
    const dt = docTypes.find(d => d.id === id) ?? null
    setSelectedType(dt)
    if (dt) initDynamicData(dt)
  }

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Hanya file PDF yang diperbolehkan'); return }
    if (f.size > 100 * 1024 * 1024) { setError('Ukuran file maksimal 100MB'); return }
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

  // Validasi dynamic required fields
  const validateDynamic = (): string[] => {
    if (!selectedType?.schema?.length) return []
    return selectedType.schema
      .filter(f => f.required && !dynamicData[f.key]?.trim())
      .map(f => f.label)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Upload file PDF terlebih dahulu'); return }
    if (!form.title || !selectedType) { setError('Judul dan jenis dokumen wajib diisi'); return }
    if (!form.vendorContactPhone) { setError('Nomor telepon PIC wajib diisi'); return }

    const missingFields = validateDynamic()
    if (missingFields.length > 0) {
      setError(`Field wajib belum diisi: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)
    setError('')
    try {
      // Serialize dynamic data ke JSON string
      const dynamicDataJson = JSON.stringify(dynamicData)

      // Step 1: Create submission
      const { data: sub } = await api.post('/api/vendor/submissions', {
        title: form.title,
        description: form.description || undefined,
        documentTypeId: selectedType.id,
        vendorCompanyName: form.vendorCompanyName,
        vendorContactName: form.vendorContactName,
        vendorContactEmail: form.vendorContactEmail,
        vendorContactPhone: form.vendorContactPhone,
        referenceNumber: form.referenceNumber || undefined,
        documentDate: form.documentDate || undefined,
        documentValue: form.documentValue ? parseFloat(form.documentValue) : undefined,
        notes: form.notes || undefined,
        contractNumber: form.contractNumber || undefined,
        dynamicData: dynamicDataJson,
      })

      // Step 2: Upload PDF
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/api/vendor/submissions/${sub.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      router.push(`/submissions/${sub.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Gagal membuat pengajuan')
    } finally {
      setLoading(false)
    }
  }

  const inp = (
    label: string,
    field: keyof typeof form,
    opts?: { type?: string; placeholder?: string; required?: boolean; hint?: string }
  ) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {opts?.required !== false ? (
          <span className="text-red-500 ml-0.5">*</span>
        ) : (
          <span className="text-[var(--muted-foreground)] font-normal text-xs ml-1">(opsional)</span>
        )}
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
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
        >
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
              onClick={() => document.getElementById('fileInput')?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                dragOver
                  ? 'border-[var(--primary)] bg-blue-50'
                  : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]'
              )}
            >
              <Upload className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" />
              <p className="font-medium text-[var(--foreground)] text-sm">Seret file PDF ke sini</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">atau klik untuk memilih file</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-3">PDF · Maks. 100MB</p>
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

        {/* Pilih Jenis Dokumen */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--primary)]" /> Jenis Dokumen
          </h2>

          {loadingForms ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat daftar dokumen...
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedType?.id ?? ''}
                onChange={e => handleSelectType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all appearance-none pr-10"
              >
                {docTypes.map(dt => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name} ({dt.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
            </div>
          )}

          {selectedType?.description && (
            <p className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] rounded-lg px-3 py-2">
              {selectedType.description}
            </p>
          )}
        </div>

        {/* Dynamic Fields dari MetaSchema */}
        {selectedType?.schema && selectedType.schema.length > 0 && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary)]" /> Detail Dokumen
              <span className="text-xs font-normal text-[var(--muted-foreground)] ml-1">
                — {selectedType.name}
              </span>
            </h2>
            {selectedType.schema
              .sort((a, b) => a.order - b.order)
              .map(field => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={dynamicData[field.key] ?? ''}
                  onChange={val => setDynamicData(d => ({ ...d, [field.key]: val }))}
                />
              ))}
          </div>
        )}

        {/* Informasi Umum */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--primary)]" /> Informasi Umum
          </h2>
          {inp('Judul Dokumen', 'title', { placeholder: 'Judul dokumen yang diajukan' })}
          {inp('Deskripsi', 'description', { required: false, placeholder: 'Deskripsi singkat dokumen' })}
          {inp('Nomor Referensi', 'referenceNumber', { required: false, placeholder: 'No. PO / Kontrak / Referensi' })}
          {inp('Nomor Kontrak', 'contractNumber', { required: false, placeholder: 'Nomor kontrak terkait' })}
          {inp('Tanggal Dokumen', 'documentDate', { type: 'date', required: false })}
          {inp('Nilai Dokumen (IDR)', 'documentValue', { type: 'number', required: false, placeholder: '0', hint: 'Dalam Rupiah (IDR)' })}
        </div>

        {/* Informasi Kontak */}
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

        <button
          type="submit"
          disabled={loading || !file}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold text-white transition-all shadow-md',
            'bg-[var(--primary)] hover:bg-blue-700 active:scale-[0.99]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2'
          )}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Mengirim...</>
          ) : (
            <><Upload className="w-5 h-5" /> Kirim Pengajuan</>
          )}
        </button>
      </form>
    </Shell>
  )
}
