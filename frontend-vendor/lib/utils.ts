import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date?: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function formatDateTime(date?: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getStatusColor(status: number | string) {
  const s = String(status).toLowerCase()
  if (['accepted', '3'].includes(s)) return 'text-green-600 bg-green-50 border-green-200'
  if (['rejected', '4'].includes(s)) return 'text-red-600 bg-red-50 border-red-200'
  if (['pending', '0'].includes(s)) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (['underreview', '1', 'analysing', '2'].includes(s)) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (['returnedforrevision', '5'].includes(s)) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}
