using Dtc.Domain.Entities;

namespace Dtc.Infrastructure.Numbering;

public interface INumberingEngine
{
    Task<string> GenerateAsync(
        DocumentType documentType,
        OrganizationFunction function,
        NumberingContext context,
        CancellationToken ct = default);
}