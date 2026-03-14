using Dtc.Domain.Entities;

namespace Dtc.Infrastructure.Numbering;

public static class TokenResolver
{
    public static Dictionary<string, string> Resolve(
        DocumentType documentType,
        OrganizationFunction function,
        NumberingContext context,
        int sequence)
    {
        var year = context.Date.Year.ToString();
        var month = context.Date.Month.ToString("D2");

        return new Dictionary<string, string>
        {
            { "SEQ", sequence.ToString().PadLeft(documentType.SequencePadding, '0') },
            { "TYPE", documentType.Code },
            { "FUNGSI", function.Code },
            { "YEAR", year },
            { "MONTH", month },
            { "SUFFIX", function.Suffix ?? "" },
            { "DEPT", context.Department ?? "" },
            { "PROJECT", context.Project ?? "" },
            { "LOCATION", context.Location ?? "" }
        };
    }
}
