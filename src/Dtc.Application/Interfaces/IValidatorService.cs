namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IValidatorService
{
    Task<List<VendorSubmissionDto>> GetQueueAsync();
    Task<VendorSubmissionDto?> GetDetailAsync(Guid id);
    Task<VendorSubmissionDto> ApproveAsync(Guid id, Guid validatorUserId, string? notes);
    Task<VendorSubmissionDto> RejectAsync(Guid id, Guid validatorUserId, RejectSubmissionRequest request);
    Task<VendorSubmissionDto> ReturnForRevisionAsync(Guid id, Guid validatorUserId, string returnNotes);
}
