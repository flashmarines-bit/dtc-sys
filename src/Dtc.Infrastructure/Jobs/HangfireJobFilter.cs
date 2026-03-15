namespace Dtc.Infrastructure.Jobs;

using Hangfire.Common;
using Hangfire.States;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;

/// <summary>
/// Hangfire filter yang mengirim alert email jika job gagal setelah semua retry habis
/// </summary>
public class HangfireJobFilter : JobFilterAttribute, IApplyStateFilter
{
    private readonly ILogger<HangfireJobFilter> _logger;

    public HangfireJobFilter(ILogger<HangfireJobFilter> logger)
    {
        _logger = logger;
    }

    public void OnStateApplied(ApplyStateContext context, IWriteOnlyTransaction transaction)
    {
        if (context.NewState is FailedState failedState)
        {
            var jobId = context.BackgroundJob.Id;
            var jobName = context.BackgroundJob.Job?.Method?.Name ?? "Unknown";
            var error = failedState.Exception?.Message ?? "Unknown error";

            _logger.LogError(
                "🔴 Hangfire job FAILED permanently | JobId: {JobId} | Method: {Method} | Error: {Error}",
                jobId, jobName, error);

            // Log ke dead letter untuk monitoring
            _logger.LogError(
                "[DEAD-LETTER] Job {JobId} ({Method}) moved to failed state after all retries exhausted. " +
                "Manual intervention may be required. Error: {Error}",
                jobId, jobName, error);
        }
        else if (context.NewState is ScheduledState)
        {
            var jobName = context.BackgroundJob.Job?.Method?.Name ?? "Unknown";
            _logger.LogWarning(
                "⚠️ Hangfire job RETRYING | JobId: {JobId} | Method: {Method}",
                context.BackgroundJob.Id, jobName);
        }
    }

    public void OnStateUnapplied(ApplyStateContext context, IWriteOnlyTransaction transaction) { }
}
