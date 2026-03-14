namespace Dtc.Infrastructure.Numbering;

public class NumberingContext
{
    public DateTime Date { get; set; } = DateTime.UtcNow;

    public string? Department { get; set; }

    public string? Project { get; set; }

    public string? Location { get; set; }
}