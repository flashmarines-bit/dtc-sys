'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { DocumentType, MetaSchemaField } from '@/types'
import { Upload, FileText, X, Loader2, ChevronLeft, AlertCircle, ChevronDown, CheckCircle, User, Building2, Hash, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Dokumen', icon: Upload },
  { id: 2, label: 'Informasi', icon: FileText },
  { id: 3, label: 'Kontak', icon: User },
]

function DynamicField({ field, value, onChange }: { field: MetaSchemaField; value: string; onChange: (val: string) => void }) {
  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400'
  const label = (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
      {field.label}{field.required ? <span style={{ color: '#f87171', marginLeft: 4 }}>*</span> : <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none' as const, color: '#94a3b8', marginLeft: 4 }}>(opsional)</span>}
    </label>
  )
  if (field.type === 'textarea') return <div>{label}<textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder ?? ''} rows={3} className={inputCls + ' resize-none'} />{field.helpText && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{field.helpText}</p>}</div>
  if (field.type === 'select' && field.options?.length) return <div>{label}<div style={{ position: 'relative' }}><select value={value} onChange={e => onChange(e.target.value)} className={inputCls + ' appearance-none pr-10'}><option value="">-- Pilih --</option>{field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} /></div></div>
  if (field.type === 'currency') return <div>{label}<div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Rp</span><input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder ?? '0'} className={inputCls} style={{ paddingLeft: 36 }} /></div></div>
  if (field.type === 'daterange') { const [from, to] = value.split('|'); return <div>{label}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Dari</p><input type="date" value={from ?? ''} onChange={e => onChange(`${e.target.value}|${to ?? ''}`)} className={inputCls} /></div><div><p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Sampai</p><input type="date" value={to ?? ''} onChange={e => onChange(`${from ?? ''}|${e.target.value}`)} className={inputCls} /></div></div></div> }
  if (field.type === 'checkbox') return <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="checkbox" id={field.key} checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} style={{ width: 16, height: 16, accentColor: '#185FA5' }} /><label htmlFor={field.key} style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', cursor: 'pointer' }}>{field.label}</label></div>
  return <div>{label}<input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder ?? ''} className={inputCls} />{field.helpText && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{field.helpText}</p>}</div>
}

function Field({ label, children, required = true, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}{required ? <span style={{ color: '#f87171', marginLeft: 4 }}>*</span> : <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: '#94a3b8', marginLeft: 4 }}>(opsional)</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export default function NewSubmissionPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingForms, setLoadingForms] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', vendorCompanyName: '', vendorContactName: '', vendorContactEmail: '', vendorContactPhone: '', referenceNumber: '', documentDate: '', documentValue: '', notes: '', contractNumber: '' })

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400'

  useEffect(() => {
    api.get('/api/vendor/forms')
      .then(({ data }) => { const types: DocumentType[] = Array.isArray(data) ? data : []; setDocTypes(types); if (types.length > 0) { setSelectedType(types[0]); initDynamic(types[0]) } })
      .catch(() => setError('Gagal memuat daftar jenis dokumen'))
      .finally(() => setLoadingForms(false))
  }, [])

  useEffect(() => {
    if (user) setForm(f => ({ ...f, vendorCompanyName: (user as any).companyName ?? user.fullName, vendorContactName: user.fullName, vendorContactEmail: user.email }))
  }, [user])

  const initDynamic = (dt: DocumentType) => { const init: Record<string, string> = {}; for (const f of dt.schema ?? []) init[f.key] = f.defaultValue ?? ''; setDynamicData(init) }
  const handleSelectType = (id: string) => { const dt = docTypes.find(d => d.id === id) ?? null; setSelectedType(dt); if (dt) initDynamic(dt) }
  const handleFile = (f: File) => { if (f.type !== 'application/pdf') { setError('Hanya file PDF'); return }; if (f.size > 100 * 1024 * 1024) { setError('Maks. 100MB'); return }; setFile(f); setError(''); if (!form.title) setForm(p => ({ ...p, title: f.name.replace('.pdf', '') })) }

  const inp = (field: keyof typeof form, placeholder?: string, type = 'text') => (
    <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className={inputCls} />
  )

  const validateStep = (s: number) => {
    setError('')
    if (s === 1) { if (!file) { setError('Upload file PDF terlebih dahulu'); return false }; if (!selectedType) { setError('Pilih jenis dokumen'); return false } }
    if (s === 2) { if (!form.title) { setError('Judul dokumen wajib diisi'); return false }; const missing = (selectedType?.schema ?? []).filter(f => f.required && !dynamicData[f.key]?.trim()).map(f => f.label); if (missing.length) { setError(`Field wajib belum diisi: ${missing.join(', ')}`); return false } }
    if (s === 3) { if (!form.vendorContactPhone) { setError('Nomor telepon PIC wajib diisi'); return false } }
    return true
  }

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 3)) }
  const prev = () => { setError(''); setStep(s => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    setLoading(true); setError('')
    try {
      const { data: sub } = await api.post('/api/vendor/submissions', { title: form.title, description: form.description || undefined, documentTypeId: selectedType!.id, vendorCompanyName: form.vendorCompanyName, vendorContactName: form.vendorContactName, vendorContactEmail: form.vendorContactEmail, vendorContactPhone: form.vendorContactPhone, referenceNumber: form.referenceNumber || undefined, documentDate: form.documentDate || undefined, documentValue: form.documentValue ? parseFloat(form.documentValue) : undefined, notes: form.notes || undefined, contractNumber: form.contractNumber || undefined, dynamicData: JSON.stringify(dynamicData) })
      const fd = new FormData(); fd.append('file', file!)
      await api.post(`/api/vendor/submissions/${sub.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      router.push(`/submissions/${sub.id}`)
    } catch (err: any) { setError(err.response?.data?.error ?? 'Gagal membuat pengajuan') }
    finally { setLoading(false) }
  }

  const cardStyle = { background: '#fff', borderRadius: 16, border: '1px solid #e8edf5', padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }
  const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16, display: 'block' }

  return (
    <Shell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .new-sub * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .step-content { animation: fadeUp 0.25s ease both; }
        .nav-btn { transition: all 0.18s ease; }
        .nav-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.05); }
        .upload-zone:hover { border-color: #185FA5 !important; background: #f0f7ff !important; }
      `}</style>

      <div className="new-sub" style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Pengajuan Baru</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>Lengkapi informasi dokumen yang akan diajukan</p>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', marginBottom: 20 }}>
          {STEPS.map((s, i) => {
            const done = step > s.id; const active = step === s.id; const Icon = s.icon
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done || active ? '#185FA5' : '#f1f5f9', color: done || active ? '#fff' : '#94a3b8', transition: 'all 0.3s ease' }}>
                    {done ? <CheckCircle size={16} /> : <Icon size={15} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#0f172a' : done ? '#185FA5' : '#94a3b8', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, margin: '0 12px', background: step > s.id ? '#185FA5' : '#e8edf5', borderRadius: 2, transition: 'background 0.3s ease' }} />}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <span style={sectionLabel}>Upload PDF</span>
              {!file ? (
                <div className="upload-zone" onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onClick={() => document.getElementById('fileInput')?.click()}
                  style={{ border: `2px dashed ${dragOver ? '#185FA5' : '#cbd5e1'}`, borderRadius: 14, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f0f7ff' : '#fafbfc', transition: 'all 0.2s ease' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Upload size={22} style={{ color: '#185FA5' }} />
                  </div>
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: 0 }}>Seret file PDF ke sini</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>atau <span style={{ color: '#185FA5', fontWeight: 600 }}>klik untuk memilih</span></p>
                  <div style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 20, padding: '4px 12px', marginTop: 12 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PDF · Maks. 100MB</span>
                  </div>
                  <input id="fileInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} style={{ color: '#185FA5' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{formatFileSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#bfdbfe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <span style={sectionLabel}>Jenis Dokumen</span>
              {loadingForms ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Memuat...
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <select value={selectedType?.id ?? ''} onChange={e => handleSelectType(e.target.value)} style={{ width: '100%', padding: '12px 40px 12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, color: '#0f172a', fontWeight: 600, outline: 'none', appearance: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer' }}>
                      {docTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name} ({dt.code})</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                  {selectedType?.description && <p style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', borderRadius: 10, padding: '8px 12px', marginTop: 10 }}>{selectedType.description}</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedType?.schema && selectedType.schema.length > 0 && (
              <div style={cardStyle}>
                <span style={sectionLabel}>Detail — {selectedType.name}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedType.schema.sort((a, b) => a.order - b.order).map(field => (
                    <DynamicField key={field.key} field={field} value={dynamicData[field.key] ?? ''} onChange={val => setDynamicData(d => ({ ...d, [field.key]: val }))} />
                  ))}
                </div>
              </div>
            )}
            <div style={cardStyle}>
              <span style={sectionLabel}>Informasi Umum</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Judul Dokumen"><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul dokumen yang diajukan" className={inputCls} /></Field>
                <Field label="Deskripsi" required={false}><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat dokumen" rows={3} className={inputCls + ' resize-none'} /></Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Nomor Referensi" required={false}>{inp('referenceNumber', 'No. PO / Kontrak')}</Field>
                  <Field label="Nomor Kontrak" required={false}>{inp('contractNumber', 'Nomor kontrak')}</Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Tanggal Dokumen" required={false}>{inp('documentDate', '', 'date')}</Field>
                  <Field label="Nilai Dokumen (IDR)" required={false} hint="Dalam Rupiah">
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Rp</span>
                      <input type="number" value={form.documentValue} onChange={e => setForm(f => ({ ...f, documentValue: e.target.value }))} placeholder="0" className={inputCls} style={{ paddingLeft: 36 }} />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <span style={sectionLabel}>Informasi Kontak</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Nama Perusahaan">{inp('vendorCompanyName', 'PT. Nama Perusahaan')}</Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Nama PIC">{inp('vendorContactName', 'Nama penanggung jawab')}</Field>
                  <Field label="No. Telepon PIC">{inp('vendorContactPhone', '08xxxxxxxxxx')}</Field>
                </div>
                <Field label="Email PIC">{inp('vendorContactEmail', 'email@perusahaan.com', 'email')}</Field>
                <Field label="Catatan" required={false}><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan untuk reviewer" rows={3} className={inputCls + ' resize-none'} /></Field>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f0f7ff, #eff6ff)', borderRadius: 16, border: '1px solid #bfdbfe', padding: 20 }}>
              <span style={{ ...sectionLabel, color: '#185FA5' }}>Ringkasan Pengajuan</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: <FileText size={13} />, label: 'File', value: file?.name ?? '-' },
                  { icon: <Hash size={13} />, label: 'Jenis Dokumen', value: selectedType?.name ?? '-' },
                  { icon: <Building2 size={13} />, label: 'Judul', value: form.title || '-' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', flexShrink: 0 }}>{row.icon}</div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{row.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {step > 1 && (
            <button onClick={prev} className="nav-btn" style={{ flex: 1, height: 48, borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <ArrowLeft size={16} /> Kembali
            </button>
          )}
          {step < 3 ? (
            <button onClick={next} className="nav-btn" style={{ flex: 2, height: 48, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #185FA5, #0e4a85)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(24,95,165,0.3)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Lanjut <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="nav-btn" style={{ flex: 2, height: 48, borderRadius: 14, border: 'none', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #185FA5, #0e4a85)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(24,95,165,0.3)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Mengirim...</> : <><Upload size={16} /> Kirim Pengajuan</>}
            </button>
          )}
        </div>
      </div>
    </Shell>
  )
}
