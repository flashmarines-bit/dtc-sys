'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, ClipboardList, Activity,
  Loader2, TrendingUp, AlertTriangle, Clock,
  CheckCircle, ArrowRight, QrCode
} from 'lucide-react'

interface AdminRadar {
  overview: {
    totalActive: number
    preArrival: number
    atFrontDesk: number
    pendingConfirmation: number
    inReview: number
    droppedPendingAck: number
    waitingPickup: number
    slaBreached: number
    escalationSent: number
  }
  escalations: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    holderName: string
    slaBreached: boolean
    escalationSent: boolean
  }>
  teamPerformance: Array<{
    userId: string
    name: string
    inReview: number
    breached: number
  }>
}

interface ValidatorRadar {
  summary: {
    incomingDocuments: number
    atFrontDesk: number
    droppedForMe: number
    myActiveReview: number
    slaWarning: number
    slaBreach: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    slaBreached: boolean
    urgency: string
  }>
}

interface VendorRadar {
  myDocuments: {
    total: number
    draft: number
    submitted: number
    inTransit: number
    inReview: number
    returnedToMe: number
    approved: number
    rejected: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    action: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [radar, setRadar] = useState<AdminRadar | ValidatorRadar | VendorRadar | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radarRes, usersRes] = await Promise.allSettled([
          api.get('/api/radar'),
          api.get('/api/users?pageSize=1'),
        ])
        if (radarRes.status === 'fulfilled') setRadar(radarRes.value.data)
        if (usersRes.status === 'fulfilled') {
          setTotalUsers(usersRes.value.data.totalCount
            ?? usersRes.value.data.total ?? 0)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const role = user?.role

  // ── ADMIN / SYSADMIN DASHBOARD ────────────────────────────
  const adminRadar = radar as AdminRadar
  const validatorRadar = radar as ValidatorRadar
  const vendorRadar = radar as VendorRadar

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {user?.fullName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Role: {user?.role} · {dateStr}
          </p>
        </div>

        {/* ── ADMIN / SYSADMIN ── */}
        {(role === 'SysAdmin' || role === 'Admin') && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Dokumen Aktif', value: adminRadar?.overview?.totalActive ?? '-', icon: <FileText className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Sedang Direview', value: adminRadar?.overview?.inReview ?? '-', icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { label: 'SLA Breach', value: adminRadar?.overview?.slaBreached ?? '-', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/20' },
                { label: 'Total User', value: totalUsers || '-', icon: <Users className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Status overview */}
            {adminRadar?.overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Pre-Arrival', value: adminRadar.overview.preArrival, color: 'text-yellow-400' },
                  { label: 'Di Front Desk', value: adminRadar.overview.atFrontDesk, color: 'text-orange-400' },
                  { label: 'Menunggu Konfirmasi', value: adminRadar.overview.pendingConfirmation, color: 'text-blue-400' },
                  { label: 'Dititip Pending', value: adminRadar.overview.droppedPendingAck, color: 'text-pink-400' },
                ].map(s => (
                  <div key={s.label} className="bg-card/70 border border-border/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Escalations */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Eskalasi & SLA Breach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
                    </div>
                  ) : adminRadar?.escalations?.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Tidak ada eskalasi</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.escalations?.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 bg-red-900/10 border border-red-700/30 rounded-lg">
                          <div>
                            <p className="text-foreground text-xs font-medium">{e.documentNumber}</p>
                            <p className="text-muted-foreground text-xs">{e.holderName ?? '-'}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            e.slaBreached ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {e.slaBreached ? 'SLA Breach' : 'Eskalasi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team performance */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Performa Tim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
                    </div>
                  ) : adminRadar?.teamPerformance?.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Tidak ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.teamPerformance?.map(t => (
                        <div key={String(t.userId)} className="flex items-center justify-between p-2 bg-card/70 rounded-lg">
                          <p className="text-foreground text-xs">{t.name}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-blue-400">{t.inReview} review</span>
                            {t.breached > 0 && <span className="text-red-400">{t.breached} breach</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card className="bg-card border-border">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h2 className="text-foreground text-sm font-medium">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Antrian Review', href: '/validator/queue', color: 'bg-purple-600 hover:bg-purple-700' },
                    { label: 'Scan QR', href: '/mobile/scan', color: 'bg-blue-600 hover:bg-blue-700' },
                    { label: 'User Management', href: '/admin/users', color: 'bg-muted hover:bg-slate-500' },
                    { label: 'Document Types', href: '/admin/document-types', color: 'bg-green-700 hover:bg-green-600' },
                  ].map(action => (
                    <button key={action.label} onClick={() => router.push(action.href)}
                      className={`${action.color} text-foreground text-sm text-center py-2.5 px-3 rounded-lg transition-colors`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── VALIDATOR ── */}
        {role === 'Validator' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Dokumen Menuju Saya', value: validatorRadar?.summary?.incomingDocuments ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Clock className="w-5 h-5" /> },
                { label: 'Sedang Saya Review', value: validatorRadar?.summary?.myActiveReview ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/20', icon: <ClipboardList className="w-5 h-5" /> },
                { label: 'SLA Warning', value: validatorRadar?.summary?.slaWarning ?? 0, color: 'text-red-400', bg: 'bg-red-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {validatorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm">Perlu Aksi Segera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {validatorRadar.needsAction.slice(0, 5).map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/validator/review/${d.id}`)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        d.urgency === 'critical' ? 'bg-red-900/20 border border-red-700/30 hover:bg-red-900/30' :
                        d.urgency === 'warning' ? 'bg-orange-900/20 border border-orange-700/30 hover:bg-orange-900/30' :
                        'bg-card/70 border border-border/50 hover:bg-card/80'
                      }`}>
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-muted-foreground text-xs">{d.statusLabel}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/validator/queue')}
                className="bg-purple-600 hover:bg-purple-700 text-foreground py-3 rounded-lg text-sm font-medium transition-colors">
                Antrian Review
              </button>
              <button onClick={() => router.push('/mobile/scan')}
                className="bg-blue-600 hover:bg-blue-700 text-foreground py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" /> Scan QR
              </button>
            </div>
          </>
        )}

        {/* ── USER ── */}
        {role === 'User' && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-foreground font-medium mb-2">Selamat Datang di DTC System</h2>
            <p className="text-muted-foreground text-sm">Hubungi administrator untuk mendapatkan akses fitur.</p>
          </div>
        )}

        {/* ── VENDOR ── */}
        {role === 'Vendor' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Dokumen', value: vendorRadar?.myDocuments?.total ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Diproses', value: (vendorRadar?.myDocuments?.inReview ?? 0) + (vendorRadar?.myDocuments?.submitted ?? 0), color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                { label: 'Disetujui', value: vendorRadar?.myDocuments?.approved ?? 0, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Perlu Aksi', value: vendorRadar?.needsAction?.length ?? 0, color: 'text-red-400', bg: 'bg-red-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      : <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {vendorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm text-orange-400">⚠️ Perlu Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vendorRadar.needsAction.map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/vendor/submissions/${d.id}`)}
                      className="flex items-center justify-between p-3 bg-card/70 border border-border/50 rounded-lg cursor-pointer hover:bg-card/80 transition-colors">
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-orange-400 text-xs">{d.action}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <button onClick={() => router.push('/vendor/submissions/new')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-foreground py-3 rounded-lg text-sm font-medium transition-colors">
              + Pengajuan Baru
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
