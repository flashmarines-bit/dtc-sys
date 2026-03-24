'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Building2, Hash, ArrowUpDown } from 'lucide-react'

interface OrgFunction {
  id: string; code: string; name: string; suffix: string
  description?: string; sortOrder: number; isActive: boolean
}

const emptyForm = { code: '', name: '', suffix: '', description: '', sortOrder: 0, isActive: true }

export default function OrgFunctionsPage() {
  const [items, setItems] = useState<OrgFunction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OrgFunction | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/org-functions')
      setItems(data.functions ?? data.items ?? (Array.isArray(data) ? data : []))
    } catch { toast.error('Gagal memuat org functions') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }

  const openEdit = (item: OrgFunction) => {
    setEditItem(item)
    setForm({ code: item.code, name: item.name, suffix: item.suffix, description: item.description ?? '', sortOrder: item.sortOrder, isActive: item.isActive })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.suffix.trim()) { toast.error('Kode, nama, dan suffix wajib diisi'); return }
    setSaving(true)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) }
      if (editItem) { await api.put(`/api/org-functions/${editItem.id}`, payload); toast.success('Diperbarui') }
      else { await api.post('/api/org-functions', payload); toast.success('Dibuat') }
      setShowModal(false); await fetchItems()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (item: OrgFunction) => {
    if (!confirm(`Hapus "${item.name}"?`)) return
    try { await api.delete(`/api/org-functions/${item.id}`); toast.success('Dihapus'); await fetchItems() }
    catch (err: unknown) { toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal') }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-400" /> Organization Functions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Digunakan untuk variabel penomoran dokumen: {'{DEPT}'}, {'{FUNGSI}'}, {'{SUFFIX}'}
            </p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
            <Plus className="w-4 h-4" /> Tambah Fungsi
          </Button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm font-medium mb-2">Penggunaan dalam format penomoran</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[['{DEPT}','code','Kode singkat: PHR14410'],['{FUNGSI}','name','Nama lengkap: DWI Engineering'],['{SUFFIX}','suffix','Suffix: S0']].map(([v,f,d]) => (
              <div key={v} className="bg-muted/40 rounded p-2">
                <code className="text-blue-300 font-mono font-bold">{v}</code>
                <span className="text-muted-foreground ml-1">→ <strong className="text-foreground">{f}</strong></span>
                <p className="text-muted-foreground/70 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /><span className="ml-3 text-muted-foreground">Memuat...</span></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16"><Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" /><p className="text-muted-foreground">Belum ada org function</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...items].sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
              <Card key={item.id} className="bg-card/80 border-border hover:border-blue-500/30 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground/80 px-2 py-0.5 rounded"><Hash className="w-3 h-3" />{item.code}</span>
                          <span className="inline-flex items-center text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{item.suffix}</span>
                          {!item.isActive && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">nonaktif</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {item.description && <p className="text-muted-foreground text-xs mb-3">{item.description}</p>}
                  <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded p-2">
                    {[['DEPT', item.code],['FUNGSI', item.name.split(' ')[0]],['SUFFIX', item.suffix]].map(([label, val]) => (
                      <div key={label} className="text-center">
                        <p className="text-muted-foreground/60 text-xs">{'{'+label+'}'}</p>
                        <code className="text-blue-300 text-xs font-mono font-bold">{val}</code>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground/60 text-xs flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Urutan: {item.sortOrder}</span>
                    <span className={`text-xs font-medium ${item.isActive ? 'text-green-400' : 'text-red-400'}`}>{item.isActive ? '● Aktif' : '○ Nonaktif'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              {editItem ? 'Edit Org Function' : 'Tambah Org Function'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-xs">Kode * (DEPT)</Label>
                <Input value={form.code} onChange={set('code')} placeholder="PHR14410" className="bg-muted border-border text-foreground text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-xs">Suffix * (SUFFIX)</Label>
                <Input value={form.suffix} onChange={set('suffix')} placeholder="S0" className="bg-muted border-border text-foreground text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Nama * (FUNGSI)</Label>
              <Input value={form.name} onChange={set('name')} placeholder="DWI Engineering" className="bg-muted border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Deskripsi</Label>
              <Input value={form.description} onChange={set('description')} placeholder="Keterangan..." className="bg-muted border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Urutan Tampil</Label>
              <Input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="bg-muted border-border text-foreground text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="orgActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
              <Label htmlFor="orgActive" className="text-foreground/80 text-sm cursor-pointer">Aktif</Label>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 border border-border/50">
              <p className="text-muted-foreground/70 text-xs mb-1.5">Preview penomoran</p>
              <code className="text-blue-300 text-xs font-mono block">CTR/2026/{form.code || 'DEPT'}/00001</code>
              <code className="text-purple-300 text-xs font-mono block mt-1">0001/SP3/{form.code || 'DEPT'}/2026-{form.suffix || 'S0'}</code>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="border-border text-foreground/80 hover:bg-muted">Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
