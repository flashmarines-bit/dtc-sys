'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, QrCode, Clock, User, FileText, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react'

interface TrackingLog {
  id: string
  event: number
  eventLabel: string
  fromStatus?: number
  toStatus?: number
  notes?: string
  actedByUserId?: string
  actedByUserName?: string
  recipientUserId?: string
  recipientUserName?: string
  hasPhotoProof: boolean
  otpConfirmed: boolean
  createdAt: string
}

interface DocumentDetail {
  id: string
  documentNumber: string
  qrCode?: string
  title: string
  description?: string
  status: number
  originalFileName?: string
  documentTypeCode: string
  documentTypeName: string
  createdByUserId: string
  createdByUserName: string
  createdAt: string
  updatedAt?: string
}

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  0:  { label: 'Draft',               color: 'text-muted-foreground',  bg: 'bg-slate-500/20' },
  1:  { label: 'Diajukan',            color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  2:  { label: 'Sedang Diantar',      color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  3:  { label: 'Di Front Desk',       color: 'text-orange-400', bg: 'bg-orange-500/20' },
  5:  { label: 'Menunggu Konfirmasi', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  6:  { label: 'Diterima Verifikator',color: 'text-purple-400', bg: 'bg-purple-500/20' },
  7:  { label: 'Dititip Pending',     color: 'text-pink-400',   bg: 'bg-pink-500/20' },
  8:  { label: 'Sedang Direview',     color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  10: { label: 'Menunggu Pickup',     color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  11: { label: 'Dikembalikan',        color: 'text-red-400',    bg: 'bg-red-500/20' },
  12: { label: 'Disetujui ✅',        color: 'text-green-400',  bg: 'bg-green-500/20' },
  13: { label: 'Ditolak ❌',          color: 'text-red-400',    bg: 'bg-red-500/20' },
}

export default function DocumentDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [history, setHistory] = useState<TrackingLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<DocumentDetail>(`/api/documents/${id}`),
      api.get<TrackingLog[]>(`/api/tracking/${id}/history`)
    ]).then(([docRes, histRes]) => {
      setDoc(docRes.data)
      setHistory(Array.isArray(histRes.data) ? histRes.data : [])
    }).catch(() => toast.error('Gagal memuat data'))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    </AppShell>
  )

  if (!doc) return (
    <AppShell>
      <div className="p-8 text-muted-foreground">Dokumen tidak ditemukan.</div>
    </AppShell>
  )

  const statusCfg = STATUS_CONFIG[doc.status] ?? { label: String(doc.status), color: 'text-muted-foreground', bg: 'bg-slate-500/20' }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-3xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{doc.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{doc.documentNumber} · {doc.documentTypeName}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="md:col-span-2">
            <Card className="bg-card/80 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Riwayat Perjalanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Belum ada riwayat</p>
                ) : (
                  <div className="space-y-0">
                    {history.map((log, idx) => (
                      <div key={log.id} className="flex gap-3">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                            idx === 0 ? 'bg-blue-400' : 'bg-muted'
                          }`} />
                          {idx < history.length - 1 && (
                            <div className="w-0.5 bg-muted flex-1 my-1" style={{ minHeight: '24px' }} />
                          )}
                        </div>
                        {/* Content */}
                        <div className={`pb-4 flex-1 ${idx === history.length - 1 ? '' : ''}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-foreground text-sm font-medium">{log.eventLabel}</p>
                            <p className="text-muted-foreground/70 text-xs">
                              {new Date(log.createdAt).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {log.notes && (
                            <p className="text-muted-foreground text-xs mt-0.5">{log.notes}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {log.actedByUserName && (
                              <span className="flex items-center gap-1 text-muted-foreground/70 text-xs">
                                <User className="w-3 h-3" /> {log.actedByUserName}
                              </span>
                            )}
                            {log.hasPhotoProof && (
                              <span className="flex items-center gap-1 text-blue-400 text-xs">
                                <Camera className="w-3 h-3" /> Foto ada
                              </span>
                            )}
                            {log.otpConfirmed && (
                              <span className="flex items-center gap-1 text-green-400 text-xs">
                                <CheckCircle className="w-3 h-3" /> OTP verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            {/* QR Code */}
            {doc.qrCode && (
              <Card className="bg-card/80 border-border">
                <CardContent className="pt-4">
                  <p className="text-muted-foreground text-xs mb-2 text-center">QR Code Dokumen</p>
                  <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                  <p className="text-muted-foreground/70 text-xs mt-2 text-center font-mono">{doc.qrCode}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="bg-card/80 border-border">
              <CardContent className="pt-4 space-y-2">
                <Button onClick={() => router.push(`/documents/${id}/scan`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-foreground gap-2 text-sm">
                  <QrCode className="w-4 h-4" /> Aksi via Scan
                </Button>
              </CardContent>
            </Card>

            {/* Document info */}
            <Card className="bg-card/80 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-xs">Info Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: 'Tipe', value: doc.documentTypeName },
                  { label: 'Dibuat oleh', value: doc.createdByUserName },
                  { label: 'Tanggal', value: new Date(doc.createdAt).toLocaleDateString('id-ID') },
                  { label: 'File', value: doc.originalFileName ?? '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground text-right truncate max-w-28">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
