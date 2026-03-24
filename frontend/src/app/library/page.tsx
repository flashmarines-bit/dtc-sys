'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Search, FileText, Loader2, Download,
  BookOpen, Calendar, Tag, ExternalLink, AlertTriangle
} from 'lucide-react'

interface LibraryDoc {
  id: string
  documentNumber: string
  title: string
  description?: string
  tags?: string
  category?: string
  libraryStatus: number
  libraryStatusLabel: string
  documentTypeName: string
  createdByUserName: string
  approvedAt?: string
  versionCount: number
  contentExpiresAt?: string
  contractNumber?: string
  isConfidential: boolean
  createdAt: string
}

export default function LibraryPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<LibraryDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/api/library?approvedOnly=true&pageSize=50')
      setDocs(data.documents ?? [])
    } catch { toast.error('Gagal memuat library') }
    finally { setLoading(false) }
  }

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { fetchDocs(); return }
    if (q.length < 3) return
    setSearching(true)
    try {
      const { data } = await api.get(`/api/library/search?q=${encodeURIComponent(q)}`)
      setDocs(data.documents ?? [])
    } catch { /* silent */ }
    finally { setSearching(false) }
  }

  const handleDownload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await api.get(`/api/library/${id}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `document-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Gagal download file') }
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 30
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" /> E-Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arsip dokumen digital perusahaan
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          {searching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
          )}
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Cari judul, tag, nomor kontrak, isi dokumen..."
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-muted-foreground ml-3">Memuat library...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? 'Tidak ada hasil untuk pencarian ini' : 'Library kosong'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map(doc => (
              <Card key={doc.id}
                onClick={() => router.push(`/library/${doc.id}`)}
                className="bg-card/80 border-border hover:border-slate-500 cursor-pointer transition-all hover:bg-card">
                <CardContent className="pt-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.isConfidential && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                          Rahasia
                        </span>
                      )}
                      {isExpiringSoon(doc.contentExpiresAt) && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                      <button
                        onClick={e => handleDownload(doc.id, e)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-foreground text-sm font-medium line-clamp-2 mb-1">
                    {doc.title}
                  </p>
                  <p className="text-muted-foreground/70 text-xs">{doc.documentNumber}</p>

                  {/* Tags */}
                  {doc.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.split(',').slice(0, 3).map(tag => (
                        <span key={tag.trim()}
                          className="text-xs bg-muted text-foreground/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-muted-foreground/70 text-xs">{doc.documentTypeName}</span>
                    <div className="flex items-center gap-2 text-muted-foreground/70 text-xs">
                      {doc.contentExpiresAt && (
                        <span className={`flex items-center gap-1 ${isExpiringSoon(doc.contentExpiresAt) ? 'text-yellow-400' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.contentExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span>{doc.versionCount}v</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
