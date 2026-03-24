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
  roles?: string[]
  isActive: boolean
  createdAt: string
  companyName?: string
}

// Semua role yang tersedia termasuk Verificator baru
const ALL_ROLES = ['SysAdmin', 'Admin', 'Validator', 'Verificator', 'User', 'Vendor']

// Role yang tidak bisa dikombinasi dengan role lain
const EXCLUSIVE_ROLES = ['Vendor', 'SysAdmin']

const ROLE_COLORS: Record<string, string> = {
  SysAdmin:    'bg-red-500/20 text-red-400 border-red-500/30',
  Admin:       'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Validator:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Verificator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  User:        'bg-muted text-muted-foreground border-border',
  Vendor:      'bg-green-500/20 text-green-400 border-green-500/30',
}

const ROLE_DESC: Record<string, string> = {
  SysAdmin:    'Akses penuh ke semua fitur',
  Admin:       'Kelola user & konfigurasi sistem',
  Validator:   'Review & validasi submission vendor',
  Verificator: 'Verifikasi dokumen fisik di lapangan',
  User:        'Akses dasar ke sistem',
  Vendor:      'Submit dokumen dari luar perusahaan',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[role] ?? 'bg-muted text-muted-foreground border-border'}`}>
      <Shield className="w-3 h-3" /> {role}
    </span>
  )
}

function MultiRoleSelector({
  selected, onChange
}: {
  selected: string[]
  onChange: (roles: string[]) => void
}) {
  const toggle = (role: string) => {
    if (EXCLUSIVE_ROLES.includes(role)) {
      // Role eksklusif — hanya bisa satu
      onChange(selected.includes(role) ? [] : [role])
      return
    }
    // Jika ada exclusive role, hapus dulu
    const base = selected.filter(r => !EXCLUSIVE_ROLES.includes(r))
    if (base.includes(role)) {
      onChange(base.filter(r => r !== role))
    } else {
      onChange([...base, role])
    }
  }

  const hasExclusive = selected.some(r => EXCLUSIVE_ROLES.includes(r))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {ALL_ROLES.map(role => {
        const isSelected = selected.includes(role)
        const isExclusive = EXCLUSIVE_ROLES.includes(role)
        const isDisabled = !isSelected && hasExclusive && !isExclusive
        const otherExclusiveSelected = !isSelected && selected.some(r => EXCLUSIVE_ROLES.includes(r) && r !== role)

        return (
          <button
            key={role}
            type="button"
            onClick={() => !isDisabled && toggle(role)}
            disabled={isDisabled || otherExclusiveSelected}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
              isSelected
                ? `${ROLE_COLORS[role]} border-2`
                : isDisabled || otherExclusiveSelected
                ? 'bg-muted/30 border-border/30 text-muted-foreground/40 cursor-not-allowed'
                : 'bg-muted/40 border-border hover:bg-muted/70 text-foreground'
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isSelected ? 'bg-primary border-primary' : 'border-border'
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-sm bg-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{role}</span>
                {isExclusive && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Eksklusif</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{ROLE_DESC[role]}</p>
            </div>
          </button>
        )
      })}
      {selected.length === 0 && (
        <p className="text-xs text-destructive">Pilih minimal 1 role</p>
      )}
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Role terpilih: <span className="font-medium text-foreground">{selected.join(', ')}</span>
        </p>
      )}
    </div>
  )
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    roles: ['User'] as string[],
    isActive: true
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
    setForm({ fullName: '', email: '', password: '', roles: ['User'], isActive: true })
    setShowModal(true)
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({
      fullName: u.fullName,
      email: u.email,
      password: '',
      roles: u.roles && u.roles.length > 0 ? u.roles : [u.role],
      isActive: u.isActive
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.fullName || !form.email) { toast.error('Nama dan email wajib diisi'); return }
    if (!editUser && !form.password) { toast.error('Password wajib untuk user baru'); return }
    if (form.roles.length === 0) { toast.error('Pilih minimal 1 role'); return }
    setSaving(true)
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, {
          fullName: form.fullName,
          email: form.email,
          roles: form.roles,
          isActive: form.isActive,
        })
        toast.success('User berhasil diperbarui')
      } else {
        await api.post('/api/users', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          roles: form.roles,
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
      await api.put(`/api/users/${u.id}`, {
        fullName: u.fullName,
        email: u.email,
        roles: u.roles ?? [u.role],
        isActive: !u.isActive
      })
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

  const getUserRoles = (u: User): string[] =>
    u.roles && u.roles.length > 0 ? u.roles : [u.role]

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    getUserRoles(u).some(r => r.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    validators: users.filter(u => getUserRoles(u).includes('Validator')).length,
    verificators: users.filter(u => getUserRoles(u).includes('Verificator')).length,
    vendors: users.filter(u => getUserRoles(u).includes('Vendor')).length,
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Kelola pengguna dan hak akses sistem</p>
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total User', value: stats.total, color: 'text-foreground' },
            { label: 'Aktif', value: stats.active, color: 'text-green-400' },
            { label: 'Validator', value: stats.validators, color: 'text-purple-400' },
            { label: 'Verificator', value: stats.verificators, color: 'text-blue-400' },
            { label: 'Vendor', value: stats.vendors, color: 'text-emerald-400' },
          ].map(s => (
            <Card key={s.label} className="bg-card/80 border-border">
              <CardContent className="pt-5">
                <p className="text-muted-foreground text-xs">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
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
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground ml-3">Memuat data...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground/60 uppercase tracking-wider">
                  <div className="col-span-4">Pengguna</div>
                  <div className="col-span-3">Roles</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Bergabung</div>
                  <div className="col-span-2 text-right">Aksi</div>
                </div>
                {filtered.map(u => {
                  const userRoles = getUserRoles(u)
                  return (
                    <div key={u.id} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {u.fullName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-sm font-medium truncate">{u.fullName}</p>
                            <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map(role => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-400' : 'text-muted-foreground/70'}`}>
                          {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="col-span-1 text-muted-foreground text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded transition-colors ${u.isActive ? 'hover:bg-red-900/30 text-muted-foreground hover:text-red-400' : 'hover:bg-green-900/30 text-muted-foreground hover:text-green-400'}`}
                          title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="p-1.5 rounded hover:bg-red-900/30 text-muted-foreground hover:text-red-400 transition-colors" title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Tidak ada user yang cocok
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Create/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
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

            {/* Multi-role selector */}
            <div className="space-y-2">
              <Label className="text-foreground/80">Roles * <span className="text-xs text-muted-foreground font-normal">(bisa pilih lebih dari satu untuk internal)</span></Label>
              <MultiRoleSelector
                selected={form.roles}
                onChange={roles => setForm(f => ({...f, roles}))}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(f => ({...f, isActive: e.target.checked}))}
                className="w-4 h-4 accent-primary" />
              <Label htmlFor="isActive" className="text-foreground/80 cursor-pointer">User Aktif</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving || form.roles.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
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
