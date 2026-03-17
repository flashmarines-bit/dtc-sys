'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Shell from '@/components/layout/Shell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { formatDateTime, formatFileSize, getStatusColor, cn } from '@/lib/utils'
import {
  ChevronLeft, FileText, Clock, CheckCircle, XCircle,
  RefreshCw, Loader2, Download, Send, AlertCircle,
  Star, Info, RotateCcw
} from 'lucide-react'

export default function SubmissionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [resubmitting, setResubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [showResubmit, setShowResubmit] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/vendor/submissions/${id}`)
      setSub(data)
    } catch { router.push('/submissions') }
    finally { setLoading(false) }
  }, [id, router])

  useEffect(() => { fetch() }, [fetch])

  // Auto-refresh saat masih dianalisis
  useEffect(() => {
    if (!sub || sub.analysisCompleted) return
    const t = setInterval(fetch, 5000)
    return () => clearInterval(t)
  }, [sub, fetch])

  const handleResubmit = async () => {
    setResubmitting(true)
    setError('')
    try {
      const { data } = await api.post(`/api/vendor/submissions/${id}/resubmit`, { notes })
      router.push(`/submissions/${data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Gagal melakukan resubmisi')
    } finally { setResubmitting(false) }
  }

  if (loading) return (
    <Shell>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-[var(--muted-foreground)]">Memuat data...</span>
      </div>
    </Shell>
  )

  if (!sub) return null

  const canResubmit = sub.status === 4 || sub.status === 5
  const isProcessing = !sub.analysisCompleted && sub.status <= 2

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/submissions')}
          className="p-2 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-[var(--foreground)] truncate">{sub.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{sub.submissionNumber}</p>
        </div>
        <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0", getStatusColor(sub.status))}>
          {sub.statusLabel}
        </span>
      </div>

      <div className="space-y-4">

        {/* Processing Banner */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 text-sm">Sedang Dianalisis</p>
              <p className="text-xs text-blue-600 mt-0.5">Dokumen Anda sedang diproses oleh sistem AI. Halaman ini akan diperbarui otomatis.</p>
            </div>
          </div>
        )}

        {/* Accepted Banner */}
        {sub.status === 3 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800 text-sm">Pengajuan Diterima!</p>
              {sub.resultDocumentNumber && (
                <p className="text-xs text-green-600 mt-0.5">Nomor dokumen resmi: <span className="font-bold">{sub.resultDocumentNumber}</span></p>
              )}
            </div>
          </div>
        )}

        {/* Rejected Banner */}
        {sub.status === 4 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="font-medium text-red-800 text-sm">Pengajuan Ditolak</p>
            </div>
            {sub.rejectionReason && (
              <p className="text-xs text-red-700 ml-8">{sub.rejectionReason}</p>
            )}
            {sub.validatorNotes && (
              <p className="text-xs text-red-600 mt-1 ml-8"><span className="font-medium">Catatan:</span> {sub.validatorNotes}</p>
            )}
          </div>
        )}

        {/* Returned Banner */}
        {sub.status === 5 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <RotateCcw className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="font-medium text-orange-800 text-sm">Dikembalikan untuk Revisi</p>
            </div>
            {(sub as any).returnNotes && (
              <p className="text-xs text-orange-700 ml-8">{(sub as any).returnNotes}</p>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {sub.analysisCompleted && sub.aiScore !== undefined && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Hasil Analisis AI
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[var(--muted)] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--primary)]">{sub.aiScore}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">AI Score</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[var(--foreground)]">{sub.aiGradeLabel ?? '-'}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Grade</p>
              </div>
            </div>
            {sub.aiSummary && (
              <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] rounded-xl p-3">{sub.aiSummary}</p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-xs">
                <span className="text-[var(--muted-foreground)]">DPI: </span>
                <span className={sub.dpiPass ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {sub.detectedDpi ?? '-'} {sub.dpiPass ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-[var(--muted-foreground)]">Halaman: </span>
                <span className="font-medium text-[var(--foreground)]">{sub.pageCount}</span>
              </div>
              {sub.detectedDocumentType && (
                <div className="text-xs col-span-2">
                  <span className="text-[var(--muted-foreground)]">Tipe terdeteksi: </span>
                  <span className="font-medium text-[var(--foreground)]">{sub.detectedDocumentType}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Info */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-[var(--primary)]" /> Informasi Pengajuan
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'Judul', value: sub.title },
              { label: 'Perusahaan', value: sub.vendorCompanyName },
              { label: 'PIC', value: sub.vendorContactName },
              { label: 'Email PIC', value: sub.vendorContactEmail },
              { label: 'File', value: `${sub.fileName} (${formatFileSize(sub.fileSizeBytes)})` },
              { label: 'Tanggal Kirim', value: formatDateTime(sub.createdAt) },
              { label: 'Berlaku hingga', value: formatDateTime(sub.expiresAt) },
              sub.referenceNumber ? { label: 'No. Referensi', value: sub.referenceNumber } : null,
              sub.contractNumber ? { label: 'No. Kontrak', value: sub.contractNumber } : null,
              { label: 'Resubmisi', value: `${sub.resubmissionCount} dari ${sub.maxResubmissions}` },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex gap-3">
                <span className="text-xs text-[var(--muted-foreground)] w-28 flex-shrink-0 pt-0.5">{item.label}</span>
                <span className="text-xs text-[var(--foreground)] font-medium flex-1">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Download */}
        {sub.originalPdfUrl && (
          <a href={sub.originalPdfUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 hover:bg-[var(--muted)] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-[var(--foreground)]">Unduh Dokumen Asli</p>
              <p className="text-xs text-[var(--muted-foreground)]">{sub.fileName}</p>
            </div>
          </a>
        )}

        {/* Resubmit */}
        {canResubmit && sub.resubmissionCount < sub.maxResubmissions && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-[var(--primary)]" /> Ajukan Ulang
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                ({sub.maxResubmissions - sub.resubmissionCount} kesempatan tersisa)
              </span>
            </h2>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {!showResubmit ? (
              <button onClick={() => setShowResubmit(true)}
                className="w-full py-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] font-semibold text-sm hover:bg-blue-50 transition-all">
                Ajukan Ulang Dokumen
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Catatan revisi (opsional)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowResubmit(false)}
                    className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] font-medium text-sm hover:bg-[var(--muted)] transition-all">
                    Batal
                  </button>
                  <button onClick={handleResubmit} disabled={resubmitting}
                    className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    {resubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : 'Kirim Ulang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}
