using Dtc.Domain.Entities;

namespace Dtc.Infrastructure.Numbering;

public static class SequenceScopeResolver
{
    public static string Resolve(
        DocumentType documentType,
        OrganizationFunction function,
        NumberingContext context)
    {
        if (!string.IsNullOrWhiteSpace(context.Project))
            return $"PROJECT:{context.Project}";

        if (!string.IsNullOrWhiteSpace(context.Department))
            return $"DEPT:{context.Department}";

        return $"FUNC:{function.Code}";
    }
}
