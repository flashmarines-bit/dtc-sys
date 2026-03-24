'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle,
         RotateCcw, Clock, FileText, AlertTriangle } from 'lucide-react'

const STATUS_STEPS = [
  { key: 'Pending',             label: 'Menunggu Upload',  desc: 'File PDF belum diupload' },
  { key: 'Analysing',           label: 'Dianalisis',       desc: 'OCR & AI sedang memproses' },
  { key: 'UnderReview',         label: 'Direview',         desc: 'Validator sedang mereview' },
  { key: 'Accepted',            label: 'Disetujui',        desc: 'Dokumen diterima' },
]

export default function VendorSubmissionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSub()
  }, [id])

  // FIX: Auto-refresh pakai sub sebagai dependency agar tidak stale closure
  useEffect(() => {
    if (sub?.statusLabel !== 'Analysing') return
    const interval = setInterval(fetchSub, 10000)
    return () => clearInterval(interval)
  }, [sub?.statusLabel])

  const fetchSub = async () => {
    try {
      const { data } = await api.get<VendorSubmission>(`/api/vendor/submissions/${id}`)
      setSub(data)
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diterima')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/api/vendor/submissions/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('File berhasil diupload! Analisis dimulai...')
      await fetchSub()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleResubmit = async () => {
    try {
      const { data } = await api.post(`/api/vendor/submissions/${id}/resubmit`, {
        notes: 'Resubmission dari vendor'
      })
      toast.success('Resubmission berhasil! Silakan upload file baru.')
      router.push(`/vendor/submissions/${data.newSubmissionId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal resubmit')
    }
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

  const canUpload = sub.statusLabel === 'Pending'
  const canResubmit = sub.statusLabel === 'Rejected' || sub.statusLabel === 'ReturnedForRevision'
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === sub.statusLabel)
  const isTerminal = ['Accepted', 'Rejected', 'ReturnedForRevision'].includes(sub.statusLabel)

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">{sub.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{sub.submissionNumber} · {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            sub.statusLabel === 'Rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            sub.statusLabel === 'ReturnedForRevision' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Analysing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        {/* Progress stepper */}
        {!isTerminal && (
          <Card className="bg-card/80 border-border mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx < currentStepIdx ? 'bg-green-600 text-foreground' :
                        idx === currentStepIdx ? 'bg-blue-600 text-foreground ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' :
                        'bg-muted text-muted-foreground/70'
                      }`}>
                        {idx < currentStepIdx ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <p className={`text-xs mt-2 text-center max-w-16 ${idx === currentStepIdx ? 'text-blue-400' : idx < currentStepIdx ? 'text-green-400' : 'text-muted-foreground/70'}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-6 ${idx < currentStepIdx ? 'bg-green-600' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status cards untuk terminal states */}
        {sub.statusLabel === 'Accepted' && (
          <Card className="bg-green-900/20 border-green-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">Pengajuan Disetujui!</p>
                  {sub.resultDocumentNumber && (
                    <p className="text-green-300/70 text-sm mt-1">
                      Nomor Dokumen: <span className="font-bold text-green-300">{sub.resultDocumentNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'Rejected' && (
          <Card className="bg-red-900/20 border-red-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Pengajuan Ditolak</p>
                  {sub.rejectionReason && (
                    <p className="text-red-300/70 text-sm mt-1">{sub.rejectionReason}</p>
                  )}
                  {sub.resubmissionCount < sub.maxResubmissions && (
                    <Button onClick={handleResubmit} size="sm"
                      className="mt-3 bg-red-700 hover:bg-red-600 text-foreground gap-2">
                      <RotateCcw className="w-3 h-3" /> Ajukan Ulang ({sub.maxResubmissions - sub.resubmissionCount}x tersisa)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'ReturnedForRevision' && (
          <Card className="bg-orange-900/20 border-orange-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-400 font-medium">Perlu Revisi</p>
                  {sub.returnNotes && (
                    <p className="text-orange-300/70 text-sm mt-1">{sub.returnNotes}</p>
                  )}
                  <Button onClick={handleResubmit} size="sm"
                    className="mt-3 bg-orange-700 hover:bg-orange-600 text-foreground gap-2">
                    <RotateCcw className="w-3 h-3" /> Ajukan Ulang dengan Revisi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Upload section */}
          <Card className="bg-card/80 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> File Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canUpload ? (
                <div>
                  <p className="text-muted-foreground text-xs mb-3">Upload file PDF (maks. 100MB, min. 300 DPI)</p>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload}
                    className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload">
                    <div className={`border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <><Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
                        <p className="text-muted-foreground text-sm">Mengupload...</p></>
                      ) : (
                        <><Upload className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Klik untuk pilih PDF</p>
                        <p className="text-muted-foreground/70 text-xs mt-1">atau drag & drop</p></>
                      )}
                    </div>
                  </label>
                </div>
              ) : sub.fileName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm truncate max-w-40">{sub.fileName}</p>
                    <p className="text-muted-foreground text-xs">{sub.pageCount > 0 ? `${sub.pageCount} halaman` : 'Sedang diproses'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada file</p>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-card/80 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-sm">Detail Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'Perusahaan', value: sub.vendorCompanyName },
                { label: 'Ref', value: sub.referenceNumber || '-' },
                { label: 'Nilai', value: sub.documentValue ? `Rp ${sub.documentValue.toLocaleString('id-ID')}` : '-' },
                { label: 'Kadaluarsa', value: new Date(sub.expiresAt).toLocaleDateString('id-ID') },
                { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground text-xs">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Analysing indicator */}
        {sub.statusLabel === 'Analysing' && (
          <Card className="bg-blue-900/20 border-blue-700/50 mt-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">Analisis sedang berjalan...</p>
                  <p className="text-blue-300/70 text-xs mt-0.5">OCR & AI sedang memproses dokumen Anda. Halaman ini akan otomatis refresh.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
