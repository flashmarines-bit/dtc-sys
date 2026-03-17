]633;E;cat /workspaces/dtc-sys/frontend/src/app/vendor/submissions/\\[id\\]/page.tsx;f1fa805f-6eed-4cfe-91c6-e4a76eba3658]633;C'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle,
         RotateCcw, Clock, FileText, AlertTriangle } from 'lucide-react'

const STATUS_STEPS = [
  { key: 'Pending',             label: 'Menunggu Upload',  desc: 'File PDF belum diupload' },
  { key: 'Analysing',           label: 'Dianalisis',       desc: 'OCR & AI sedang memproses' },
  { key: 'UnderReview',         label: 'Direview',         desc: 'Validator sedang mereview' },
  { key: 'Accepted',            label: 'Disetujui',        desc: 'Dokumen diterima' },
]

export default function VendorSubmissionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<VendorSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSub()
    // Auto-refresh jika masih analysing
    const interval = setInterval(() => {
      if (sub?.statusLabel === 'Analysing') fetchSub()
    }, 10000)
    return () => clearInterval(interval)
  }, [id])

  const fetchSub = async () => {
    try {
      const { data } = await api.get<VendorSubmission>(`/api/vendor/submissions/${id}`)
      setSub(data)
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Hanya file PDF yang diterima')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post(`/api/vendor/submissions/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('File berhasil diupload! Analisis dimulai...')
      await fetchSub()
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Upload gagal')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleResubmit = async () => {
    try {
      const { data } = await api.post(`/api/vendor/submissions/${id}/resubmit`, {
        notes: 'Resubmission dari vendor'
      })
      toast.success('Resubmission berhasil! Silakan upload file baru.')
      router.push(`/vendor/submissions/${data.newSubmissionId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Gagal resubmit')
    }
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

  const canUpload = sub.statusLabel === 'Pending'
  const canResubmit = sub.statusLabel === 'Rejected' || sub.statusLabel === 'ReturnedForRevision'
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === sub.statusLabel)
  const isTerminal = ['Accepted', 'Rejected', 'ReturnedForRevision'].includes(sub.statusLabel)

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">{sub.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{sub.submissionNumber} · {new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            sub.statusLabel === 'Accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            sub.statusLabel === 'Rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            sub.statusLabel === 'ReturnedForRevision' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            sub.statusLabel === 'UnderReview' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
            sub.statusLabel === 'Analysing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>{sub.statusLabel}</span>
        </div>

        {/* Progress stepper */}
        {!isTerminal && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, idx) => (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx < currentStepIdx ? 'bg-green-600 text-white' :
                        idx === currentStepIdx ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800' :
                        'bg-slate-700 text-slate-500'
                      }`}>
                        {idx < currentStepIdx ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <p className={`text-xs mt-2 text-center max-w-16 ${idx === currentStepIdx ? 'text-blue-400' : idx < currentStepIdx ? 'text-green-400' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-6 ${idx < currentStepIdx ? 'bg-green-600' : 'bg-slate-700'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status cards untuk terminal states */}
        {sub.statusLabel === 'Accepted' && (
          <Card className="bg-green-900/20 border-green-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">Pengajuan Disetujui!</p>
                  {sub.resultDocumentNumber && (
                    <p className="text-green-300/70 text-sm mt-1">
                      Nomor Dokumen: <span className="font-bold text-green-300">{sub.resultDocumentNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'Rejected' && (
          <Card className="bg-red-900/20 border-red-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Pengajuan Ditolak</p>
                  {sub.rejectionReason && (
                    <p className="text-red-300/70 text-sm mt-1">{sub.rejectionReason}</p>
                  )}
                  {sub.resubmissionCount < sub.maxResubmissions && (
                    <Button onClick={handleResubmit} size="sm"
                      className="mt-3 bg-red-700 hover:bg-red-600 text-white gap-2">
                      <RotateCcw className="w-3 h-3" /> Ajukan Ulang ({sub.maxResubmissions - sub.resubmissionCount}x tersisa)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sub.statusLabel === 'ReturnedForRevision' && (
          <Card className="bg-orange-900/20 border-orange-700/50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-400 font-medium">Perlu Revisi</p>
                  {(sub as any).returnNotes && (
                    <p className="text-orange-300/70 text-sm mt-1">{(sub as any).returnNotes}</p>
                  )}
                  <Button onClick={handleResubmit} size="sm"
                    className="mt-3 bg-orange-700 hover:bg-orange-600 text-white gap-2">
                    <RotateCcw className="w-3 h-3" /> Ajukan Ulang dengan Revisi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Upload section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" /> File Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canUpload ? (
                <div>
                  <p className="text-slate-400 text-xs mb-3">Upload file PDF (maks. 100MB, min. 300 DPI)</p>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload}
                    className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload">
                    <div className={`border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <><Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
                        <p className="text-slate-400 text-sm">Mengupload...</p></>
                      ) : (
                        <><Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Klik untuk pilih PDF</p>
                        <p className="text-slate-500 text-xs mt-1">atau drag & drop</p></>
                      )}
                    </div>
                  </label>
                </div>
              ) : sub.fileName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm truncate max-w-40">{sub.fileName}</p>
                    <p className="text-slate-400 text-xs">{sub.pageCount > 0 ? `${sub.pageCount} halaman` : 'Sedang diproses'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Belum ada file</p>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Detail Pengajuan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'Perusahaan', value: sub.vendorCompanyName },
                { label: 'Ref', value: sub.referenceNumber || '-' },
                { label: 'Nilai', value: sub.documentValue ? `Rp ${sub.documentValue.toLocaleString('id-ID')}` : '-' },
                { label: 'Kadaluarsa', value: new Date(sub.expiresAt).toLocaleDateString('id-ID') },
                { label: 'Resubmisi', value: `${sub.resubmissionCount}/${sub.maxResubmissions}x` },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white text-xs">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Analysing indicator */}
        {sub.statusLabel === 'Analysing' && (
          <Card className="bg-blue-900/20 border-blue-700/50 mt-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">Analisis sedang berjalan...</p>
                  <p className="text-blue-300/70 text-xs mt-0.5">OCR & AI sedang memproses dokumen Anda. Halaman ini akan otomatis refresh.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { api } from '@/lib/api'
import { VendorSubmission } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ClipboardList, Loader2, Star, AlertCircle, CheckCircle } from 'lucide-react'

function AiScoreBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-slate-500 text-xs">-</span>
  const color = score >= 8 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-sm font-bold ${color}`}>{score}/10</span>
}

export default function ValidatorQueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendorSubmission[]>('/api/validator/queue')
      .then(({ data }) => setQueue(data))
      .catch(() => toast.error('Gagal memuat antrian'))
      .finally(() => setLoading(false))
  }, [])

  const readyToReview = queue.filter(s => s.statusLabel === 'UnderReview' && s.analysisCompleted)
  const analyzing = queue.filter(s => ['Pending', 'Analysing'].includes(s.statusLabel))

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Antrian Review</h1>
          <p className="text-slate-400 text-sm mt-1">
            {readyToReview.length} pengajuan siap direview
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Siap Review</p>
                  <p className="text-2xl font-bold text-white">{readyToReview.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Sedang Dianalisis</p>
                  <p className="text-2xl font-bold text-white">{analyzing.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Antrian</p>
                  <p className="text-2xl font-bold text-white">{queue.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue list */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base">Daftar Antrian</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-slate-400 ml-3">Memuat antrian...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-slate-400">Antrian kosong</p>
                <p className="text-slate-500 text-sm mt-1">Semua pengajuan telah diproses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(sub => (
                  <div key={sub.id}
                    onClick={() => router.push(`/validator/review/${sub.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 cursor-pointer transition-colors border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${sub.analysisCompleted ? 'bg-purple-500' : 'bg-blue-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{sub.title}</p>
                          {!sub.analysisCompleted && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Analisis...</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {sub.submissionNumber} · {sub.vendorCompanyName} · {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                        </p>
                        {sub.detectedDocumentType && (
                          <p className="text-slate-400 text-xs mt-1">
                            Tipe: <span className="text-blue-400">{sub.detectedDocumentType}</span>
                            {sub.detectedSignatoryName && ` · Penandatangan: ${sub.detectedSignatoryName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400 mb-1">AI Score</p>
                        <AiScoreBadge score={sub.aiScore} />
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400 mb-1">DPI</p>
                        <span className={`text-xs font-medium ${sub.dpiPass ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.detectedDpi ? `${sub.detectedDpi} DPI` : '-'}
                        </span>
                      </div>
                    </div>
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
namespace Dtc.Infrastructure.Services;

using Microsoft.EntityFrameworkCore;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Entities;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Persistence;

public class ValidatorService : IValidatorService
{
    private readonly DtcDbContext _db;
    private readonly IStorageService _storage;
    private readonly IEmailService _email;
    private readonly ILibraryService _library;

    public ValidatorService(DtcDbContext db, IStorageService storage,
        IEmailService email, ILibraryService library)
    {
        _db = db;
        _storage = storage;
        _email = email;
        _library = library;
    }

    public async Task<List<VendorSubmissionDto>> GetQueueAsync()
    {
        return await GetWithIncludes()
            .Where(s => s.Status == VendorSubmissionStatus.UnderReview)
            .OrderBy(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<VendorSubmissionDto?> GetDetailAsync(Guid id)
    {
        var s = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id);
        return s is null ? null : MapToDto(s);
    }

    public async Task<VendorSubmissionDto> ApproveAsync(Guid id, Guid validatorUserId, string? notes)
    {
        var submission = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ArgumentException("Submission not found.");

        if (submission.Status != VendorSubmissionStatus.UnderReview)
            throw new InvalidOperationException("Submission is not under review.");

        // Find signatory config
        var signatoryConfig = submission.SignatoryConfigId.HasValue
            ? await _db.SignatoryConfigs
                .Include(sc => sc.DocumentType)
                .Include(sc => sc.OrganizationFunction)
                .FirstOrDefaultAsync(sc => sc.Id == submission.SignatoryConfigId)
            : null;

        // Generate document number
        var docNumber = await GenerateDocumentNumberAsync(submission, signatoryConfig);

        // Move PDF from temporary to permanent storage
        var permanentPath = $"permanent/{DateTime.UtcNow:yyyy/MM}/{docNumber.Replace("/", "_")}/original.pdf";
        var searchablePath = $"permanent/{DateTime.UtcNow:yyyy/MM}/{docNumber.Replace("/", "_")}/searchable.pdf";

        if (!string.IsNullOrEmpty(submission.OriginalStoragePath))
        {
            var originalStream = await _storage.DownloadAsync(submission.OriginalStoragePath);
            await _storage.UploadAsync(permanentPath, originalStream, "application/pdf");
        }

        if (!string.IsNullOrEmpty(submission.SearchablePdfPath))
        {
            var searchableStream = await _storage.DownloadAsync(submission.SearchablePdfPath);
            await _storage.UploadAsync(searchablePath, searchableStream, "application/pdf");
        }

        // Create library document
        var docType = await _db.DocumentTypes.FindAsync(submission.DocumentTypeId)!;
        var orgFuncId = signatoryConfig?.OrganizationFunctionId;

        var libDoc = new Document
        {
            Id = Guid.NewGuid(),
            DocumentNumber = docNumber,
            Title = submission.Title,
            Description = submission.Description,
            Status = DocumentStatus.Approved,
            StoragePath = searchablePath,
            OriginalFileName = submission.FileName,
            MimeType = "application/pdf",
            FileSizeBytes = submission.FileSizeBytes,
            StorageStage = StorageStage.Archive,
            IsLibraryDocument = true,
            LibraryStatus = LibraryStatus.Approved,
            LibraryApprovedAt = DateTime.UtcNow,
            LibraryReviewedByUserId = validatorUserId,
            DocumentTypeId = submission.DocumentTypeId,
            OrganizationFunctionId = orgFuncId,
            CreatedByUserId = submission.VendorUserId,
            Tags = submission.DetectedDocumentType,
            CreatedAt = DateTime.UtcNow
        };

        _db.Documents.Add(libDoc);

        // Update submission
        submission.Status = VendorSubmissionStatus.Accepted;
        submission.ValidatorUserId = validatorUserId;
        submission.ValidatorNotes = notes;
        submission.ValidatedAt = DateTime.UtcNow;
        submission.ResultDocumentId = libDoc.Id;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Send email notification
        await _email.SendVendorApprovedAsync(
            submission.VendorContactEmail,
            submission.VendorContactName,
            docNumber,
            searchablePath
        );

        return MapToDto(submission);
    }

    public async Task<VendorSubmissionDto> RejectAsync(Guid id, Guid validatorUserId, RejectSubmissionRequest request)
    {
        var submission = await GetWithIncludes().FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ArgumentException("Submission not found.");

        if (submission.Status != VendorSubmissionStatus.UnderReview)
            throw new InvalidOperationException("Submission is not under review.");

        var category = Enum.TryParse<RejectionCategory>(request.RejectionCategory, out var cat)
            ? cat : RejectionCategory.Lainnya;

        submission.Status = VendorSubmissionStatus.Rejected;
        submission.ValidatorUserId = validatorUserId;
        submission.RejectionCategory = category;
        submission.RejectionReason = request.RejectionReason;
        submission.ValidatorNotes = request.ValidatorNotes;
        submission.ValidatedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _email.SendVendorRejectedAsync(
            submission.VendorContactEmail,
            submission.VendorContactName,
            request.RejectionReason,
            category.ToString()
        );

        return MapToDto(submission);
    }

    private async Task<string> GenerateDocumentNumberAsync(
        PendingVendorRequest submission, SignatoryConfig? config)
    {
        if (config is null)
        {
            var year = DateTime.UtcNow.Year;
            var count = await _db.PendingVendorRequests
                .CountAsync(s => s.Status == VendorSubmissionStatus.Accepted && s.CreatedAt.Year == year);
            return $"DOC-{year}-{(count + 1):D5}";
        }

        var docType = config.DocumentType;
        var orgFunc = config.OrganizationFunction;
        var now = DateTime.UtcNow;
        string[] roman = ["","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];

        // Get next sequence for this signatory
        var seqRecord = await _db.NumberingRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.DocumentTypeId == config.DocumentTypeId &&
                r.OrganizationFunctionId == config.OrganizationFunctionId &&
                r.Year == now.Year);

        if (seqRecord is null)
        {
            seqRecord = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = config.DocumentTypeId,
                OrganizationFunctionId = config.OrganizationFunctionId,
                ScopeKey = $"{docType.Code}_{now.Year}_{orgFunc.Code}",
                Year = now.Year,
                LastSequence = 0,
                CreatedAt = now
            };
            _db.NumberingRecords.Add(seqRecord);
        }

        seqRecord.LastSequence++;
        seqRecord.UpdatedAt = now;

        var seq = seqRecord.LastSequence.ToString().PadLeft(config.SequencePadding, '0');

        return config.NumberingFormat
            .Replace("{SEQ}", seq)
            .Replace("{TYPE}", docType.Code)
            .Replace("{FUNGSI}", orgFunc.Code)
            .Replace("{SUFFIX}", orgFunc.Suffix ?? "")
            .Replace("{YEAR}", now.Year.ToString())
            .Replace("{YY}", (now.Year % 100).ToString("D2"))
            .Replace("{MONTH}", now.Month.ToString("D2"))
            .Replace("{MONTH_ROMAN}", roman[now.Month])
            .Replace("{DAY}", now.Day.ToString("D2"));
    }

    private IQueryable<PendingVendorRequest> GetWithIncludes() =>
        _db.PendingVendorRequests
            .Include(s => s.VendorUser)
            .Include(s => s.DocumentType)
            .Include(s => s.ValidatorUser)
            .Include(s => s.SignatoryConfig)
                .ThenInclude(sc => sc!.DocumentType)
            .Include(s => s.SignatoryConfig)
                .ThenInclude(sc => sc!.OrganizationFunction)
            .Include(s => s.ResultDocument);

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
        null, null,
        s.ResultDocumentId, s.ResultDocument?.DocumentNumber,
        s.VendorUserId, s.VendorUser.FullName,
        s.ExpiresAt, s.CreatedAt, s.UpdatedAt,
        s.ResubmissionCount, s.MaxResubmissions, s.ParentSubmissionId,
            s.ContractNumber, s.DynamicData, s.RelatedLibraryDocumentId
    );

    public async Task<VendorSubmissionDto> ReturnForRevisionAsync(
        Guid id, Guid validatorUserId, string returnNotes)
    {
        var submission = await GetWithIncludes()
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new ArgumentException("Submission not found.");

        if (submission.Status != VendorSubmissionStatus.UnderReview)
            throw new InvalidOperationException("Hanya submission UnderReview yang bisa dikembalikan.");

        submission.Status = VendorSubmissionStatus.ReturnedForRevision;
        submission.ReturnNotes = returnNotes;
        submission.ReturnedAt = DateTime.UtcNow;
        submission.ValidatorUserId = validatorUserId;
        submission.ValidatedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _email.SendVendorReturnedAsync(
            submission.VendorContactEmail,
            submission.VendorContactName,
            submission.SubmissionNumber,
            returnNotes
        );

        return MapToDto(submission);
    }

}