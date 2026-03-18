'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { FileText, ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Loader2, QrCode, User, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

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
  description: string | null
  originalFileName: string | null
  fileSizeBytes: number
}

interface HistoryItem {
  id: string
  action: string
  notes: string | null
  performedByUserName: string
  performedAt: string
  fromStatus: number | null
  toStatus: number | null
}

const DOC_STATUS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Draft',        color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  1: { label: 'Diajukan',     color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  2: { label: 'Diterima',     color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  3: { label: 'Direview',     color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  4: { label: 'Disetujui',    color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  5: { label: 'Selesai',      color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  6: { label: 'Dikembalikan', color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  Submitted:    <FileText size={14} />,
  Received:     <CheckCircle size={14} />,
  Assigned:     <User size={14} />,
  StartReview:  <RefreshCw size={14} />,
  Approved:     <CheckCircle size={14} />,
  Returned:     <XCircle size={14} />,
  HandoverInit: <Clock size={14} />,
  HandoverDone: <CheckCircle size={14} />,
}

const ACTION_LABEL: Record<string, string> = {
  Submitted:    'Dokumen Diajukan',
  Received:     'Diterima di Front Desk',
  Assigned:     'Ditugaskan ke Validator',
  StartReview:  'Mulai Direview',
  Approved:     'Disetujui',
  Returned:     'Dikembalikan',
  HandoverInit: 'Handover Dimulai',
  HandoverDone: 'Handover Selesai',
}

export default function TrackingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [doc, setDoc] = useState<Document | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const [docRes, histRes] = await Promise.all([
        api.get(`/api/documents/${id}`),
        api.get(`/api/tracking/${id}/history`),
      ])
      setDoc(docRes.data)
      setHistory(Array.isArray(histRes.data) ? histRes.data : [])
    } catch { } finally { setLoading(false) }
  }

  if (loading) return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10 }}>
        <Loader2 size={22} style={{ color: '#185FA5', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14, color: '#64748b' }}>Memuat dokumen...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  )

  if (!doc) return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#64748b' }}>Dokumen tidak ditemukan.</p>
        <button onClick={() => router.back()} style={{ marginTop: 16, padding: '8px 16px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Kembali</button>
      </div>
    </Shell>
  )

  const st = DOC_STATUS[doc.status] ?? DOC_STATUS[0]

  return (
    <Shell>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back button */}
        <button onClick={() => router.push('/tracking')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: '0 0 16px', fontFamily: 'inherit' }}>
          <ArrowLeft size={15} /> Kembali ke Daftar
        </button>

        {/* Document card */}
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>{doc.title}</h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{doc.documentNumber}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '4px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {st.label}
            </span>
          </div>

          {/* Meta info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: <FileText size={13} />, label: 'Tipe', value: doc.documentTypeName },
              { icon: <User size={13} />, label: 'Dibuat oleh', value: doc.createdByUserName },
              { icon: <Calendar size={13} />, label: 'Tanggal', value: formatDateTime(doc.createdAt) },
              { icon: <QrCode size={13} />, label: 'QR Code', value: doc.qrCode ?? '-' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', marginBottom: 4 }}>
                  {item.icon}
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {doc.description && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Deskripsi</p>
              <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{doc.description}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Riwayat Aktivitas</h2>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Belum ada aktivitas tercatat.
            </div>
          ) : (
            <div style={{ padding: '20px 20px' }}>
              {history.map((h, i) => {
                const icon = ACTION_ICON[h.action] ?? <Clock size={14} />
                const label = ACTION_LABEL[h.action] ?? h.action
                const isLast = i === history.length - 1
                return (
                  <div key={h.id} style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 20, position: 'relative' }}>
                    {/* Line */}
                    {!isLast && (
                      <div style={{ position: 'absolute', left: 17, top: 32, bottom: 0, width: 1, background: '#e2e8f0' }} />
                    )}
                    {/* Icon */}
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#1e40af', zIndex: 1 }}>
                      {icon}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{label}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>
                        oleh {h.performedByUserName} · {formatDateTime(h.performedAt)}
                      </p>
                      {h.notes && (
                        <p style={{ fontSize: 12, color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '6px 10px', margin: 0, borderLeft: '3px solid #bfdbfe' }}>
                          {h.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  )
}
