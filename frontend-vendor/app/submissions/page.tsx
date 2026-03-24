'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { VendorSubmission } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { Plus, FileText, Clock, CheckCircle, XCircle, RefreshCw, Loader2, ChevronRight, Send, TrendingUp, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string; dot: string }> = {
  Pending:             { icon: <Clock size={13} />,        label: 'Menunggu',     color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  Analysing:           { icon: <RefreshCw size={13} />,    label: 'Dianalisis',   color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  UnderReview:         { icon: <FileText size={13} />,     label: 'Direview',     color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  Accepted:            { icon: <CheckCircle size={13} />,  label: 'Diterima',     color: '#14532d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  Rejected:            { icon: <XCircle size={13} />,      label: 'Ditolak',      color: '#7f1d1d', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  ReturnedForRevision: { icon: <AlertCircle size={13} />,  label: 'Perlu Revisi', color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/api/vendor/submissions')
      setSubmissions(Array.isArray(data) ? data : [])
    } catch { } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const stats = {
    total:    submissions.length,
    pending:  submissions.filter(s => [0, 1, 2].includes(s.status)).length,
    accepted: submissions.filter(s => s.status === 3).length,
    rejected: submissions.filter(s => s.status === 4).length,
  }

  const greeting = () => {
    if (!mounted) return 'Halo'
    const h = new Date().getHours()
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const firstName = user?.fullName?.split(' ').slice(0, 2).join(' ') ?? 'Vendor'

  return (
    <Shell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .sub-page * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sub-page { animation: fadeUp 0.4s ease both; }
        .stat-card {
          background: #fff;
          border: 1px solid #e8edf5;
          border-radius: 16px;
          padding: 18px 20px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          cursor: default;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,23,42,0.08);
        }
        .new-btn {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, #185FA5 0%, #0e4a85 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 16px rgba(24,95,165,0.3);
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin-top: 20px;
        }
        .new-btn:hover {
          background: linear-gradient(135deg, #1568b8 0%, #0c3d70 100%);
          box-shadow: 0 6px 20px rgba(24,95,165,0.4);
          transform: translateY(-1px);
        }
        .new-btn:active { transform: translateY(0); }
        .sub-row {
          width: 100%;
          padding: 16px 20px;
          background: none;
          border: none;
          border-top: 1px solid #f1f5f9;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          transition: background 0.15s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .sub-row:first-child { border-top: none; }
        .sub-row:hover { background: #f8fafc; }
        .sub-row:hover .sub-arrow { color: #185FA5; transform: translateX(2px); }
        .sub-arrow { color: #cbd5e1; transition: all 0.15s ease; }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 20px;
          padding: 4px 10px;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .refresh-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: all 0.15s ease;
        }
        .refresh-btn:hover { background: #f1f5f9; color: #185FA5; }
        .icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 56px 24px;
          text-align: center;
        }
        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="sub-page" style={{ maxWidth: 740, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {greeting()}, {firstName} 👋
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>
                {user?.companyName && <span style={{ color: '#64748b', fontWeight: 600 }}>{user.companyName} · </span>}
                {user?.email}
              </p>
            </div>
            {submissions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '5px 12px' }}>
                <TrendingUp size={13} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{stats.accepted} Diterima</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Pengajuan', value: stats.total,    color: '#1d4ed8', icon: '📋' },
            { label: 'Diproses',        value: stats.pending,  color: '#b45309', icon: '⏳' },
            { label: 'Diterima',        value: stats.accepted, color: '#15803d', icon: '✅' },
            { label: 'Ditolak',         value: stats.rejected, color: '#b91c1c', icon: '❌' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <button className="new-btn" onClick={() => router.push('/submissions/new')}>
          <Plus size={18} />
          Buat Pengajuan Baru
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#e8edf5' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Riwayat Pengajuan</span>
          <div style={{ flex: 1, height: 1, background: '#e8edf5' }} />
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e8edf5', overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Semua Pengajuan</span>
              {submissions.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#64748b', borderRadius: 20, padding: '2px 8px' }}>
                  {submissions.length}
                </span>
              )}
            </div>
            <button className="refresh-btn" onClick={() => fetchSubmissions(true)}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 0', gap: 10 }}>
              <Loader2 size={20} style={{ color: '#185FA5', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Memuat data...</span>
            </div>
          )}

          {!loading && submissions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <Send size={26} style={{ color: '#94a3b8' }} />
              </div>
              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 15 }}>Belum ada pengajuan</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, maxWidth: 280, lineHeight: 1.6 }}>
                Klik tombol <strong style={{ color: '#185FA5' }}>Buat Pengajuan Baru</strong> untuk memulai pengajuan pertama Anda
              </p>
            </div>
          )}

          {!loading && submissions.map((s, i) => {
            const cfg = STATUS_CONFIG[s.statusLabel] ?? STATUS_CONFIG['Pending']
            return (
              <button key={s.id} className="sub-row" onClick={() => router.push(`/submissions/${s.id}`)}>
                <div className="icon-wrap" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>{s.submissionNumber}</span>
                    {' · '}{formatDateTime(s.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="status-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <span className="status-dot" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                  <ChevronRight size={15} className="sub-arrow" />
                </div>
              </button>
            )
          })}
        </div>

        {submissions.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 20, fontWeight: 500 }}>
            Menampilkan {submissions.length} pengajuan
          </p>
        )}
      </div>
    </Shell>
  )
}
