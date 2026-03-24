'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 15.536a5 5 0 010-7.072M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Tidak Ada Koneksi</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Periksa koneksi internet Anda dan coba lagi.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-foreground px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
