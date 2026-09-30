namespace DoAn2_BackEnd.Helpers;

/// <summary>Business state changed or a concurrent request won the race.</summary>
public sealed class BusinessConflictException : Exception
{
    public BusinessConflictException(string message) : base(message)
    {
    }
}
