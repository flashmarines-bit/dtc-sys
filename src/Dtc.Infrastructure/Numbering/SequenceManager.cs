using Microsoft.EntityFrameworkCore;
using Dtc.Infrastructure.Persistence;
using Dtc.Domain.Entities;

namespace Dtc.Infrastructure.Numbering;

public class SequenceManager
{
    private readonly DtcDbContext _db;

    public SequenceManager(DtcDbContext db)
    {
        _db = db;
    }

    public async Task<int> GetNextSequenceAsync(
        Guid documentTypeId,
        Guid functionId,
        string scopeKey,
        int year,
        CancellationToken ct = default)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        var record = await _db.NumberingRecords
            .FirstOrDefaultAsync(x =>
                x.DocumentTypeId == documentTypeId &&
                x.ScopeKey == scopeKey &&
                x.Year == year, ct);

        if (record == null)
        {
            record = new NumberingRecord
            {
                Id = Guid.NewGuid(),
                DocumentTypeId = documentTypeId,
                OrganizationFunctionId = functionId,
                ScopeKey = scopeKey,
                Year = year,
                LastSequence = 1
            };

            _db.NumberingRecords.Add(record);
        }
        else
        {
            record.LastSequence += 1;
        }

        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return record.LastSequence;
    }
}
