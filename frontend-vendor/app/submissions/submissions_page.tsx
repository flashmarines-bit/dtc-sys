'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { VendorSubmission } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, FileText, Clock, CheckCircle, XCircle, RefreshCw, Loader2, ChevronRight, Send } from 'lucide-react'

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Pending:             { icon: <Clock size={15} />,      color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  Analysing:           { icon: <RefreshCw size={15} />,  color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  UnderReview:         { icon: <FileText size={15} />,   color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  Accepted:            { icon: <CheckCircle size={15} />,color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0' },
  Rejected:            { icon: <XCircle size={15} />,    color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca' },
  ReturnedForRevision: { icon: <RefreshCw size={15} />,  color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
}

const STATUS_LABEL: Record<string, string> = {
  Pending: 'Menunggu',
  Analysing: 'Dianalisis',
  UnderReview: 'Direview',
  Accepted: 'Diterima',
  Rejected: 'Ditolak',
  ReturnedForRevision: 'Perlu Revisi',
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/vendor/submissions')
      setSubmissions(Array.isArray(data) ? data : [])
    } catch { } finally { setLoading(false) }
  }

  const stats = {
    total:    submissions.length,
    pending:  submissions.filter(s => [0, 1, 2].includes(s.status)).length,
    accepted: submissions.filter(s => s.status === 3).length,
    rejected: submissions.filter(s => s.status === 4).length,
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const firstName = user?.fullName?.split(' ').slice(0, 2).join(' ') ?? 'Vendor'

  return (
    <Shell>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            {mounted ? greeting() : 'Halo'}, {firstName} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{user?.email}</p>
        </div>

        {/* ── STATS CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total',    value: stats.total,    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Diproses', value: stats.pending,  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Diterima', value: stats.accepted, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Ditolak',  value: stats.rejected, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12,
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: '4px 0 0', lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── NEW SUBMISSION BUTTON ── */}
        <button
          onClick={() => router.push('/submissions/new')}
          style={{
            width: '100%',
            height: 48,
            background: '#185FA5',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0C447C')}
          onMouseLeave={e => (e.currentTarget.style.background = '#185FA5')}
        >
          <Plus size={18} />
          Buat Pengajuan Baru
        </button>

        {/* ── SUBMISSIONS LIST ── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          {/* List header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Riwayat Pengajuan
            </h2>
            <button
              onClick={fetchSubmissions}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' }}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
              <Loader2 size={20} style={{ color: '#185FA5', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#64748b' }}>Memuat data...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && submissions.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Send size={24} style={{ color: '#94a3b8' }} />
              </div>
              <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>Belum ada pengajuan</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Klik tombol di atas untuk membuat pengajuan pertama Anda</p>
            </div>
          )}

          {/* List items */}
          {!loading && submissions.map((s, i) => {
            const cfg = STATUS_CONFIG[s.statusLabel] ?? STATUS_CONFIG['Pending']
            const label = STATUS_LABEL[s.statusLabel] ?? s.statusLabel
            return (
              <button
                key={s.id}
                onClick={() => router.push(`/submissions/${s.id}`)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {/* Status icon */}
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: cfg.color,
                }}>
                  {cfg.icon}
                </div>

                {/* Title + number */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    {s.submissionNumber} · {formatDateTime(s.createdAt)}
                  </p>
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 20,
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
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
