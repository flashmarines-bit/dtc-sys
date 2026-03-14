namespace Dtc.Infrastructure.Services;

using QRCoder;
using Dtc.Application.Interfaces;

public class QrCodeService : IQrCodeService
{
    public byte[] GenerateQrPng(string text, int pixelsPerModule = 10)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrData);
        return qrCode.GetGraphic(pixelsPerModule);
    }

    public string GenerateQrCodeValue(int year, int sequence)
        => $"DTC-TRK-{year}-{sequence:D6}";
}
