'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { VendorSubmission } from '@/types'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import { Plus, FileText, Clock, CheckCircle, XCircle, RefreshCw, Loader2, ChevronRight, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending:              <Clock className="w-4 h-4" />,
  Analysing:            <RefreshCw className="w-4 h-4 animate-spin" />,
  UnderReview:          <FileText className="w-4 h-4" />,
  Accepted:             <CheckCircle className="w-4 h-4" />,
  Rejected:             <XCircle className="w-4 h-4" />,
  ReturnedForRevision:  <RefreshCw className="w-4 h-4" />,
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get('/api/vendor/submissions')
      setSubmissions(Array.isArray(data) ? data : [])
    } catch { } finally { setLoading(false) }
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => [0, 1, 2].includes(s.status)).length,
    accepted: submissions.filter(s => s.status === 3).length,
    rejected: submissions.filter(s => s.status === 4).length,
    returned: submissions.filter(s => s.status === 5).length,
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat Pagi'
    if (h < 15) return 'Selamat Siang'
    if (h < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          {greeting()}, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Diproses', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
          { label: 'Diterima', value: stats.accepted, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Ditolak', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl border p-4", s.bg)}>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">{s.label}</p>
            <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New Submission Button */}
      <button onClick={() => router.push('/submissions/new')}
        className="w-full mb-6 py-4 rounded-2xl bg-[var(--primary)] text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md">
        <Plus className="w-5 h-5" />
        Buat Pengajuan Baru
      </button>

      {/* Submissions List */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--foreground)]">Riwayat Pengajuan</h2>
          <button onClick={fetchSubmissions} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            <span className="ml-3 text-[var(--muted-foreground)] text-sm">Memuat data...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <p className="font-semibold text-[var(--foreground)]">Belum ada pengajuan</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Klik tombol di atas untuk membuat pengajuan pertama Anda</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {submissions.map(s => (
              <button key={s.id} onClick={() => router.push(`/submissions/${s.id}`)}
                className="w-full px-5 py-4 hover:bg-[var(--muted)] transition-colors text-left flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", getStatusColor(s.status))}>
                  {STATUS_ICONS[s.statusLabel] ?? <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--foreground)] truncate">{s.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.submissionNumber} · {formatDateTime(s.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", getStatusColor(s.status))}>
                    {s.statusLabel}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}
