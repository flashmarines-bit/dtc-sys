'use client'

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
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-500/20 text-muted-foreground', icon: null }
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
            <h1 className="text-2xl font-bold text-foreground">Pengajuan Dokumen</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola pengajuan dokumen Anda</p>
          </div>
          <Button
            onClick={() => router.push('/vendor/submissions/new')}
            className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2"
          >
            <Plus className="w-4 h-4" /> Pengajuan Baru
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Diproses', value: stats.pending, color: 'text-yellow-400' },
            { label: 'Disetujui', value: stats.approved, color: 'text-green-400' },
            { label: 'Ditolak', value: stats.rejected, color: 'text-red-400' },
          ].map(s => (
            <Card key={s.label} className="bg-card/80 border-border">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-xs mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground text-base">Daftar Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-muted-foreground ml-3">Memuat data...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada pengajuan</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Klik "Pengajuan Baru" untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => router.push(`/vendor/submissions/${sub.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{sub.title}</p>
                        <p className="text-muted-foreground/70 text-xs mt-0.5">
                          {sub.submissionNumber} · {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.aiScore && (
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-muted-foreground">AI Score</p>
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
