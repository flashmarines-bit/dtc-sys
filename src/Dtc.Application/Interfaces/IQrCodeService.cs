namespace Dtc.Application.Interfaces;

public interface IQrCodeService
{
    /// <summary>Generate QR code PNG bytes from text</summary>
    byte[] GenerateQrPng(string text, int pixelsPerModule = 10);

    /// <summary>Generate unique QR code string for a document</summary>
    string GenerateQrCodeValue(int year, int sequence);
}
