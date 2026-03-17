]633;E;cat /workspaces/dtc-sys/frontend/src/app/dashboard/page.tsx;f1fa805f-6eed-4cfe-91c6-e4a76eba3658]633;C'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, ClipboardList, Activity,
  Loader2, TrendingUp, AlertTriangle, Clock,
  CheckCircle, ArrowRight, QrCode
} from 'lucide-react'

interface AdminRadar {
  overview: {
    totalActive: number
    preArrival: number
    atFrontDesk: number
    pendingConfirmation: number
    inReview: number
    droppedPendingAck: number
    waitingPickup: number
    slaBreached: number
    escalationSent: number
  }
  escalations: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    holderName: string
    slaBreached: boolean
    escalationSent: boolean
  }>
  teamPerformance: Array<{
    userId: string
    name: string
    inReview: number
    breached: number
  }>
}

interface ValidatorRadar {
  summary: {
    incomingDocuments: number
    atFrontDesk: number
    droppedForMe: number
    myActiveReview: number
    slaWarning: number
    slaBreach: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    slaBreached: boolean
    urgency: string
  }>
}

interface VendorRadar {
  myDocuments: {
    total: number
    draft: number
    submitted: number
    inTransit: number
    inReview: number
    returnedToMe: number
    approved: number
    rejected: number
  }
  needsAction: Array<{
    id: string
    documentNumber: string
    title: string
    statusLabel: string
    action: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [radar, setRadar] = useState<AdminRadar | ValidatorRadar | VendorRadar | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [radarRes, usersRes] = await Promise.allSettled([
          api.get('/api/radar'),
          api.get('/api/users?pageSize=1'),
        ])
        if (radarRes.status === 'fulfilled') setRadar(radarRes.value.data)
        if (usersRes.status === 'fulfilled') {
          setTotalUsers(usersRes.value.data.totalCount
            ?? usersRes.value.data.total ?? 0)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const role = user?.role

  // ── ADMIN / SYSADMIN DASHBOARD ────────────────────────────
  const adminRadar = radar as AdminRadar
  const validatorRadar = radar as ValidatorRadar
  const vendorRadar = radar as VendorRadar

  return (
    <AppShell>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {user?.fullName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Role: {user?.role} · {dateStr}
          </p>
        </div>

        {/* ── ADMIN / SYSADMIN ── */}
        {(role === 'SysAdmin' || role === 'Admin') && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Dokumen Aktif', value: adminRadar?.overview?.totalActive ?? '-', icon: <FileText className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Sedang Direview', value: adminRadar?.overview?.inReview ?? '-', icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { label: 'SLA Breach', value: adminRadar?.overview?.slaBreached ?? '-', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/20' },
                { label: 'Total User', value: totalUsers || '-', icon: <Users className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Status overview */}
            {adminRadar?.overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Pre-Arrival', value: adminRadar.overview.preArrival, color: 'text-yellow-400' },
                  { label: 'Di Front Desk', value: adminRadar.overview.atFrontDesk, color: 'text-orange-400' },
                  { label: 'Menunggu Konfirmasi', value: adminRadar.overview.pendingConfirmation, color: 'text-blue-400' },
                  { label: 'Dititip Pending', value: adminRadar.overview.droppedPendingAck, color: 'text-pink-400' },
                ].map(s => (
                  <div key={s.label} className="bg-card/70 border border-border/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color} mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Escalations */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Eskalasi & SLA Breach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : adminRadar?.escalations?.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Tidak ada eskalasi</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.escalations?.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 bg-red-900/10 border border-red-700/30 rounded-lg">
                          <div>
                            <p className="text-foreground text-xs font-medium">{e.documentNumber}</p>
                            <p className="text-muted-foreground text-xs">{e.holderName ?? '-'}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            e.slaBreached ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {e.slaBreached ? 'SLA Breach' : 'Eskalasi'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team performance */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Performa Tim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : adminRadar?.teamPerformance?.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Tidak ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {adminRadar?.teamPerformance?.map(t => (
                        <div key={String(t.userId)} className="flex items-center justify-between p-2 bg-card/70 rounded-lg">
                          <p className="text-foreground text-xs">{t.name}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-blue-400">{t.inReview} review</span>
                            {t.breached > 0 && <span className="text-red-400">{t.breached} breach</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card className="bg-card border-border">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h2 className="text-foreground text-sm font-medium">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Antrian Review', href: '/validator/queue', color: 'bg-purple-600 hover:bg-purple-700' },
                    { label: 'Scan QR', href: '/mobile/scan', color: 'bg-blue-600 hover:bg-blue-700' },
                    { label: 'User Management', href: '/admin/users', color: 'bg-slate-600 hover:bg-slate-500' },
                    { label: 'Document Types', href: '/admin/document-types', color: 'bg-green-700 hover:bg-green-600' },
                  ].map(action => (
                    <button key={action.label} onClick={() => router.push(action.href)}
                      className={`${action.color} text-white text-sm text-center py-2.5 px-3 rounded-lg transition-colors`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── VALIDATOR ── */}
        {role === 'Validator' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Dokumen Menuju Saya', value: validatorRadar?.summary?.incomingDocuments ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: <Clock className="w-5 h-5" /> },
                { label: 'Sedang Saya Review', value: validatorRadar?.summary?.myActiveReview ?? 0, color: 'text-purple-400', bg: 'bg-purple-500/20', icon: <ClipboardList className="w-5 h-5" /> },
                { label: 'SLA Warning', value: validatorRadar?.summary?.slaWarning ?? 0, color: 'text-red-400', bg: 'bg-red-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
                      <span className={item.color}>{item.icon}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
                      : <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {validatorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm">Perlu Aksi Segera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {validatorRadar.needsAction.slice(0, 5).map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/documents/${d.id}/scan`)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        d.urgency === 'critical' ? 'bg-red-900/20 border border-red-700/30 hover:bg-red-900/30' :
                        d.urgency === 'warning' ? 'bg-orange-900/20 border border-orange-700/30 hover:bg-orange-900/30' :
                        'bg-card/70 border border-border/50 hover:bg-card/80'
                      }`}>
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-muted-foreground text-xs">{d.statusLabel}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/validator/queue')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                Antrian Review
              </button>
              <button onClick={() => router.push('/mobile/scan')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" /> Scan QR
              </button>
            </div>
          </>
        )}

        {/* ── VENDOR ── */}
        {role === 'Vendor' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Dokumen', value: vendorRadar?.myDocuments?.total ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Diproses', value: (vendorRadar?.myDocuments?.inReview ?? 0) + (vendorRadar?.myDocuments?.submitted ?? 0), color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                { label: 'Disetujui', value: vendorRadar?.myDocuments?.approved ?? 0, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Perlu Aksi', value: vendorRadar?.needsAction?.length ?? 0, color: 'text-red-400', bg: 'bg-red-500/20' },
              ].map(item => (
                <Card key={item.label} className="bg-card border-border">
                  <CardContent className="pt-5">
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      : <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    }
                  </CardContent>
                </Card>
              ))}
            </div>

            {vendorRadar?.needsAction?.length > 0 && (
              <Card className="bg-card border-border mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-sm text-orange-400">⚠️ Perlu Tindakan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vendorRadar.needsAction.map(d => (
                    <div key={d.id}
                      onClick={() => router.push(`/vendor/submissions/${d.id}`)}
                      className="flex items-center justify-between p-3 bg-card/70 border border-border/50 rounded-lg cursor-pointer hover:bg-card/80 transition-colors">
                      <div>
                        <p className="text-foreground text-sm font-medium">{d.documentNumber}</p>
                        <p className="text-orange-400 text-xs">{d.action}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <button onClick={() => router.push('/vendor/submissions/new')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors">
              + Pengajuan Baru
            </button>
          </>
        )}
      </div>
    </AppShell>
  )
}
using Dtc.Api.Middleware;
using Microsoft.AspNetCore.RateLimiting;
namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Enums;
using Dtc.Infrastructure.Jobs;
using Dtc.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/vendor")]
[Authorize]
public class VendorController : ControllerBase
{
    private readonly IVendorService _vendor;
    private readonly IStorageService _storage;
    private readonly IBackgroundJobClient _jobs;
    private readonly DtcDbContext _db;

    public VendorController(IVendorService vendor, IStorageService storage,
        IBackgroundJobClient jobs, DtcDbContext db)
    {
        _vendor = vendor;
        _storage = storage;
        _jobs = jobs;
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

    [HttpPost("submissions")]
    public async Task<IActionResult> Create([FromBody] CreateVendorSubmissionRequest request)
    {
        try
        {
            var result = await _vendor.CreateSubmissionAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("submissions/{id:guid}/upload")]
    [EnableRateLimiting("upload")]
    public async Task<IActionResult> UploadPdf(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var minSize = 1L * 1024; // 1KB for testing, restore to 5MB in production
        var maxSize = 100L * 1024 * 1024;

        if (file.Length < minSize)
            return BadRequest(new { error = $"File terlalu kecil. file Anda: {file.Length / 1024:F1}KB" });

        if (file.Length > maxSize)
            return BadRequest(new { error = $"File terlalu besar. Maximum 100MB." });

        // Validasi magic bytes — bukan hanya extension
        if (!await file.IsPdfAsync())
            return BadRequest(new { success = false, error = "File bukan PDF valid. Pastikan file adalah dokumen PDF asli.", statusCode = 400, timestamp = DateTime.UtcNow });

        var submission = await _db.PendingVendorRequests
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == GetUserId());

        if (submission is null) return NotFound(new { error = "Submission not found." });

        // Allow re-submission if previously rejected
        if (submission.Status == VendorSubmissionStatus.Rejected)
        {
            submission.Status = VendorSubmissionStatus.Pending;
            submission.AiGrade = Dtc.Domain.Enums.AiGrade.Pending;
            submission.AnalysisCompleted = false;
            submission.RejectionReason = null;
            submission.RejectionCategory = null;
            submission.ValidatorNotes = null;
            submission.ValidatedAt = null;
            submission.ExpiresAt = DateTime.UtcNow.AddDays(30);
        }
        else if (submission.Status != VendorSubmissionStatus.Pending)
            return BadRequest(new { error = "Submission sudah diproses dan tidak bisa diubah." });

        var storagePath = $"vendor-submissions/temporary/{id}/original.pdf";
        using var stream = file.OpenReadStream();
        await _storage.UploadAsync(storagePath, stream, "application/pdf");

        var sha256 = await file.ComputeSha256Async();
        submission.OriginalStoragePath = storagePath;
        submission.FileName = file.FileName;
        submission.FileSizeBytes = file.Length;
        submission.Sha256Hash = sha256;
        submission.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var jobId = _jobs.Enqueue<AnalysisJob>(job => job.ProcessAsync(id));

        return Ok(new
        {
            message = "File uploaded. Analysis started in background.",
            submissionId = id,
            fileName = file.FileName,
            fileSizeMb = Math.Round(file.Length / 1024.0 / 1024.0, 4),
            jobId,
            estimatedProcessingMinutes = 15
        });
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _vendor.GetSubmissionAsync(id, GetUserId());
        if (result is null) return NotFound(new { error = "Submission not found." });
        return Ok(result);
    }

    [HttpGet("submissions")]
    public async Task<IActionResult> GetMine()
        => Ok(await _vendor.GetMySubmissionsAsync(GetUserId()));

    /// <summary>Buat submission baru sebagai resubmission dari yang ditolak</summary>
    [HttpPost("submissions/{id:guid}/resubmit")]
    public async Task<IActionResult> Resubmit(Guid id, [FromBody] ResubmitVendorSubmissionRequest request)
    {
        try
        {
            var result = await _vendor.ResubmitAsync(id, GetUserId(), request.Notes);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, new
            {
                message = "Resubmission berhasil dibuat. Silakan upload file PDF baru.",
                newSubmissionId = result.Id,
                submissionNumber = result.SubmissionNumber,
                resubmissionCount = result.ResubmissionCount,
                uploadUrl = $"/api/vendor/submissions/{result.Id}/upload"
            });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>Cek status resubmission (berapa kali sudah resubmit)</summary>
    [HttpGet("submissions/{id:guid}/resubmission-status")]
    public async Task<IActionResult> GetResubmissionStatus(Guid id)
    {
        var submission = await _db.PendingVendorRequests
            .FirstOrDefaultAsync(s => s.Id == id && s.VendorUserId == GetUserId());
        if (submission is null) return NotFound(new { error = "Submission not found." });

        var count = await _vendor.GetResubmissionCountAsync(id);
        return Ok(new
        {
            submissionId = id,
            resubmissionCount = count,
            maxResubmissions = submission.MaxResubmissions,
            remainingAttempts = submission.MaxResubmissions - count,
            canResubmit = submission.Status == VendorSubmissionStatus.Rejected
                       && count < submission.MaxResubmissions
        });
    }

}namespace Dtc.Api.Controllers;

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dtc.Application.DTOs;
using Dtc.Application.Interfaces;
using Dtc.Domain.Common;

[ApiController]
[Route("api/validator")]
[Authorize]
public class ValidatorController : ControllerBase
{
    private readonly IValidatorService _validator;
    public ValidatorController(IValidatorService validator) => _validator = validator;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value!);

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
        => Ok(await _validator.GetQueueAsync());

    [HttpGet("review/{id:guid}")]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await _validator.GetDetailAsync(id);
        if (result is null) return NotFound(new { error = "Submission not found." });
        return Ok(result);
    }

    [HttpPost("review/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromQuery] string? notes = null)
    {
        try { return Ok(await _validator.ApproveAsync(id, GetUserId(), notes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("review/{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectSubmissionRequest request)
    {
        try { return Ok(await _validator.RejectAsync(id, GetUserId(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPost("review/{id:guid}/return-for-revision")]
    public async Task<IActionResult> ReturnForRevision(Guid id, [FromBody] ReturnForRevisionRequest request)
    {
        try { return Ok(await _validator.ReturnForRevisionAsync(id, GetUserId(), request.ReturnNotes)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (ArgumentException ex) { return NotFound(new { error = ex.Message }); }
    }

}