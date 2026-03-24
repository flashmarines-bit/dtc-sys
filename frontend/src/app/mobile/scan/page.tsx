'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const QrScanner = dynamic(
  () => import('@/components/mobile/QrScanner'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64 bg-card rounded-2xl">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  )}
)

interface ScanResult {
  success: boolean
  documentNumber: string
  title: string
  currentStatus: number
  statusLabel: string
  currentHolderName?: string
  availableActions: Array<{
    actionKey: string
    label: string
    description: string
    requiresPhoto: boolean
    requiresInput: boolean
    inputLabel?: string
  }>
  message?: string
}

export default function MobileScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [acting, setActing] = useState(false)

  const handleScan = async (qrData: string) => {
    setScanning(false)
    setLoading(true)

    try {
      // QR berisi document ID atau URL dengan ID
      let docId = qrData
      const urlMatch = qrData.match(/documents\/([a-f0-9-]{36})/)
      if (urlMatch) docId = urlMatch[1]

      const { data } = await api.get<ScanResult>(`/api/documents/${docId}/scan`)
      setScanResult(data)
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'QR Code tidak valid atau dokumen tidak ditemukan'
      toast.error(msg)
      setScanResult({
        success: false,
        documentNumber: '',
        title: '',
        currentStatus: 0,
        statusLabel: '',
        availableActions: [],
        message: msg
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionKey: string, docId: string) => {
    setActing(true)
    try {
      const endpoints: Record<string, string> = {
        'frontdesk-receive'    : 'frontdesk-receive',
        'verifikator-receive'  : 'verifikator-receive',
        'vendor-confirm'       : 'confirm-handover',
        'acknowledge-dropoff'  : 'acknowledge-dropoff',
        'takeover'             : 'takeover',
        'start-review'         : 'start-review',
        'approve'              : 'approve',
        'declare-pre-arrival'  : 'pre-arrival',
      }

      const endpoint = endpoints[actionKey]
      if (!endpoint) {
        toast.error('Aksi tidak didukung via mobile scan')
        return
      }

      await api.post(`/api/documents/${docId}/${endpoint}`)
      toast.success('Aksi berhasil!')

      // Refresh scan result
      const { data } = await api.get<ScanResult>(`/api/documents/${docId}/scan`)
      setScanResult(data)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal melakukan aksi')
    } finally {
      setActing(false) }
  }

  const resetScan = () => {
    setScanResult(null)
    setScanning(true)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-foreground font-semibold">Scan QR Dokumen</h1>
      </div>

      <div className="p-4 max-w-sm mx-auto">
        {scanning && !loading && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">
              Scan QR Code yang tertera pada dokumen fisik
            </p>
            <QrScanner
              onScan={handleScan}
              onError={(err) => toast.error(err)}
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <p className="text-muted-foreground">Memuat informasi dokumen...</p>
          </div>
        )}

        {scanResult && !loading && (
          <div className="space-y-4">
            {/* Document info */}
            <Card className={`border ${scanResult.success ? 'bg-card/80 border-border' : 'bg-red-900/20 border-red-700/50'}`}>
              <CardContent className="pt-5">
                {scanResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-foreground font-medium text-sm">{scanResult.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{scanResult.documentNumber}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-foreground font-medium">{scanResult.statusLabel}</span>
                      </div>
                      {scanResult.currentHolderName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pemegang</span>
                          <span className="text-foreground">{scanResult.currentHolderName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <p className="text-red-300 text-sm">{scanResult.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available actions */}
            {scanResult.availableActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wider px-1">
                  Aksi Tersedia
                </p>
                {scanResult.availableActions.map(action => (
                  <button key={action.actionKey}
                    onClick={() => handleAction(action.actionKey, scanResult.documentNumber)}
                    disabled={acting}
                    className="w-full flex items-center justify-between p-4 bg-card/80 border border-border rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50">
                    <div className="text-left">
                      <p className="text-foreground text-sm font-medium">{action.label}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{action.description}</p>
                    </div>
                    {acting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {scanResult.availableActions.length === 0 && scanResult.success && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Tidak ada aksi yang tersedia untuk role Anda saat ini.</p>
              </div>
            )}

            {/* Scan again */}
            <Button onClick={resetScan} variant="outline"
              className="w-full border-border text-foreground/80 hover:bg-muted">
              Scan QR Lain
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
