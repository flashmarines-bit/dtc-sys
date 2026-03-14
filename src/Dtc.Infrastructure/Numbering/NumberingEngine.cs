using Dtc.Domain.Entities;

namespace Dtc.Infrastructure.Numbering;

public class NumberingEngine : INumberingEngine
{
    private readonly SequenceManager _sequenceManager;

    public NumberingEngine(SequenceManager sequenceManager)
    {
        _sequenceManager = sequenceManager;
    }

    public async Task<string> GenerateAsync(
        DocumentType documentType,
        OrganizationFunction function,
        NumberingContext context,
        CancellationToken ct = default)
    {
        var year = context.Date.Year;

        var scopeKey = SequenceScopeResolver.Resolve(
            documentType,
            function,
            context);

        var sequence = await _sequenceManager.GetNextSequenceAsync(
            documentType.Id,
            function.Id,
            scopeKey,
            year,
            ct);

        var tokens = TokenResolver.Resolve(
            documentType,
            function,
            context,
            sequence);

        var number = documentType.NumberingFormat;

        foreach (var token in tokens)
        {
            number = number.Replace($"{{{token.Key}}}", token.Value);
        }

        return number;
    }
}
