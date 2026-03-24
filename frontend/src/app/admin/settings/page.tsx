'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Loader2, Mail, Clock, FileText, Shield, RefreshCw, Database, Plus, X, Tag } from 'lucide-react'

interface Setting { key: string; value: string; description?: string }

const SETTING_GROUPS = [
  {
    title: 'Email / SMTP',
    icon: <Mail className="w-4 h-4 text-blue-400" />,
    accent: 'border-l-blue-500',
    desc: 'Konfigurasi server email untuk pengiriman notifikasi, alert SLA, dan pemberitahuan validator',
    keys: [
      { key: 'Email:SmtpServer',     label: 'SMTP Server',     placeholder: 'smtp.gmail.com' },
      { key: 'Email:SmtpPort',       label: 'SMTP Port',       placeholder: '587' },
      { key: 'Email:SenderEmail',    label: 'Sender Email',    placeholder: 'noreply@company.com' },
      { key: 'Email:SenderName',     label: 'Sender Name',     placeholder: 'DTC System' },
      { key: 'Email:AppPassword',    label: 'App Password',    placeholder: '••••••••••••••••', type: 'password' },
      { key: 'Email:ValidatorEmail', label: 'Validator Email', placeholder: 'validator@company.com' },
    ]
  },
  {
    title: 'SLA Thresholds',
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    accent: 'border-l-yellow-500',
    desc: 'Batas waktu peringatan otomatis — sistem akan alert jika dokumen melebihi batas ini',
    keys: [
      { key: 'Sla:UnprocessedHours',   label: 'Alert: Belum Diproses (jam)',         placeholder: '4' },
      { key: 'Sla:PendingReviewHours', label: 'Alert: Belum Direview (jam)',          placeholder: '8' },
      { key: 'Sla:ExpiryWarningDays',  label: 'Alert: Mendekati Kadaluarsa (hari)',   placeholder: '3' },
    ]
  },
  {
    title: 'Document Rules',
    icon: <FileText className="w-4 h-4 text-green-400" />,
    accent: 'border-l-green-500',
    desc: 'Aturan validasi file upload: ukuran, kualitas scan, masa berlaku, dan batas resubmit',
    keys: [
      { key: 'Document:MinDpi',           label: 'Minimum DPI',              placeholder: '300' },
      { key: 'Document:MaxFileSizeMb',    label: 'Max File Size (MB)',        placeholder: '100' },
      { key: 'Document:ExpiryDays',       label: 'Submission Expiry (hari)', placeholder: '30' },
      { key: 'Document:MaxResubmissions', label: 'Max Resubmissions',        placeholder: '3' },
    ]
  },
  {
    title: 'Security',
    icon: <Shield className="w-4 h-4 text-red-400" />,
    accent: 'border-l-red-500',
    desc: 'Rate limiting API per endpoint — mencegah abuse dan serangan brute force',
    keys: [
      { key: 'Security:RateLimit:AuthPerMinute',   label: 'Rate Limit Auth (req/menit)',   placeholder: '10' },
      { key: 'Security:RateLimit:UploadPerMinute', label: 'Rate Limit Upload (req/menit)', placeholder: '20' },
      { key: 'Security:RateLimit:GlobalPerMinute', label: 'Rate Limit Global (req/menit)', placeholder: '200' },
    ]
  },
  {
    title: 'IT Support',
    icon: <Shield className="w-4 h-4 text-orange-400" />,
    accent: 'border-l-orange-500',
    desc: 'Konfigurasi link IT Support yang tampil di halaman login Internal Portal',
    keys: [
      { key: 'it_support_url',   label: 'IT Support URL',   placeholder: 'mailto:itsupport@company.com atau https://helpdesk.company.com' },
      { key: 'it_support_label', label: 'IT Support Label', placeholder: 'IT Support' },
    ]
  },
]

const STATUS_COLOR: Record<string, string> = {
  Draft: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  Submitted: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  Pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  Analysing: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  UnderReview: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  ReceivedAtFrontDesk: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  ReceivedByVerifikator: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  Approved: 'bg-green-500/15 text-green-300 border-green-500/25',
  Accepted: 'bg-green-500/15 text-green-300 border-green-500/25',
  Rejected: 'bg-red-500/15 text-red-300 border-red-500/25',
  Returned: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  ReturnedForRevision: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  Archived: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  Proposed: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
}

const STATUS_ICON: Record<string, string> = {
  Draft: '📝', Submitted: '📤', Pending: '⏳', Analysing: '🔍',
  UnderReview: '👁️', ReceivedAtFrontDesk: '🏢', ReceivedByVerifikator: '✋',
  Approved: '✅', Accepted: '✅', Rejected: '❌', Returned: '↩️',
  ReturnedForRevision: '↩️', Archived: '🗄️', Proposed: '💡',
}

const STATUS_LABEL_CONFIG = [
  { key: 'MasterData:Status:Module1', label: 'Status Modul 1 — Tracking',         icon: '📦', desc: 'Format: StatusKey:Label Tampil (pisah koma)' },
  { key: 'MasterData:Status:Module2', label: 'Status Modul 2 — E-Library',         icon: '📚', desc: 'Format: StatusKey:Label Tampil (pisah koma)' },
  { key: 'MasterData:Status:Module3', label: 'Status Modul 3 — Vendor Submission', icon: '📋', desc: 'Format: StatusKey:Label Tampil (pisah koma)' },
]

const MASTER_DATA_CONFIG = [
  { key: 'MasterData:Library:Categories', label: 'Kategori E-Library', icon: '📁', desc: 'Kategori pengelompokan dokumen di E-Library' },
  { key: 'MasterData:Library:Tags',        label: 'Tags E-Library',    icon: '🏷️', desc: 'Tag/label untuk dokumen di E-Library' },
  { key: 'MasterData:Modules',             label: 'Modul Aplikasi',    icon: '🧩', desc: 'Daftar modul yang tersedia (format: ID:Nama)' },
  { key: 'MasterData:DocumentRoles',       label: 'Role Dokumen',      icon: '👥', desc: 'Role yang bisa diassign sebagai akses dokumen' },
]

const ITEM_COLORS = [
  'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'bg-teal-500/15 text-teal-300 border-teal-500/25',
  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'bg-rose-500/15 text-rose-300 border-rose-500/25',
  'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  'bg-green-500/15 text-green-300 border-green-500/25',
  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const [masterData, setMasterData] = useState<Record<string, string[]>>({})
  const [mdDirty, setMdDirty] = useState<Set<string>>(new Set())
  const [mdSaving, setMdSaving] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Record<string, string>>({})
  const [statusSearch, setStatusSearch] = useState<Record<string, string>>({})

  useEffect(() => { fetchSettings(); fetchMasterData() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/api/system-settings')
      const map: Record<string, string> = {}
      data.forEach((s: Setting) => { map[s.key] = s.value ?? '' })
      setSettings(map)
    } catch { toast.error('Gagal memuat settings') }
    finally { setLoading(false) }
  }

  const fetchMasterData = async () => {
    try {
      const { data } = await api.get('/api/system-settings')
      const md: Record<string, string[]> = {}
      const mdKeys = [
        'MasterData:Library:Categories', 'MasterData:Library:Tags',
        'MasterData:Modules', 'MasterData:DocumentRoles',
        'MasterData:Status:Module1', 'MasterData:Status:Module2', 'MasterData:Status:Module3'
      ]
      mdKeys.forEach(k => {
        const found = data.find((s: { key: string; value: string }) => s.key === k)
        md[k] = found?.value ? found.value.split(',').map((v: string) => v.trim()).filter(Boolean) : []
      })
      setMasterData(md)
    } catch {}
  }

  const handleChange = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    setDirty(d => new Set(d).add(key))
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await api.put(`/api/system-settings/${key}`, settings[key])
      setDirty(d => { const nd = new Set(d); nd.delete(key); return nd })
      toast.success('Setting disimpan')
    } catch { toast.error('Gagal menyimpan') }
    finally { setSaving(null) }
  }

  const handleSaveGroup = async (keys: string[]) => {
    for (const key of keys) { if (dirty.has(key)) await handleSave(key) }
  }

  const handleMdAdd = (key: string) => {
    const val = newItem[key]?.trim()
    if (!val) return
    setMasterData(prev => ({ ...prev, [key]: [...(prev[key] ?? []), val] }))
    setNewItem(prev => ({ ...prev, [key]: '' }))
    setMdDirty(prev => new Set(prev).add(key))
  }

  const handleMdRemove = (key: string, idx: number) => {
    setMasterData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }))
    setMdDirty(prev => new Set(prev).add(key))
  }

  const handleMdSave = async (key: string) => {
    setMdSaving(key)
    try {
      await api.put(`/api/system-settings/${key}`, masterData[key].join(','), {
        headers: { 'Content-Type': 'application/json' }
      })
      setMdDirty(prev => { const s = new Set(prev); s.delete(key); return s })
      toast.success('Master data disimpan')
    } catch { toast.error('Gagal menyimpan') }
    finally { setMdSaving(null) }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-muted-foreground ml-3">Memuat settings...</span>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Konfigurasi sistem DTC</p>
          </div>
          <Button onClick={fetchSettings} variant="outline" className="border-border text-foreground/80 hover:bg-muted gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* ── SETTING GROUPS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SETTING_GROUPS.map(group => (
            <Card key={group.title} className={`bg-card/80 border-border border-l-2 ${group.accent}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  {group.icon} {group.title}
                  {group.keys.filter(k => dirty.has(k.key)).length > 0 && (
                    <span className="ml-auto text-xs text-yellow-400 font-normal">
                      ● {group.keys.filter(k => dirty.has(k.key)).length} unsaved
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs">{group.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {group.keys.map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-foreground/80 text-xs block mb-1">{item.label}</label>
                        <div className="flex gap-2">
                          <Input
                            type={item.type ?? 'text'}
                            value={settings[item.key] ?? ''}
                            onChange={e => handleChange(item.key, e.target.value)}
                            placeholder={item.placeholder}
                            className={`bg-muted border-border text-foreground placeholder:text-muted-foreground/70 text-sm flex-1 ${dirty.has(item.key) ? 'border-yellow-500/50' : ''}`}
                          />
                          {dirty.has(item.key) && (
                            <Button onClick={() => handleSave(item.key)} disabled={saving === item.key} size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-foreground gap-1 px-3">
                              {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {group.keys.some(k => dirty.has(k.key)) && (
                  <div className="pt-3 mt-3 border-t border-border">
                    <Button onClick={() => handleSaveGroup(group.keys.map(k => k.key))}
                      className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2 text-sm" size="sm">
                      <Save className="w-3 h-3" /> Simpan Semua
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── STATUS LABELS ── */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Status Labels</h2>
              <p className="text-muted-foreground text-sm">Konfigurasi label tampil per status di setiap modul. Format: <code className="text-blue-300 text-xs">StatusKey:Label</code></p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {STATUS_LABEL_CONFIG.map(cfg => (
              <Card key={cfg.key} className="bg-card/80 border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <span>{cfg.icon}</span> {cfg.label}
                    <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
                      {(masterData[cfg.key] ?? []).length}
                    </span>
                    {mdDirty.has(cfg.key) && <span className="text-xs text-yellow-400 font-normal ml-auto">● Unsaved</span>}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">{cfg.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-1 flex flex-col h-full" style={{gap: '6px'}}>
                  <div className="relative">
                    <input type="text" placeholder="Filter status..."
                      value={statusSearch[cfg.key] ?? ''}
                      onChange={e => setStatusSearch(prev => ({...prev, [cfg.key]: e.target.value}))}
                      className="w-full h-7 px-2.5 text-xs bg-muted/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1.5 overflow-y-auto flex-1 group" style={{flex: '1'}}>
                    {(masterData[cfg.key] ?? [])
                      .filter(item => !statusSearch[cfg.key] || item.toLowerCase().includes((statusSearch[cfg.key] ?? '').toLowerCase()))
                      .map((item, i) => {
                        const [key, ...labelParts] = item.split(':')
                        const label = labelParts.join(':')
                        const colorClass = STATUS_COLOR[key] ?? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                        const icon = STATUS_ICON[key] ?? '🔵'
                        return (
                          <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-all ${colorClass}`}
                            style={{animation: 'fadeIn 0.2s ease'}}>
                            <span className="text-sm flex-shrink-0">{icon}</span>
                            <code className="text-xs font-mono flex-shrink-0 opacity-70 truncate" style={{maxWidth:"110px"}}>{key}</code>
                            <span className="text-xs opacity-50 flex-shrink-0">→</span>
                            <span className="text-xs font-medium flex-1 truncate">{label}</span>
                            <button onClick={() => handleMdRemove(cfg.key, i)}
                              className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex-shrink-0 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    {(masterData[cfg.key] ?? []).length === 0 && (
                      <span className="text-muted-foreground text-xs italic">Belum ada status</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <input type="text" placeholder="StatusKey:Label Tampil"
                      value={newItem[cfg.key] ?? ''}
                      onChange={e => setNewItem(prev => ({...prev, [cfg.key]: e.target.value}))}
                      onKeyDown={e => e.key === 'Enter' && handleMdAdd(cfg.key)}
                      className="flex-1 h-8 px-2.5 text-xs bg-muted/50 border border-border rounded-md text-foreground font-mono placeholder:text-muted-foreground/50 outline-none focus:border-blue-500/50"
                    />
                    <Button onClick={() => handleMdAdd(cfg.key)} size="sm" variant="outline"
                      className="h-8 px-2 border-border text-foreground/80 hover:bg-muted">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    {mdDirty.has(cfg.key) && (
                      <Button onClick={() => handleMdSave(cfg.key)} size="sm" disabled={mdSaving === cfg.key}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white gap-1">
                        {mdSaving === cfg.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── MASTER DATA ── */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Master Data</h2>
              <p className="text-muted-foreground text-sm">Konfigurasi data pilihan yang digunakan di seluruh aplikasi</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{alignItems: 'stretch'}}>
            {MASTER_DATA_CONFIG.map(cfg => (
              <Card key={cfg.key} className="bg-card/80 border-border h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <span>{cfg.icon}</span> {cfg.label}
                    <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
                      {(masterData[cfg.key] ?? []).length}
                    </span>
                    {mdDirty.has(cfg.key) && <span className="text-xs text-yellow-400 font-normal ml-auto">● Belum disimpan</span>}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">{cfg.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-1 flex flex-col h-full justify-between" style={{gap: '8px'}}>
                  <div className="space-y-1.5">
                    {(masterData[cfg.key] ?? []).map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-all ${ITEM_COLORS[i % ITEM_COLORS.length]}`}
                        style={{animation: 'fadeIn 0.15s ease'}}>
                        <span className="text-xs font-medium flex-1">{item}</span>
                        <button onClick={() => handleMdRemove(cfg.key, i)}
                          className="opacity-50 hover:opacity-100 hover:text-red-400 transition-all flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(masterData[cfg.key] ?? []).length === 0 && (
                      <div className="flex items-center justify-center w-full h-16 text-muted-foreground/40 text-xs italic border border-dashed border-border/50 rounded-lg">
                        Belum ada item — tambahkan di bawah
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 mt-auto border-t border-border/30">
                    <Input value={newItem[cfg.key] ?? ''}
                      onChange={e => setNewItem(prev => ({ ...prev, [cfg.key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleMdAdd(cfg.key)}
                      placeholder="+ Tambah item baru..."
                      className="bg-muted/50 border-border/50 text-foreground text-xs h-8 flex-1 focus:border-blue-500/50 transition-colors"
                    />
                    <Button onClick={() => handleMdAdd(cfg.key)} size="sm" variant="outline"
                      className="h-8 px-2 border-border text-foreground/80 hover:bg-muted">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                    {mdDirty.has(cfg.key) && (
                      <Button onClick={() => handleMdSave(cfg.key)} size="sm" disabled={mdSaving === cfg.key}
                        className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white gap-1">
                        {mdSaving === cfg.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppShell>
  )
}
