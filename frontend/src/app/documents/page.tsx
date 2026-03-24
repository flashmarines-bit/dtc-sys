'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, FileText, Loader2, QrCode, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface Document {
  id: string
  documentNumber: string
  title: string
  status: number
  qrCode?: string
  vendorName?: string
  createdAt: string
  updatedAt?: string
}

const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  0:  { label: 'Draft',              color: 'text-muted-foreground' },
  1:  { label: 'Diajukan',           color: 'text-yellow-400' },
  2:  { label: 'Sedang Diantar',     color: 'text-blue-400' },
  3:  { label: 'Di Front Desk',      color: 'text-orange-400' },
  4:  { label: 'Transit Internal',   color: 'text-orange-400' },
  5:  { label: 'Menunggu Konfirmasi',color: 'text-yellow-400' },
  6:  { label: 'Diterima Verifikator', color: 'text-purple-400' },
  7:  { label: 'Dititip Pending',    color: 'text-pink-400' },
  8:  { label: 'Sedang Direview',    color: 'text-blue-400' },
  9:  { label: 'Return Dimulai',     color: 'text-orange-400' },
  10: { label: 'Menunggu Pickup',    color: 'text-yellow-400' },
  11: { label: 'Dikembalikan',       color: 'text-red-400' },
  12: { label: 'Disetujui',          color: 'text-green-400' },
  13: { label: 'Ditolak',            color: 'text-red-400' },
  14: { label: 'Diarsipkan',         color: 'text-muted-foreground' },
}

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/api/documents?pageSize=50')
      setDocs(data.documents ?? data.items ?? (Array.isArray(data) ? data : []))
    } catch { toast.error('Gagal memuat dokumen') }
    finally { setLoading(false) }
  }

  const filtered = docs.filter(d =>
    d.documentNumber?.toLowerCase().includes(search.toLowerCase()) ||
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.vendorName?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    active: docs.filter(d => d.status >= 1 && d.status <= 11).length,
    inReview: docs.filter(d => d.status === 8).length,
    approved: docs.filter(d => d.status === 12).length,
    breach: docs.filter(d => d.status === 13).length,
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Physical Tracking</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor perjalanan dokumen fisik</p>
          </div>
          <button onClick={() => router.push('/mobile/scan')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-foreground px-4 py-2 rounded-lg text-sm transition-colors">
            <QrCode className="w-4 h-4" /> Scan QR
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Aktif', value: stats.active, icon: <Clock className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
            { label: 'Direview', value: stats.inReview, icon: <FileText className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
            { label: 'Disetujui', value: stats.approved, icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/20' },
            { label: 'Ditolak', value: stats.breach, icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/20' },
          ].map(s => (
            <Card key={s.label} className="bg-card/80 border-border">
              <CardContent className="pt-5">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <span className={s.color}>{s.icon}</span>
                </div>
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List */}
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-foreground text-base flex-1">Daftar Dokumen</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nomor, judul, vendor..."
                  className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground/70 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-muted-foreground ml-3">Memuat...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Tidak ada dokumen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(doc => {
                  const statusCfg = STATUS_CONFIG[doc.status] ?? { label: String(doc.status), color: 'text-muted-foreground' }
                  return (
                    <div key={doc.id}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-medium">{doc.title}</p>
                          <p className="text-muted-foreground/70 text-xs mt-0.5">
                            {doc.documentNumber}
                            {doc.vendorName && ` · ${doc.vendorName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
