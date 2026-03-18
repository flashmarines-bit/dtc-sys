'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { FileText, Search, QrCode, ChevronRight, Loader2, RefreshCw, Plus } from 'lucide-react'

interface Document {
  id: string
  documentNumber: string
  title: string
  status: number
  documentTypeName: string
  documentTypeCode: string
  createdAt: string
  createdByUserName: string
  qrCode: string | null
}

const DOC_STATUS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Draft',       color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  1: { label: 'Diajukan',    color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  2: { label: 'Diterima',    color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  3: { label: 'Direview',    color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  4: { label: 'Disetujui',   color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  5: { label: 'Selesai',     color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  6: { label: 'Dikembalikan',color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
}

export default function TrackingPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filtered, setFiltered] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  useEffect(() => { fetchDocuments() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(documents.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.documentNumber.toLowerCase().includes(q) ||
      d.documentTypeName.toLowerCase().includes(q)
    ))
  }, [search, documents])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/documents')
      const docs = data.documents ?? []
      setDocuments(docs)
      setFiltered(docs)
    } catch { } finally { setLoading(false) }
  }

  const handleScan = async () => {
    if (!qrInput.trim()) return
    setQrLoading(true)
    setQrError('')
    try {
      const { data } = await api.get(`/api/tracking/scan/${qrInput.trim()}`)
      router.push(`/tracking/${data.id}`)
    } catch {
      setQrError('QR Code tidak ditemukan.')
    } finally { setQrLoading(false) }
  }

  return (
    <Shell>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0 }}>Tracking Dokumen</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Lacak status dan riwayat dokumen Anda</p>
        </div>

        {/* New Doc Button */}
        <button
          onClick={() => router.push("/tracking/new")}
          style={{ width: "100%", height: 44, background: "#185FA5", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0C447C")}
          onMouseLeave={e => (e.currentTarget.style.background = "#185FA5")}
        >
          <Plus size={18} />
          Ajukan Proses Verifikasi Dokumen (Draft/Proforma)
        </button>

        {/* QR Scan */}
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <QrCode size={15} style={{ color: '#185FA5' }} /> Scan QR Code
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Masukkan kode QR (contoh: DTC-TRK-2026-000001)"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              style={{ flex: 1, height: 40, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0f172a', background: '#f9fafb' }}
            />
            <button onClick={handleScan} disabled={qrLoading}
              style={{ height: 40, padding: '0 16px', background: '#185FA5', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {qrLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={14} />}
              Cari
            </button>
          </div>
          {qrError && <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 8 }}>{qrError}</p>}
        </div>

        {/* Document List */}
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari dokumen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 12px 0 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0f172a', background: '#f8fafc' }}
              />
            </div>
            <button onClick={fetchDocuments} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, borderRadius: 6, display: 'flex' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
              <Loader2 size={20} style={{ color: '#185FA5', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#64748b' }}>Memuat dokumen...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <FileText size={24} style={{ color: '#94a3b8' }} />
              </div>
              <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>Tidak ada dokumen</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Belum ada dokumen yang dapat dilacak</p>
            </div>
          )}

          {!loading && filtered.map((doc, i) => {
            const st = DOC_STATUS[doc.status] ?? DOC_STATUS[0]
            return (
              <button key={doc.id} onClick={() => router.push(`/tracking/${doc.id}`)}
                style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: st.color }}>
                  <FileText size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{doc.documentNumber} · {doc.documentTypeName}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>{st.label}</span>
                  <ChevronRight size={15} style={{ color: '#cbd5e1' }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  )
}
