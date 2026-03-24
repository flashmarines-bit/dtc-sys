'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: number
  priority: number
  entityType?: string
  entityId?: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
}

const PRIORITY_COLORS: Record<number, string> = {
  0: 'border-l-slate-500',
  1: 'border-l-blue-500',
  2: 'border-l-orange-500',
  3: 'border-l-red-500',
}

const PRIORITY_LABELS: Record<number, string> = {
  0: 'Low', 1: 'Normal', 2: 'High', 3: 'Critical'
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications?pageSize=50')
      setNotifications(Array.isArray(data) ? data : [])
    } catch { toast.error('Gagal memuat notifikasi') }
    finally { setLoading(false) }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('Semua notifikasi ditandai sudah dibaca')
    } catch { toast.error('Gagal menandai') }
  }

  const markRead = async (id: string) => {
    try {
      await api.post(`/api/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) await markRead(notif.id)
    if (notif.actionUrl) router.push(notif.actionUrl)
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-6 h-6 text-blue-400" />
              Notifikasi
              {unread > 0 && (
                <span className="bg-red-500 text-foreground text-sm font-bold px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
          {unread > 0 && (
            <Button onClick={markAllRead} variant="outline" size="sm"
              className="border-border text-foreground/80 hover:bg-muted gap-2">
              <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
            </Button>
          )}
        </div>

        <Card className="bg-card/80 border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-muted-foreground ml-3">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-4 p-4 border-l-4 cursor-pointer
                      transition-colors hover:bg-muted/30
                      ${PRIORITY_COLORS[notif.priority] ?? 'border-l-slate-600'}
                      ${!notif.isRead ? 'bg-muted/20' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-foreground/80'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        )}
                        {notif.priority >= 2 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            notif.priority === 3
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {PRIORITY_LABELS[notif.priority]}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-muted-foreground/70 text-xs mt-1">
                        {new Date(notif.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {notif.actionUrl && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
