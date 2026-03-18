'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, Loader2, UserCheck, UserX, Shield } from 'lucide-react'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  companyName?: string
}

const ROLES = ['SysAdmin', 'Admin', 'Validator', 'User', 'Vendor']

const ROLE_COLORS: Record<string, string> = {
  SysAdmin:  'bg-red-500/20 text-red-400 border-red-500/30',
  Admin:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Validator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  User:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Vendor:    'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'User', isActive: true
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/users?pageSize=100')
      setUsers(data.users ?? data.items ?? data ?? [])
    } catch { toast.error('Gagal memuat users') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditUser(null)
    setForm({ fullName: '', email: '', password: '', role: 'User', isActive: true })
    setShowModal(true)
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role, isActive: u.isActive })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.fullName || !form.email) { toast.error('Nama dan email wajib diisi'); return }
    if (!editUser && !form.password) { toast.error('Password wajib untuk user baru'); return }
    setSaving(true)
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {})
        })
        toast.success('User berhasil diperbarui')
      } else {
        await api.post('/api/users', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive
        })
        toast.success('User berhasil dibuat')
      }
      setShowModal(false)
      await fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyimpan')
    } finally { setSaving(false) }
  }

  const handleToggleActive = async (u: User) => {
    try {
      await api.put(`/api/users/${u.id}`, { ...u, isActive: !u.isActive })
      toast.success(`User ${u.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      await fetchUsers()
    } catch { toast.error('Gagal mengubah status') }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Hapus user ${u.fullName}?`)) return
    try {
      await api.delete(`/api/users/${u.id}`)
      toast.success('User dihapus')
      await fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menghapus')
    }
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }))
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola pengguna dan hak akses sistem</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Total User</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Aktif</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Validator</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">
                {stats.byRole.find(r => r.role === 'Validator')?.count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">Vendor</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {stats.byRole.find(r => r.role === 'Vendor')?.count ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Table */}
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-foreground text-base flex-1">Daftar Pengguna</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama, email, role..."
                  className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground/70 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-muted-foreground ml-3">Memuat data...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground/70 uppercase tracking-wider">
                  <div className="col-span-4">Pengguna</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Bergabung</div>
                  <div className="col-span-2 text-right">Aksi</div>
                </div>
                {filtered.map(u => (
                  <div key={u.id} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                          {u.fullName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground text-sm font-medium truncate">{u.fullName}</p>
                          <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] ?? 'bg-slate-500/20 text-muted-foreground'}`}>
                        <Shield className="w-3 h-3" /> {u.role}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-400' : 'text-muted-foreground/70'}`}>
                        {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(u)}
                        className={`p-1.5 rounded transition-colors ${u.isActive ? 'hover:bg-red-900/30 text-muted-foreground hover:text-red-400' : 'hover:bg-green-900/30 text-muted-foreground hover:text-green-400'}`}>
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleDelete(u)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Tidak ada user yang cocok dengan pencarian
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Create/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-foreground/80">Nama Lengkap *</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
                placeholder="Nama lengkap" className="bg-muted border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="email@perusahaan.com" className="bg-muted border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">{editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
                placeholder="••••••••" className="bg-muted border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Role *</Label>
              <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                className="w-4 h-4 accent-blue-500" />
              <Label htmlFor="isActive" className="text-foreground/80 cursor-pointer">User Aktif</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-foreground gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}
                className="border-border text-foreground/80 hover:bg-muted">Batal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
