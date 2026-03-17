]633;E;cat /workspaces/dtc-sys/frontend/src/app/vendor/submissions/new/page.tsx;f1fa805f-6eed-4cfe-91c6-e4a76eba3658]633;C'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { DocumentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'

export default function NewSubmissionPage() {
  const router = useRouter()
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    documentTypeId: '',
    vendorCompanyName: '',
    vendorContactName: '',
    vendorContactEmail: '',
    vendorContactPhone: '',
    referenceNumber: '',
    documentDate: '',
    documentValue: '',
    notes: '',
  })

  useEffect(() => {
    api.get('/api/document-types').then(({ data }) => {
      const types = data.documentTypes ?? data
      setDocTypes(Array.isArray(types) ? types : [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentTypeId) { toast.error('Pilih jenis dokumen'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/api/vendor/submissions', {
        ...form,
        documentValue: form.documentValue ? parseFloat(form.documentValue) : null,
        documentDate: form.documentDate ? new Date(form.documentDate).toISOString() : null,
      })
      toast.success(`Pengajuan ${data.submissionNumber} berhasil dibuat!`)
      router.push(`/vendor/submissions/${data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal membuat pengajuan')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">Pengajuan Baru</h1>
        <p className="text-slate-400 text-sm mb-8">Isi informasi dokumen yang akan diajukan</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Dokumen */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white text-base">Informasi Dokumen</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Judul Dokumen *</Label>
                <Input value={form.title} onChange={set('title')} required
                  placeholder="Contoh: Invoice Jasa Konsultasi Q1 2026"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Jenis Dokumen *</Label>
                <select value={form.documentTypeId} onChange={set('documentTypeId')} required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih jenis dokumen --</option>
                  {docTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nomor Referensi</Label>
                  <Input value={form.referenceNumber} onChange={set('referenceNumber')}
                    placeholder="INV-2026-001"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tanggal Dokumen</Label>
                  <Input type="date" value={form.documentDate} onChange={set('documentDate')}
                    className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Nilai Dokumen (Rp)</Label>
                <Input type="number" value={form.documentValue} onChange={set('documentValue')}
                  placeholder="50000000"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
            </CardContent>
          </Card>

          {/* Informasi Vendor */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Informasi Vendor</CardTitle>
              <CardDescription className="text-slate-400">Data perusahaan yang mengajukan dokumen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nama Perusahaan *</Label>
                <Input value={form.vendorCompanyName} onChange={set('vendorCompanyName')} required
                  placeholder="PT Maju Jaya"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nama Kontak *</Label>
                  <Input value={form.vendorContactName} onChange={set('vendorContactName')} required
                    placeholder="Budi Santoso"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">No. Telepon *</Label>
                  <Input value={form.vendorContactPhone} onChange={set('vendorContactPhone')} required
                    placeholder="08123456789"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email Kontak *</Label>
                <Input type="email" value={form.vendorContactEmail} onChange={set('vendorContactEmail')} required
                  placeholder="budi@majujaya.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Catatan</Label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  placeholder="Informasi tambahan..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Upload className="w-4 h-4" /> Buat Pengajuan</>}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}
              className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText,
         Loader2, Star, Shield, AlertTriangle, ExternalLink } from 'lucide-react'

export default function ValidatorReviewPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCategory, setRejectCategory] = useState('KualitasScanTidakMemadai')
  const [returnNotes, setReturnNotes] = useState('')

  useEffect(() => {
    api.get<VendorSubmission>(`/api/validator/review/${id}`)
      .then(({ data }) => setSub(data))
      .catch(() => toast.error('Gagal memuat data submission'))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/approve`)
      toast.success('Pengajuan disetujui! Dokumen berhasil dibuat.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menyetujui')
    } finally { setActing(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Isi alasan penolakan'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/reject`, {
        rejectionCategory: rejectCategory,
        rejectionReason: rejectReason,
        validatorNotes: null
      })
      toast.success('Pengajuan ditolak. Email notifikasi terkirim ke vendor.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal menolak')
    } finally { setActing(false) }
  }

  const handleReturn = async () => {
    if (!returnNotes.trim()) { toast.error('Isi catatan revisi'); return }
    setActing(true)
    try {
      await api.post(`/api/validator/review/${id}/return-for-revision`, { returnNotes })
      toast.success('Pengajuan dikembalikan untuk revisi.')
      router.push('/validator/queue')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal mengembalikan')
    } finally { setActing(false) }
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="text-slate-400 ml-3">Memuat data...</span>
      </div>
    </AppShell>
  )

  if (!sub) return (
    <AppShell>
      <div className="p-8 text-slate-400">Submission tidak ditemukan.</div>
    </AppShell>
  )

  const extractedFields = sub.extractedFieldsJson
    ? (() => { try { return JSON.parse(sub.extractedFieldsJson!) } catch { return null } })()
    : null

  const canAct = sub.statusLabel === 'UnderReview'

  return (
    <AppShell>
      <div className="p-8 max-w-4xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Antrian
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{sub.title}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" /> Hasil Analisis AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!sub.analysisCompleted ? (
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analisis sedang berjalan...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">AI Score</p>
                        <p className={`text-2xl font-bold ${
                          (sub.aiScore ?? 0) >= 8 ? 'text-green-400' :
                          (sub.aiScore ?? 0) >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{sub.aiScore ?? '-'}<span className="text-sm text-slate-400">/10</span></p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">Grade</p>
                        <p className="text-lg font-bold text-blue-400">{sub.aiGradeLabel ?? '-'}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <p className="text-slate-400 text-xs mb-1">DPI</p>
                        <p className={`text-lg font-bold ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ?? '-'}
                          {sub.detectedDpi && <span className="text-xs text-slate-400 ml-1">dpi</span>}
                        </p>
                      </div>
                    </div>
                    {sub.aiSummary && (
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">Ringkasan AI</p>
                        <p className="text-slate-300 text-sm">{sub.aiSummary}</p>
                      </div>
                    )}
                    {sub.detectedDocumentType && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Tipe Terdeteksi:</span>
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                          {sub.detectedDocumentType}
                        </span>
                      </div>
                    )}
                    {sub.detectedSignatoryName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Penandatangan:</span>
                        <span className="text-white">{sub.detectedSignatoryName}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {extractedFields && Object.keys(extractedFields).length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Field Terekstrak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(extractedFields).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
                        <span className="text-slate-400 text-sm min-w-32">{k}</span>
                        <span className="text-white text-sm">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showRejectForm && (
              <Card className="bg-red-900/10 border-red-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-400 text-base">Tolak Pengajuan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Kategori</label>
                    <select value={rejectCategory} onChange={e => setRejectCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm">
                      <option value="KualitasScanTidakMemadai">Kualitas Scan Tidak Memadai</option>
                      <option value="DokumenTidakLengkap">Dokumen Tidak Lengkap</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Alasan *</label>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      rows={3} placeholder="Jelaskan alasan penolakan..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReject} disabled={acting}
                      className="bg-red-600 hover:bg-red-700 text-white gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Konfirmasi Tolak
                    </Button>
                    <Button variant="outline" onClick={() => setShowRejectForm(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canAct && showReturnForm && (
              <Card className="bg-orange-900/10 border-orange-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-orange-400 text-base">Kembalikan untuk Revisi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-slate-300 text-sm block mb-1">Catatan Revisi *</label>
                    <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)}
                      rows={3} placeholder="Jelaskan apa yang perlu diperbaiki..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleReturn} disabled={acting}
                      className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                      {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Konfirmasi Kembalikan
                    </Button>
                    <Button variant="outline" onClick={() => setShowReturnForm(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700">Batal</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {canAct && !showRejectForm && !showReturnForm && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={handleApprove} disabled={acting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Setujui
                  </Button>
                  <Button onClick={() => { setShowReturnForm(true); setShowRejectForm(false) }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <RotateCcw className="w-4 h-4" /> Kembalikan untuk Revisi
                  </Button>
                  <Button onClick={() => { setShowRejectForm(true); setShowReturnForm(false) }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Info Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Perusahaan', value: sub.vendorCompanyName },
                  { label: 'Kontak', value: sub.vendorContactName },
                  { label: 'Email', value: sub.vendorContactEmail },
                  { label: 'File', value: sub.fileName || '-' },
                  { label: 'Halaman', value: sub.pageCount ? `${sub.pageCount} hal` : '-' },
                  { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between gap-2">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white text-right text-xs truncate max-w-32">{item.value}</span>
                  </div>
                ))}
                {sub.originalPdfUrl && (
                  <a href={sub.originalPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs mt-2">
                    <ExternalLink className="w-3 h-3" /> Lihat PDF Asli
                  </a>
                )}
              </CardContent>
            </Card>

            {!sub.dpiPass && sub.detectedDpi && (
              <Card className="bg-red-900/20 border-red-700/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">DPI Terlalu Rendah</p>
                      <p className="text-red-300/70 text-xs mt-1">{sub.detectedDpi} DPI (min. 300)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Dienkripsi & terverifikasi</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;

[ApiController]
[Route("api/tracking")]
[Authorize]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _tracking;

    public TrackingController(ITrackingService tracking)
    {
        _tracking = tracking;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(claim!);
    }

    /// <summary>Scan QR Code — returns document info + available actions</summary>
    [HttpGet("scan/{qrCode}")]
    public async Task<IActionResult> Scan(string qrCode)
    {
        var result = await _tracking.ScanQrAsync(qrCode, GetUserId());
        if (result is null) return NotFound(new { error = "QR Code not found." });
        return Ok(result);
    }

    /// <summary>Get document tracking history</summary>
    [HttpGet("{documentId:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid documentId)
    {
        var result = await _tracking.GetHistoryAsync(documentId);
        return Ok(result);
    }

    /// <summary>Submit document (Draft → Submitted)</summary>
    [HttpPost("{documentId:guid}/submit")]
    public async Task<IActionResult> Submit(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.SubmitAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Receive document — Front Desk (Submitted → Received)</summary>
    [HttpPost("{documentId:guid}/receive")]
    public async Task<IActionResult> Receive(Guid documentId, [FromBody] ReceiveDocumentRequest request)
    {
        try { return Ok(await _tracking.ReceiveAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Assign document to verifier (Received → Assigned)</summary>
    [HttpPost("{documentId:guid}/assign")]
    public async Task<IActionResult> Assign(Guid documentId, [FromBody] AssignDocumentRequest request)
    {
        try { return Ok(await _tracking.AssignAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Start review (Assigned → UnderReview)</summary>
    [HttpPost("{documentId:guid}/start-review")]
    public async Task<IActionResult> StartReview(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.StartReviewAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Approve document (UnderReview → Approved)</summary>
    [HttpPost("{documentId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid documentId, [FromBody] string? notes = null)
    {
        try { return Ok(await _tracking.ApproveAsync(documentId, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Return document (UnderReview/Assigned → Returned)</summary>
    [HttpPost("{documentId:guid}/return")]
    public async Task<IActionResult> Return(Guid documentId, [FromBody] ReturnDocumentRequest request)
    {
        try { return Ok(await _tracking.ReturnAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Initiate handover — generates OTP</summary>
    [HttpPost("{documentId:guid}/handover/initiate")]
    public async Task<IActionResult> InitiateHandover(Guid documentId, [FromBody] InitiateHandoverRequest request)
    {
        try { return Ok(await _tracking.InitiateHandoverAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Confirm handover — validate OTP</summary>
    [HttpPost("{documentId:guid}/handover/confirm")]
    public async Task<IActionResult> ConfirmHandover(Guid documentId, [FromBody] ConfirmHandoverRequest request)
    {
        try { return Ok(await _tracking.ConfirmHandoverAsync(documentId, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Upload photo proof (recipient absent)</summary>
    [HttpPost("{documentId:guid}/handover/photo-proof")]
    public async Task<IActionResult> UploadPhotoProof(Guid documentId, IFormFile photo)
    {
        if (photo is null || photo.Length == 0)
            return BadRequest(new { error = "No photo provided." });
        try
        {
            using var stream = photo.OpenReadStream();
            return Ok(await _tracking.UploadPhotoProofAsync(documentId, GetUserId(), stream, photo.FileName, photo.ContentType));
        }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Dashboard metrics</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        return Ok(await _tracking.GetDashboardAsync());
    }

    /// <summary>List SLA overdue documents</summary>
    [HttpGet("sla-overdue")]
    public async Task<IActionResult> SlaOverdue()
    {
        return Ok(await _tracking.GetSlaOverdueAsync());
    }
}
using Dtc.Application;
namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;
using Hangfire;

public class VendorService : IVendorService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private readonly IBackgroundJobClient _jobs;

    public VendorService(DtcDbContext db, IStorageService storage, IBackgroundJobClient jobs)
    {
        _db = db;
        _storage = storage;
        _jobs = jobs;
    }

    public async Task<VendorSubmissionDto> CreateSubmissionAsync(
        CreateVendorSubmissionRequest request, Guid vendorUserId)
    {
        var docType = await _db.DocumentTypes.FindAsync(request.DocumentTypeId)
            ?? throw new ArgumentException("Document type not found.");

        var submissionNumber = await GenerateSubmissionNumberAsync();

        var submission = new PendingVendorRequest
        {
            Id = Guid.NewGuid(),
            SubmissionNumber = submissionNumber,
            Title = request.Title.Sanitize(200) ?? request.Title,
            Description = request.Description.Sanitize(1000),
            Status = VendorSubmissionStatus.Pending,
            VendorCompanyName = request.VendorCompanyName.Sanitize(200) ?? request.VendorCompanyName,
            VendorContactName = request.VendorContactName.Sanitize(100) ?? request.VendorContactName,
            VendorContactEmail = request.VendorContactEmail.Sanitize(200) ?? request.VendorContactEmail,
            VendorContactPhone = request.VendorContactPhone.Sanitize(20) ?? request.VendorContactPhone,
            ContractNumber = request.ContractNumber?.Sanitize(100),
            DynamicData = request.DynamicData,
            RelatedLibraryDocumentId = request.RelatedLibraryDocumentId,
            ReferenceNumber = request.ReferenceNumber,
            DocumentDate = request.DocumentDate,
            DocumentValue = request.DocumentValue,
            Notes = request.Notes,
            DocumentTypeId = request.DocumentTypeId,
            VendorUserId = vendorUserId,
            OriginalStoragePath = "",  // akan diupdate saat file upload
            FileName = "",
            FileSizeBytes = 0,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _db.PendingVendorRequests.Add(submission);
        await _db.SaveChangesAsync();

        return (await GetSubmissionAsync(submission.Id, vendorUserId))!;
    }

    public async Task<VendorSubmissionDto?> GetSubmissionAsync(Guid id, Guid vendorUserId)
    {
        var s = await GetWithIncludes()
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == vendorUserId);
        return s is null ? null : MapToDto(s);
    }

    public async Task<List<VendorSubmissionDto>> GetMySubmissionsAsync(Guid vendorUserId)
    {
        return await GetWithIncludes()
            .Where(s => s.VendorUserId == vendorUserId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }


    public async Task<VendorSubmissionDto> ResubmitAsync(Guid originalId, Guid vendorUserId, string? notes)
    {
        var original = await _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .FirstOrDefaultAsync(s => s.Id == originalId && s.VendorUserId == vendorUserId)
            ?? throw new ArgumentException("Submission not found.");

        if (original.Status != VendorSubmissionStatus.Rejected
            && original.Status != VendorSubmissionStatus.ReturnedForRevision)
            throw new InvalidOperationException("Hanya submission yang ditolak atau dikembalikan yang bisa di-resubmit.");

        // Cek batas resubmission — hitung dari root chain
        var rootId = original.ParentSubmissionId ?? original.Id;
        var totalResubmissions = await _db.PendingVendorRequests
            .CountAsync(s => (s.ParentSubmissionId == rootId || s.Id == rootId)
                          && s.VendorUserId == vendorUserId);

        if (totalResubmissions >= original.MaxResubmissions)
            throw new InvalidOperationException(
                $"Batas maksimal resubmission ({original.MaxResubmissions}x) telah tercapai.");

        var submissionNumber = await GenerateSubmissionNumberAsync();

        var resubmission = new Dtc.Domain.Entities.PendingVendorRequest
        {
            Id = Guid.NewGuid(),
            SubmissionNumber = submissionNumber,
            Title = original.Title,
            Description = notes ?? original.Description,
            Status = Dtc.Domain.Enums.VendorSubmissionStatus.Pending,
            VendorCompanyName = original.VendorCompanyName,
            VendorContactName = original.VendorContactName,
            VendorContactEmail = original.VendorContactEmail,
            VendorContactPhone = original.VendorContactPhone,
            ReferenceNumber = original.ReferenceNumber,
            DocumentDate = original.DocumentDate,
            DocumentValue = original.DocumentValue,
            Notes = notes ?? original.Notes,
            DocumentTypeId = original.DocumentTypeId,
            VendorUserId = vendorUserId,
            OriginalStoragePath = "",
            FileName = "",
            FileSizeBytes = 0,
            ParentSubmissionId = original.ParentSubmissionId ?? original.Id,
            ResubmissionCount = totalResubmissions,
            MaxResubmissions = original.MaxResubmissions,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        _db.PendingVendorRequests.Add(resubmission);
        await _db.SaveChangesAsync();

        return (await GetSubmissionAsync(resubmission.Id, vendorUserId))!;
    }

    public async Task<int> GetResubmissionCountAsync(Guid submissionId)
    {
        var submission = await _db.PendingVendorRequests.FindAsync(submissionId);
        if (submission is null) return 0;
        var rootId = submission.ParentSubmissionId ?? submission.Id;
        return await _db.PendingVendorRequests
            .CountAsync(s => s.ParentSubmissionId == rootId || s.Id == rootId);
    }
    private IQueryable<PendingVendorRequest> GetWithIncludes() =>
        _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .Include(s => s.ValidatorUser)
            .Include(s => s.SignatoryConfig)
            .Include(s => s.ResultDocument);

    private async Task<string> GenerateSubmissionNumberAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _db.PendingVendorRequests
            .CountAsync(s => s.CreatedAt.Year == year);
        return $"REQ-{year}-{(count + 1):D5}";
    }

    private static VendorSubmissionDto MapToDto(PendingVendorRequest s) => new(
        s.Id, s.SubmissionNumber, s.Title, s.Description,
        s.Status, s.Status.ToString(),
        s.VendorCompanyName, s.VendorContactName, s.VendorContactEmail,
        s.ReferenceNumber, s.DocumentDate, s.DocumentValue,
        s.FileName, s.FileSizeBytes, s.PageCount,
        s.DetectedDpi, s.DpiCheckResult == DpiCheckResult.Pass,
        s.DetectedDocumentType, s.ExtractedFieldsJson,
        s.DetectedSignatoryName, s.AiGrade.ToString(),
        s.AiScore, s.AiSummary, s.AnalysisCompleted,
        s.RejectionCategory?.ToString(), s.RejectionReason,
        s.ValidatorNotes, s.ValidatedAt,
        null, null,  // URLs generated on demand
        s.ResultDocumentId, s.ResultDocument?.DocumentNumber,
        s.VendorUserId, s.VendorUser.FullName,
        s.ExpiresAt, s.CreatedAt, s.UpdatedAt,
        s.ResubmissionCount, s.MaxResubmissions, s.ParentSubmissionId,
            s.ContractNumber, s.DynamicData, s.RelatedLibraryDocumentId
    );
}
