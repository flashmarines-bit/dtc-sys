namespace Dtc.Application.Interfaces;

using Dtc.Application.DTOs;

public interface IVendorService
{
    Task<VendorSubmissionDto> CreateSubmissionAsync(CreateVendorSubmissionRequest request, Guid vendorUserId);
    Task<VendorSubmissionDto?> GetSubmissionAsync(Guid id, Guid vendorUserId);
    Task<List<VendorSubmissionDto>> GetMySubmissionsAsync(Guid vendorUserId);
}
