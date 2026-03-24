'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Loader2, Camera, CameraOff } from 'lucide-react'

interface QrScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
}

export default function QrScanner({ onScan, onError }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const containerId = 'qr-scanner-container'

  useEffect(() => {
    startScanner()
    return () => { stopScanner() }
  }, [])

  const startScanner = async () => {
    setStatus('starting')
    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        throw new Error('Tidak ada kamera yang tersedia')
      }

      // Prefer back camera
      const cameraId = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      )?.id ?? cameras[cameras.length - 1].id

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanner()
        },
        () => { /* scanning in progress — ignore errors */ }
      )
      setStatus('scanning')
    } catch (err: any) {
      const msg = err?.message ?? 'Gagal mengakses kamera'
      setErrorMsg(msg)
      setStatus('error')
      onError?.(msg)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Scanner viewport */}
      <div className="relative w-full max-w-sm">
        <div id={containerId}
          className="w-full rounded-2xl overflow-hidden bg-card min-h-64" />

        {/* Overlay corner brackets */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
            {/* Scan line animation */}
            <div className="absolute left-8 right-8 h-0.5 bg-blue-400 opacity-70 animate-scan-line"
              style={{ top: '50%' }} />
          </div>
        )}

        {/* Status overlay */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-foreground/80 text-sm">Mengaktifkan kamera...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
            <div className="text-center p-4">
              <CameraOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm font-medium">Kamera tidak tersedia</p>
              <p className="text-muted-foreground text-xs mt-1">{errorMsg}</p>
              <button onClick={startScanner}
                className="mt-3 bg-blue-600 text-foreground px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>

      {status === 'scanning' && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Camera className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Arahkan kamera ke QR Code dokumen</span>
        </div>
      )}
    </div>
  )
}
