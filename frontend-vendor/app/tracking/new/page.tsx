'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { ArrowLeft, FileUp, Loader2, CheckCircle, X, Plus, Trash2 } from 'lucide-react'

interface DocumentType { id: string; name: string; code: string; description: string }
interface SchemaField {
  key: string; label: string; type: string; required: boolean
  order: number; placeholder?: string; helpText?: string
  defaultValue?: string; options?: string[]
}
type Step = 'form' | 'uploading' | 'success'

export default function NewTrackingPage() {
  const router = useRouter()
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [schema, setSchema] = useState<SchemaField[]>([])
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const [createdDocId, setCreatedDocId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [docTypeId, setDocTypeId] = useState('')
  const [docTypeName, setDocTypeName] = useState('')
  const [department, setDepartment] = useState('')
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitNow, setSubmitNow] = useState(true)

  useEffect(() => { fetchDocTypes() }, [])

  const fetchDocTypes = async () => {
    try {
      const { data } = await api.get('/api/document-types')
      setDocTypes(data.documentTypes ?? [])
    } catch {}
  }

  const handleDocTypeChange = async (id: string) => {
    setDocTypeId(id)
    setDynamicValues({})
    setSchema([])
    if (!id) { setDocTypeName(''); return }
    const dt = docTypes.find(d => d.id === id)
    setDocTypeName(dt?.name ?? '')
    setSchemaLoading(true)
    try {
      const { data } = await api.get(`/api/document-types/${id}/with-schema`)
      const fields: SchemaField[] = data.schema ?? []
      setSchema(fields.sort((a, b) => a.order - b.order))
      // Set default values
      const defaults: Record<string, string> = {}
      fields.forEach(f => { if (f.defaultValue) defaults[f.key] = f.defaultValue })
      setDynamicValues(defaults)
    } catch {} finally { setSchemaLoading(false) }
  }

  const setVal = (key: string, value: string) =>
    setDynamicValues(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !docTypeId) { setError('Judul dan tipe dokumen wajib diisi.'); return }
    // Validasi required fields dari schema
    for (const f of schema) {
      if (f.required && !dynamicValues[f.key]?.trim()) {
        setError(`Field "${f.label}" wajib diisi.`); return
      }
    }
    setError('')
    setStep('uploading')
    try {
      const dynamicData = Object.keys(dynamicValues).length > 0
        ? JSON.stringify(dynamicValues) : null

      const { data: doc } = await api.post('/api/documents', {
        title: title.trim(),
        description: description.trim() || null,
        documentTypeId: docTypeId,
        organizationFunctionId: null,
        department: department.trim() || null,
        dynamicData,
      })

      const filesToUpload = file ? [file, ...attachments] : attachments
      for (const f of filesToUpload) {
        const fd = new FormData(); fd.append('file', f)
        await api.post(`/api/documents/${doc.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      if (submitNow) await api.post(`/api/tracking/${doc.id}/submit`, null)

      setCreatedDocId(doc.id)
      setStep('success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Terjadi kesalahan. Silakan coba lagi.')
      setStep('form')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit', color: '#0f172a',
    background: '#f9fafb', outline: 'none',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 600,
    color: '#374151', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 6,
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#185FA5'; e.target.style.background = '#fff'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#d1d5db'; e.target.style.background = '#f9fafb'
  }

  const renderField = (f: SchemaField) => {
    const val = dynamicValues[f.key] ?? ''
    const common = { onFocus, onBlur }
    switch (f.type) {
      case 'textarea':
        return <textarea placeholder={f.placeholder ?? ''} value={val}
          onChange={e => setVal(f.key, e.target.value)} rows={3}
          style={{ ...inp, height: 'auto', padding: '8px 12px', resize: 'vertical' }}
          {...common} />
      case 'date':
        return <input type="date" value={val}
          onChange={e => setVal(f.key, e.target.value)} style={inp} {...common} />
      case 'daterange':
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={val.split('|')[0] ?? ''}
              onChange={e => setVal(f.key, `${e.target.value}|${val.split('|')[1] ?? ''}`)}
              style={{ ...inp }} onFocus={onFocus} onBlur={onBlur} />
            <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>s/d</span>
            <input type="date" value={val.split('|')[1] ?? ''}
              onChange={e => setVal(f.key, `${val.split('|')[0] ?? ''}|${e.target.value}`)}
              style={{ ...inp }} onFocus={onFocus} onBlur={onBlur} />
          </div>
        )
      case 'select':
        return (
          <select value={val} onChange={e => setVal(f.key, e.target.value)}
            style={{ ...inp, cursor: 'pointer' }} {...common}>
            <option value="">-- Pilih --</option>
            {(f.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )
      case 'currency':
        return (
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Rp</span>
            <input type="text" placeholder={f.placeholder ?? '0'} value={val}
              onChange={e => setVal(f.key, e.target.value.replace(/[^0-9.]/g, ''))}
              style={{ ...inp, paddingLeft: 36 }} {...common} />
          </div>
        )
      case 'number':
        return <input type="number" placeholder={f.placeholder ?? ''} value={val}
          onChange={e => setVal(f.key, e.target.value)} style={inp} {...common} />
      case 'email':
        return <input type="email" placeholder={f.placeholder ?? 'email@domain.com'} value={val}
          onChange={e => setVal(f.key, e.target.value)} style={inp} {...common} />
      case 'phone':
        return <input type="tel" placeholder={f.placeholder ?? '+62 812 3456 7890'} value={val}
          onChange={e => setVal(f.key, e.target.value)} style={inp} {...common} />
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={val === 'true'}
              onChange={e => setVal(f.key, e.target.checked ? 'true' : 'false')}
              style={{ width: 16, height: 16, accentColor: '#185FA5' }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{f.placeholder ?? f.label}</span>
          </label>
        )
      default:
        return <input type="text" placeholder={f.placeholder ?? ''} value={val}
          onChange={e => setVal(f.key, e.target.value)} style={inp} {...common} />
    }
  }

  if (step === 'success') return (
    <Shell>
      <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 40, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} style={{ color: '#15803d' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
          {submitNow ? 'Dokumen Berhasil Diajukan!' : 'Draft Berhasil Disimpan!'}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
          {submitNow ? 'Dokumen telah dikirim ke front desk untuk diproses.' : 'Dokumen tersimpan sebagai draft.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => router.push(`/tracking/${createdDocId}`)}
            style={{ padding: '10px 20px', background: '#185FA5', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Lihat Detail
          </button>
          <button onClick={() => router.push('/tracking')}
            style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Ke Daftar Tracking
          </button>
        </div>
      </div>
    </Shell>
  )

  return (
    <Shell>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button onClick={() => router.push('/tracking')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: '0 0 16px', fontFamily: 'inherit' }}>
          <ArrowLeft size={15} /> Kembali ke Tracking
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0 }}>Ajukan Proses Verifikasi Dokumen</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Isi form berikut untuk mengajukan dokumen (draft/proforma) ke front desk</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── INFORMASI UTAMA ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              Informasi Utama
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Tipe Dokumen <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={docTypeId} onChange={e => handleDocTypeChange(e.target.value)}
                required style={{ ...inp, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                <option value="">-- Pilih tipe dokumen --</option>
                {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Judul Dokumen <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" placeholder="Judul singkat dan deskriptif"
                value={title} onChange={e => setTitle(e.target.value)} required
                style={inp} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Departemen</label>
                <input type="text" placeholder="Finance, HRD, Procurement..."
                  value={department} onChange={e => setDepartment(e.target.value)}
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={lbl}>Keterangan Umum</label>
                <input type="text" placeholder="Catatan tambahan..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>

          {/* ── DYNAMIC SCHEMA FIELDS ── */}
          {schemaLoading && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 size={16} style={{ color: '#185FA5', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#64748b' }}>Memuat field dokumen...</span>
            </div>
          )}

          {!schemaLoading && schema.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #bfdbfe', padding: 24, marginBottom: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', margin: '0 0 4px' }}>
                  Detail {docTypeName}
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Field bertanda <span style={{ color: '#ef4444' }}>*</span> wajib diisi
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {schema.map(f => (
                  <div key={f.key} style={{
                    gridColumn: ['textarea','daterange','currency'].includes(f.type) ||
                      schema.length === 1 ? 'span 2' : 'span 1'
                  }}>
                    <label style={lbl}>
                      {f.label}
                      {f.required && <span style={{ color: '#ef4444' }}> *</span>}
                    </label>
                    {renderField(f)}
                    {f.helpText && (
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{f.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!schemaLoading && docTypeId && schema.length === 0 && (
            <div style={{ background: '#fffbeb', borderRadius: 14, border: '1px solid #fde68a', padding: '14px 20px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                ℹ️ Tipe dokumen ini belum memiliki field tambahan. SysAdmin dapat mengkonfigurasi schema melalui pengaturan Document Types.
              </p>
            </div>
          )}

          {/* ── UPLOAD FILE ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Lampiran Dokumen</h2>

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 10 }}>
                <FileUp size={15} style={{ color: '#15803d', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#15803d', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{(file.size/1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => setFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'block', cursor: 'pointer', marginBottom: 10 }}>
                <div style={{ border: '2px dashed #d1d5db', borderRadius: 10, padding: '20px', textAlign: 'center', background: '#f9fafb' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#185FA5')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1d5db')}>
                  <FileUp size={22} style={{ color: '#94a3b8', marginBottom: 6 }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 2px' }}>Klik untuk upload dokumen utama</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>PDF, JPG, PNG, DOCX — maks 5MB</p>
                </div>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
              </label>
            )}

            {attachments.map((att, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 6 }}>
                <FileUp size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{(att.size/1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#185FA5', fontWeight: 500, marginTop: 4 }}>
              <Plus size={13} /> Tambah lampiran lain
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls"
                onChange={e => { if (e.target.files?.[0]) setAttachments(prev => [...prev, e.target.files![0]]) }}
                style={{ display: 'none' }} />
            </label>
          </div>

          {/* ── OPSI SUBMIT ── */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '14px 20px', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={submitNow} onChange={e => setSubmitNow(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#185FA5' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>Ajukan langsung ke front desk</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Jika tidak dicentang, dokumen tersimpan sebagai draft</p>
              </div>
            </label>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>
              <X size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => router.push('/tracking')}
              style={{ flex: 1, height: 44, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Batal
            </button>
            <button type="submit" disabled={step === 'uploading'}
              style={{ flex: 2, height: 44, background: step === 'uploading' ? '#94a3b8' : '#185FA5', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: step === 'uploading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
              {step === 'uploading'
                ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Memproses...</>
                : submitNow ? 'Ajukan ke Front Desk' : 'Simpan sebagai Draft'
              }
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  )
}
