'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ClipboardList, Loader2, Star, AlertCircle, CheckCircle } from 'lucide-react'

function AiScoreBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-muted-foreground/70 text-xs">-</span>
  const color = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-sm font-bold ${color}`}>{score}/10</span>
}

export default function ValidatorQueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorSubmission[]>('/api/validator/queue')
      .then(({ data }) => setQueue(data))
      .catch(() => toast.error('Gagal memuat antrian'))
      .finally(() => setLoading(false))
  }, [])

  const readyToReview = queue.filter(s => s.statusLabel === 'UnderReview' && s.analysisCompleted)
  const analyzing = queue.filter(s => ['Pending', 'Analysing'].includes(s.statusLabel))

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Antrian Review</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {readyToReview.length} pengajuan siap direview
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Siap Review</p>
                  <p className="text-2xl font-bold text-foreground">{readyToReview.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sedang Dianalisis</p>
                  <p className="text-2xl font-bold text-foreground">{analyzing.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Antrian</p>
                  <p className="text-2xl font-bold text-foreground">{queue.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue list */}
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground text-base">Daftar Antrian</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-muted-foreground ml-3">Memuat antrian...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-muted-foreground">Antrian kosong</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Semua pengajuan telah diproses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(sub => (
                  <div key={sub.id}
                    onClick={() => router.push(`/validator/review/${sub.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${sub.analysisCompleted ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-foreground text-sm font-medium">{sub.title}</p>
                          {!sub.analysisCompleted && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Analisis...</span>
                          )}
                        </div>
                        <p className="text-muted-foreground/70 text-xs mt-0.5">
                          {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                        </p>
                        {sub.detectedDocumentType && (
                          <p className="text-muted-foreground text-xs mt-1">
                            Tipe: <span className="text-blue-400">{sub.detectedDocumentType}</span>
                            {sub.detectedSignatoryName && ` · Penandatangan: ${sub.detectedSignatoryName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground mb-1">AI Score</p>
                        <AiScoreBadge score={sub.aiScore} />
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground mb-1">DPI</p>
                        <span className={`text-xs font-medium ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ? `${sub.detectedDpi} DPI` : '-'}
                        </span>
                      </div>
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
