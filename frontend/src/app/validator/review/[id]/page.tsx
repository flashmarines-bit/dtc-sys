'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText,
         Loader2, Star, Shield, AlertTriangle, ExternalLink } from 'lucide-react'

export default function ValidatorReviewPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCategory, setRejectCategory] = useState('KualitasScanTidakMemadai')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    api.get<VendorSubmission>(`/api/validator/review/${id}`)
      .then(({ data }) => setSub(data))
      .catch(() => toast.error('Gagal memuat data submission'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/approve`)
      toast.success('Pengajuan disetujui! Dokumen berhasil dibuat.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyetujui')
    } finally { setActing(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Isi alasan penolakan'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/reject`, {
        rejectionCategory: rejectCategory,
        rejectionReason: rejectReason,
        validatorNotes: null
      })
      toast.success('Pengajuan ditolak. Email notifikasi terkirim ke vendor.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menolak')
    } finally { setActing(false) }
  }

  const handleReturn = async () => {
    if (!returnNotes.trim()) { toast.error('Isi catatan revisi'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/return-for-revision`, { returnNotes })
      toast.success('Pengajuan dikembalikan untuk revisi.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal mengembalikan')
    } finally { setActing(false) }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-muted-foreground ml-3">Memuat data...</span>
      </div>
    </AppShell>
  )

  if (!sub) return (
    <AppShell>
      <div className="p-8 text-muted-foreground">Submission tidak ditemukan.</div>
    </AppShell>
  )

  const extractedFields = sub.extractedFieldsJson
    ? (() => { try { return JSON.parse(sub.extractedFieldsJson!) } catch { return null } })()
    : null

  const canAct = sub.statusLabel === 'UnderReview'
  const isPending = sub.statusLabel === 'Pending' || sub.statusLabel === 'Analysing'

  return (
    <AppShell>
      <div className="p-8 max-w-4xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Antrian
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{sub.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card className="bg-card/80 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Hasil Analisis AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!sub.analysisCompleted ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analisis sedang berjalan...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-muted-foreground text-xs mb-1">AI Score</p>
                        <p className={`text-2xl font-bold ${
                          (sub.aiScore ?? 0) >= 8 ? 'text-green-400' :
                          (sub.aiScore ?? 0) >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{sub.aiScore ?? '-'}<span className="text-sm text-muted-foreground">/10</span></p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-muted-foreground text-xs mb-1">Grade</p>
                        <p className="text-lg font-bold text-blue-400">{sub.aiGradeLabel ?? '-'}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-muted-foreground text-xs mb-1">DPI</p>
                        <p className={`text-lg font-bold ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ?? '-'}
                          {sub.detectedDpi && <span className="text-xs text-muted-foreground ml-1">dpi</span>}
                        </p>
                      </div>
                    </div>
                    {sub.aiSummary && (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-muted-foreground text-xs mb-1">Ringkasan AI</p>
                        <p className="text-foreground/80 text-sm">{sub.aiSummary}</p>
                      </div>
                    )}
                    {sub.detectedDocumentType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Tipe Terdeteksi:</span>
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                          {sub.detectedDocumentType}
                        </span>
                      </div>
                    )}
                    {sub.detectedSignatoryName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Penandatangan:</span>
                        <span className="text-foreground">{sub.detectedSignatoryName}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {extractedFields && Object.keys(extractedFields).length > 0 && (
              <Card className="bg-card/80 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Field Terekstrak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(extractedFields).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground text-sm min-w-32">{k}</span>
                        <span className="text-foreground text-sm">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showRejectForm && (
              <Card className="bg-red-900/10 border-red-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-400 text-base">Tolak Pengajuan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-foreground/80 text-sm block mb-1">Kategori</label>
                    <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm">
                      <option value="KualitasScanTidakMemadai">Kualitas Scan Tidak Memadai</option>
                      <option value="DokumenTidakLengkap">Dokumen Tidak Lengkap</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-foreground/80 text-sm block mb-1">Alasan *</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      rows={3} placeholder="Jelaskan alasan penolakan..."
                      className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReject} disabled={acting}
                      className="bg-red-600 hover:bg-red-700 text-foreground gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Konfirmasi Tolak
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(false)}
                      className="border-border text-foreground/80 hover:bg-muted">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showReturnForm && (
              <Card className="bg-orange-900/10 border-orange-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 text-base">Kembalikan untuk Revisi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-foreground/80 text-sm block mb-1">Catatan Revisi *</label>
                    <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
                      rows={3} placeholder="Jelaskan apa yang perlu diperbaiki..."
                      className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReturn} disabled={acting}
                      className="bg-orange-600 hover:bg-orange-700 text-foreground gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Konfirmasi Kembalikan
                    </Button>
                    <Button variant="outline" onClick={() => setShowReturnForm(false)}
                      className="border-border text-foreground/80 hover:bg-muted">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isPending && (
              <Card className="bg-card/80 border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {sub.statusLabel === 'Analysing' ? 'Analisis AI sedang berjalan...' : 'Menunggu diproses...'}
                  </div>
                </CardContent>
              </Card>
            )}
            {canAct && !showRejectForm && !showReturnForm && (
              <Card className="bg-card/80 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm">Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleApprove} disabled={acting}
                    className="w-full bg-green-600 hover:bg-green-700 text-foreground gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Setujui
                  </Button>
                  <Button onClick={() => { setShowReturnForm(true); setShowRejectForm(false) }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-foreground gap-2">
                    <RotateCcw className="w-4 h-4" /> Kembalikan untuk Revisi
                  </Button>
                  <Button onClick={() => { setShowRejectForm(true); setShowReturnForm(false) }}
                    className="w-full bg-red-600 hover:bg-red-700 text-foreground gap-2">
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/80 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm">Info Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Perusahaan', value: sub.vendorCompanyName },
                  { label: 'Kontak', value: sub.vendorContactName },
                  { label: 'Email', value: sub.vendorContactEmail },
                  { label: 'File', value: sub.fileName || '-' },
                  { label: 'Halaman', value: sub.pageCount ? `${sub.pageCount} hal` : '-' },
                  { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground text-right text-xs truncate max-w-32">{item.value}</span>
                  </div>
                ))}
                {sub.originalPdfUrl && (
                  <a href={sub.originalPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs mt-2">
                    <ExternalLink className="w-3 h-3" /> Lihat PDF Asli
                  </a>
                )}
              </CardContent>
            </Card>

            {!sub.dpiPass && sub.detectedDpi && (
              <Card className="bg-red-900/20 border-red-700/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">DPI Terlalu Rendah</p>
                      <p className="text-red-300/70 text-xs mt-1">{sub.detectedDpi} DPI (min. 300)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card/80 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Dienkripsi & terverifikasi</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
