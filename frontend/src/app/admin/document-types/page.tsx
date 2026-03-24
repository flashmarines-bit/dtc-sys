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
import { Plus, Pencil, Trash2, Loader2, FileText, Hash, Settings2, GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react'

interface DocType {
  id: string; name: string; code: string; description?: string
  numberingFormat: string; sequencePadding: number; isActive?: boolean; createdAt?: string
}

interface SchemaField {
  key: string; label: string; type: string; required: boolean; order: number
  placeholder?: string; helpText?: string; defaultValue?: string; options?: string[]
}

const FIELD_TYPES = [
  { value: 'text',      label: 'Text' },
  { value: 'number',    label: 'Number' },
  { value: 'currency',  label: 'Currency (Rp)' },
  { value: 'date',      label: 'Date' },
  { value: 'daterange', label: 'Date Range' },
  { value: 'textarea',  label: 'Textarea' },
  { value: 'select',    label: 'Dropdown/Select' },
  { value: 'checkbox',  label: 'Checkbox' },
  { value: 'email',     label: 'Email' },
  { value: 'phone',     label: 'Nomor Telepon' },
]

const emptyField = (): SchemaField => ({
  key: '', label: '', type: 'text', required: false,
  order: 1, placeholder: '', helpText: '', defaultValue: '', options: []
})

export default function DocumentTypesPage() {
  const [types, setTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<DocType | null>(null)
  const [saving, setSaving] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    numberingFormat: '{CODE}/{YEAR}/{SEQ:5}',
    sequencePadding: 5, isActive: true, applicableModules: 'All'
  })

  // Schema builder state
  const [showSchema, setShowSchema] = useState(false)
  const [schemaDocType, setSchemaDocType] = useState<DocType | null>(null)
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([])
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaSaving, setSchemaSaving] = useState(false)
  const [expandedField, setExpandedField] = useState<number | null>(null)

  useEffect(() => { fetchTypes() }, [])

  const fetchTypes = async () => {
    try {
      const { data } = await api.get('/api/document-types?pageSize=100')
      setTypes(data.documentTypes ?? data.items ?? (Array.isArray(data) ? data : []))
    } catch { toast.error('Gagal memuat document types') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', code: '', description: '', numberingFormat: '{CODE}/{YEAR}/{SEQ:5}', sequencePadding: 5, isActive: true })
    setShowModal(true)
  }

  const openEdit = (t: DocType) => {
    setEditItem(t)
    setForm({ name: t.name, code: t.code, description: t.description ?? '', numberingFormat: t.numberingFormat, sequencePadding: t.sequencePadding, isActive: t.isActive ?? true, applicableModules: t.applicableModules ?? 'All' })
    setShowModal(true)
  }

  const openSchema = async (t: DocType) => {
    setSchemaDocType(t)
    setSchemaLoading(true)
    setShowSchema(true)
    setExpandedField(null)
    try {
      const { data } = await api.get(`/api/document-types/${t.id}/with-schema`)
      const fields: SchemaField[] = (data.schema ?? []).sort((a: SchemaField, b: SchemaField) => a.order - b.order)
      setSchemaFields(fields)
    } catch { toast.error('Gagal memuat schema') }
    finally { setSchemaLoading(false) }
  }

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Nama dan kode wajib diisi'); return }
    setSaving(true)
    try {
      const payload = { ...form, sequencePadding: Number(form.sequencePadding), applicableModules: form.applicableModules || 'All' }
      if (editItem) { await api.put(`/api/document-types/${editItem.id}`, payload); toast.success('Document type diperbarui') }
      else { await api.post('/api/document-types', payload); toast.success('Document type dibuat') }
      setShowModal(false)
      await fetchTypes()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (t: DocType) => {
    if (!confirm(`Hapus document type "${t.name}"?`)) return
    try {
      await api.delete(`/api/document-types/${t.id}`)
      toast.success('Document type dihapus')
      await fetchTypes()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menghapus')
    }
  }

  // ── SCHEMA BUILDER ACTIONS ──
  const addField = () => {
    const newField = { ...emptyField(), order: schemaFields.length + 1 }
    setSchemaFields(prev => [...prev, newField])
    setExpandedField(schemaFields.length)
  }

  const updateField = (index: number, key: keyof SchemaField, value: unknown) => {
    setSchemaFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f))
  }

  const removeField = (index: number) => {
    setSchemaFields(prev => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 })))
    setExpandedField(null)
  }

  const moveField = (index: number, dir: 'up' | 'down') => {
    const newFields = [...schemaFields]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= newFields.length) return;
    [newFields[index], newFields[swap]] = [newFields[swap], newFields[index]]
    setSchemaFields(newFields.map((f, i) => ({ ...f, order: i + 1 })))
  }

  const autoKey = (label: string) =>
    label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  const saveSchema = async () => {
    if (!schemaDocType) return
    // Validasi
    for (const f of schemaFields) {
      if (!f.key.trim() || !f.label.trim()) { toast.error('Key dan Label wajib diisi untuk semua field'); return }
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)) { toast.error(`Key "${f.key}" tidak valid. Gunakan huruf, angka, dan underscore saja.`); return }
    }
    const keys = schemaFields.map(f => f.key)
    if (new Set(keys).size !== keys.length) { toast.error('Key harus unik!'); return }

    setSchemaSaving(true)
    try {
      await api.put(`/api/document-types/${schemaDocType.id}/schema`, {
        fields: schemaFields.map((f, i) => ({ ...f, order: i + 1 }))
      })
      toast.success(`${schemaFields.length} field schema disimpan!`)
      setShowSchema(false)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan schema')
    } finally { setSchemaSaving(false) }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Types</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola jenis dokumen, format penomoran, dan form schema</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLegend(true)} className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 transition-colors">
              📖 Panduan Format
            </button>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
              <Plus className="w-4 h-4" /> Tambah Tipe
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-muted-foreground ml-3">Memuat...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map(t => (
              <Card key={t.id} className="bg-card/80 border-border hover:border-blue-500/30 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">{t.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground/80 px-2 py-0.5 rounded mt-0.5">
                          <Hash className="w-3 h-3" />{t.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openSchema(t)} title="Form Schema Builder"
                        className="p-1.5 rounded hover:bg-purple-900/30 text-muted-foreground hover:text-purple-400 transition-colors">
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {t.description && <p className="text-muted-foreground text-xs mb-3">{t.description}</p>}
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-muted-foreground/70 text-xs mb-0.5">Format Penomoran</p>
                    <code className="text-blue-300 text-xs font-mono">{t.numberingFormat}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
            {types.length === 0 && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>Belum ada document type</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SCHEMA BUILDER DIALOG ── */}
      <Dialog open={showSchema} onOpenChange={setShowSchema}>
        <DialogContent className="bg-card border-border text-foreground !max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-400" />
              Form Schema Builder — {schemaDocType?.name}
            </DialogTitle>
          </DialogHeader>

          {schemaLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-muted-foreground text-sm">Memuat schema...</span>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <p className="text-muted-foreground text-xs">
                Tambahkan field yang akan muncul di form pengajuan vendor untuk tipe dokumen ini.
              </p>

              {/* Field list */}
              {schemaFields.length === 0 && (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <Settings2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Belum ada field. Klik "+ Tambah Field" untuk mulai.</p>
                </div>
              )}

              {schemaFields.map((f, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  {/* Field header */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 cursor-pointer"
                    onClick={() => setExpandedField(expandedField === i ? null : i)}>
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground text-sm font-medium">{f.label || <span className="text-muted-foreground italic">Field {i + 1}</span>}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({f.type})</span>
                      {f.required && <span className="ml-2 text-xs text-red-400 font-medium">*wajib</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={e => { e.stopPropagation(); moveField(i, 'up') }} disabled={i === 0}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); moveField(i, 'down') }} disabled={i === schemaFields.length - 1}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); removeField(i) }}
                        className="p-1 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {expandedField === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Field editor */}
                  {expandedField === i && (
                    <div className="p-4 space-y-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Label * <span className="text-muted-foreground font-normal">(tampil di form)</span></Label>
                          <Input value={f.label} onChange={e => {
                            updateField(i, 'label', e.target.value)
                            if (!f.key || f.key === autoKey(f.label)) updateField(i, 'key', autoKey(e.target.value))
                          }} placeholder="Nama Vendor" className="bg-muted border-border text-foreground text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Key * <span className="text-muted-foreground font-normal">(unik, camelCase)</span></Label>
                          <Input value={f.key} onChange={e => updateField(i, 'key', e.target.value)}
                            placeholder="namaVendor" className="bg-muted border-border text-foreground text-sm font-mono" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Tipe Field *</Label>
                          <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)}
                            className="w-full h-9 px-3 rounded-md border border-border bg-muted text-foreground text-sm outline-none">
                            {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Placeholder</Label>
                          <Input value={f.placeholder ?? ''} onChange={e => updateField(i, 'placeholder', e.target.value)}
                            placeholder="Contoh teks..." className="bg-muted border-border text-foreground text-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Help Text</Label>
                          <Input value={f.helpText ?? ''} onChange={e => updateField(i, 'helpText', e.target.value)}
                            placeholder="Penjelasan singkat..." className="bg-muted border-border text-foreground text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Default Value</Label>
                          <Input value={f.defaultValue ?? ''} onChange={e => updateField(i, 'defaultValue', e.target.value)}
                            placeholder="Nilai default..." className="bg-muted border-border text-foreground text-sm" />
                        </div>
                      </div>

                      {f.type === 'select' && (
                        <div className="space-y-1.5">
                          <Label className="text-foreground/80 text-xs">Opsi Dropdown <span className="text-muted-foreground font-normal">(pisahkan dengan koma)</span></Label>
                          <Input value={(f.options ?? []).join(', ')}
                            onChange={e => updateField(i, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Opsi 1, Opsi 2, Opsi 3" className="bg-muted border-border text-foreground text-sm" />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input type="checkbox" id={`req-${i}`} checked={f.required}
                          onChange={e => updateField(i, 'required', e.target.checked)}
                          className="w-4 h-4 accent-blue-500" />
                        <Label htmlFor={`req-${i}`} className="text-foreground/80 text-sm cursor-pointer">Wajib diisi</Label>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={addField}
                className="w-full py-2.5 border border-dashed border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Field
              </button>

              <div className="flex gap-3 pt-2 border-t border-border">
                <Button onClick={saveSchema} disabled={schemaSaving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2">
                  {schemaSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : `Simpan Schema (${schemaFields.length} field)`}
                </Button>
                <Button variant="outline" onClick={() => setShowSchema(false)}
                  className="border-border text-foreground/80 hover:bg-muted">Batal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── LEGEND DIALOG ── */}
      <Dialog open={showLegend} onOpenChange={setShowLegend}>
        <DialogContent className="bg-card border-border text-foreground !max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">📖 Panduan Format Penomoran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-foreground/80 font-medium w-28">Variabel</th>
                    <th className="text-left px-4 py-2.5 text-foreground/80 font-medium">Keterangan</th>
                    <th className="text-left px-4 py-2.5 text-foreground/80 font-medium w-44">Contoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ['{YEAR}','text-blue-400','Tahun 4 digit','2026'],
                    ['{CODE}','text-green-400','Kode tipe dokumen','INV, CTR'],
                    ['{DEPT}','text-yellow-400','Kode departemen','PHR, ENG'],
                    ['{SEQ:5}','text-purple-400','Nomor urut 5 digit','00001'],
                    ['{SEQ}','text-purple-400','Nomor urut tanpa padding','1, 42'],
                  ].map(([v, c, d, ex]) => (
                    <tr key={v} className="odd:bg-muted/20">
                      <td className="px-4 py-2.5"><code className={`font-mono font-bold text-sm ${c}`}>{v}</code></td>
                      <td className="px-4 py-2.5 text-foreground/80 text-xs">{d}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CREATE/EDIT DIALOG ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editItem ? 'Edit Document Type' : 'Tambah Document Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-xs">Nama *</Label>
                <Input value={form.name} onChange={set('name')} placeholder="Invoice" className="bg-muted border-border text-foreground text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-xs">Kode *</Label>
                <Input value={form.code} onChange={set('code')} placeholder="INV" className="bg-muted border-border text-foreground text-sm uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Deskripsi</Label>
              <Input value={form.description} onChange={set('description')} placeholder="Deskripsi singkat" className="bg-muted border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Format Penomoran *</Label>
              <Input value={form.numberingFormat} onChange={set('numberingFormat')} placeholder="INV/{YEAR}/{SEQ:5}" className="bg-muted border-border text-foreground text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Sequence Padding</Label>
              <Input type="number" value={form.sequencePadding} onChange={e => setForm(f => ({...f, sequencePadding: parseInt(e.target.value)}))} min={1} max={10} className="bg-muted border-border text-foreground text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="dtActive" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-blue-500" />
              <Label htmlFor="dtActive" className="text-foreground/80 text-sm cursor-pointer">Aktif</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Applicable Modules</Label>
              <div className="flex flex-wrap gap-2">
                {['All','Module1','Module2','Module3'].map(mod => (
                  <label key={mod} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox"
                      checked={form.applicableModules?.includes(mod) || form.applicableModules === 'All' && mod === 'All'}
                      onChange={e => {
                        if (mod === 'All') { setForm(f => ({...f, applicableModules: 'All'})); return }
                        const current = form.applicableModules === 'All' ? '' : (form.applicableModules || '')
                        const parts = current.split(',').filter(Boolean).filter(m => m !== 'All')
                        if (e.target.checked) { setForm(f => ({...f, applicableModules: [...parts, mod].join(',')})) }
                        else { setForm(f => ({...f, applicableModules: parts.filter(m => m !== mod).join(',') || 'All'})) }
                      }}
                      className="w-3.5 h-3.5 accent-blue-500" />
                    <span className="text-foreground/80 text-xs">{mod === 'All' ? 'Semua Modul' : mod}</span>
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground/60 text-xs">Modul mana yang menggunakan tipe dokumen ini</p>
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
