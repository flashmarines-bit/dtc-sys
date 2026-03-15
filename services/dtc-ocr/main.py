import os, io, re, json, logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pypdfium2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from paddleocr import PaddleOCR
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DTC OCR Service")

# Init PaddleOCR — load model sekali saat startup
logger.info("Loading PaddleOCR model...")
ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
logger.info("PaddleOCR model loaded.")

# ── DOCUMENT CLASSIFICATION RULES ────────────────────────────────────────────

DOCUMENT_RULES = {
    "SPPP": {
        "keywords": ["Surat Permintaan Proses Pembayaran", "SPPP"],
        "required_fields": ["NomorSurat", "Tanggal", "NilaiPembayaran"],
        "patterns": {
            "NomorSurat":      [r"No[.\s:]+([A-Z0-9\/\-]+)", r"Nomor[:\s]+([A-Z0-9\/\-]+)"],
            "Tanggal":         [r"(?:Tanggal|Date)[:\s]+(\d{1,2}\s+\w+\s+\d{4})", r"(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4})"],
            "NilaiPembayaran": [r"Rp[\s.]*([\d.,]+)", r"IDR[\s]*([\d.,]+)"],
            "Approver":        [r"(?:Disetujui|Approved)[:\s]+([A-Za-z\s]+)"],
        }
    },
    "INVOICE": {
        "keywords": ["INVOICE", "Invoice"],
        "required_fields": ["NomorInvoice", "NomorPO", "NilaiInvoice"],
        "patterns": {
            "NomorInvoice": [r"(?:Invoice|lnvoice)\s*(?:No|Number|#)[:\s.]*([\w\-\/]+)"],
            "NomorPO":      [r"(3[7O][0O][0O]\d+)", r"PO[:\s.]*(3700\d+)"],
            "NamaVendor":   [r"(?:From|Dari|Vendor)[:\s]+([A-Za-z\s.,]+)"],
            "NilaiInvoice": [r"(?:Total|Amount)[:\s]*Rp[\s.]*([\d.,]+)"],
            "Tanggal":      [r"(?:Date|Tanggal)[:\s]+(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4})"],
        }
    },
    "RELEASE_ORDER": {
        "keywords": ["Release Order", "Release Order Serv", "RELEASE ORDER"],
        "required_fields": ["NomorRO", "Tanggal"],
        "patterns": {
            "NomorRO":    [r"(3[7O][0O][0O]\d+)"],
            "Deskripsi":  [r"(?:Description|Deskripsi)[:\s]+(.+)"],
            "Tanggal":    [r"(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4})"],
            "NilaiOrder": [r"(?:Value|Nilai)[:\s]*Rp[\s.]*([\d.,]+)"],
        }
    },
    "SERVICE_ACCEPTANCE": {
        "keywords": ["SERVICE ACCEPTANCE NUMBER", "Service Acceptance", "SAN"],
        "required_fields": ["SANumber", "Tanggal"],
        "patterns": {
            "SANumber":     [r"(1[0O][0O]\d+)"],
            "NamaVendor":   [r"(?:Vendor|Contractor)[:\s]+([A-Za-z\s.,]+)"],
            "Tanggal":      [r"(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4})"],
            "NilaiService": [r"(?:Amount|Value)[:\s]*Rp[\s.]*([\d.,]+)"],
        }
    },
    "BERITA_ACARA": {
        "keywords": ["BASTP", "BAPP", "Berita Acara"],
        "required_fields": ["JenisBA", "NomorBA", "Tanggal"],
        "patterns": {
            "JenisBA":      [r"(BASTP|BAPP|Berita Acara[A-Za-z\s]*)"],
            "NomorBA":      [r"(?:Nomor|No)[.:\s]+([A-Z0-9\/\-]+)"],
            "Tanggal":      [r"(\d{1,2}[\s\/\-]\w+[\s\/\-]\d{4})"],
            "PihakPertama": [r"(?:Pihak\s*(?:Pertama|I))[:\s]+([A-Za-z\s.,]+)"],
            "PihakKedua":   [r"(?:Pihak\s*(?:Kedua|II))[:\s]+([A-Za-z\s.,]+)"],
        }
    }
}

SIGNATORY_PATTERNS = [
    r"(?:Mengetahui|Menyetujui|Disetujui\s*oleh|Approved\s*by)[:\s,\n]+([A-Za-z]+(?:\s+[A-Za-z]+)+)",
    r"(?:ttd|Tanda\s*Tangan)[:\s\n]+([A-Za-z]+(?:\s+[A-Za-z]+)+)",
    r"([A-Za-z]+(?:\s+[A-Za-z]+){1,4})\s*(?:\n|\s{2,})\s*(?:Manager|Direktur|VP|Head|Chief|Sr\.|Junior)",
    r"((?:[A-Z][a-z]+\s+){1,4}[A-Z][a-z]+)\s*\n\s*Manager",
]

# ── IMAGE PREPROCESSING ───────────────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> np.ndarray:
    img = image.convert('L')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    img = img.filter(ImageFilter.SHARPEN)
    w, h = img.size
    if w < 1500:
        ratio = 1500 / w
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    return np.array(img)

# ── OCR PER HALAMAN ───────────────────────────────────────────────────────────

def ocr_page(page) -> dict:
    bitmap = page.render(scale=2.5)
    pil_image = bitmap.to_pil()
    processed = preprocess_image(pil_image)
    result = ocr_engine.ocr(processed, cls=True)
    text = ""
    confidence_scores = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) >= 2:
                text += line[1][0] + " "
                confidence_scores.append(line[1][1])
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    return {
        "text": text.strip(),
        "confidence": round(avg_confidence, 3),
        "line_count": len(confidence_scores)
    }

# ── DOCUMENT CLASSIFICATION ───────────────────────────────────────────────────

def classify_document(full_text: str) -> str:
    text_upper = full_text.upper()
    for doc_type, rules in DOCUMENT_RULES.items():
        for keyword in rules["keywords"]:
            if keyword.upper() in text_upper:
                return doc_type
    return "UNKNOWN"

# ── FIELD EXTRACTION ──────────────────────────────────────────────────────────

def extract_fields(doc_type: str, full_text: str) -> dict:
    if doc_type not in DOCUMENT_RULES:
        return {}
    fields = {}
    rules = DOCUMENT_RULES[doc_type]["patterns"]
    for field_name, patterns in rules.items():
        for pattern in patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                fields[field_name] = match.group(1).strip()
                break
    return fields

# ── SIGNATORY DETECTION ───────────────────────────────────────────────────────

def detect_signatory(full_text: str) -> str | None:
    for pattern in SIGNATORY_PATTERNS:
        match = re.search(pattern, full_text, re.IGNORECASE | re.MULTILINE)
        if match:
            name = match.group(1).strip()
            if len(name) > 3:
                return name
    return None

# ── GRADING ───────────────────────────────────────────────────────────────────

def grade_document(doc_type: str, extracted_fields: dict) -> tuple[str, int, str]:
    if doc_type == "UNKNOWN":
        return "Invalid", 1, "Tipe dokumen tidak dikenali"

    required = DOCUMENT_RULES[doc_type]["required_fields"]
    found = [f for f in required if extracted_fields.get(f)]
    missing = [f for f in required if not extracted_fields.get(f)]

    completeness = len(found) / len(required) if required else 0
    score = max(1, min(10, int(completeness * 8) + 2))

    if not missing:
        return "Complete", score, f"Semua field wajib ditemukan: {', '.join(found)}"
    elif found:
        return "Incomplete", score, f"Field tidak ditemukan: {', '.join(missing)}"
    else:
        return "Invalid", 2, f"Tidak ada field wajib yang ditemukan. Cek kualitas scan."

# ── DPI CHECK ─────────────────────────────────────────────────────────────────

def check_dpi(pdf_path: str) -> dict:
    try:
        pdf = pypdfium2.PdfDocument(pdf_path)
        page = pdf[0]
        width_pt = page.get_width()
        bitmap = page.render(scale=1.0)
        pixel_width = bitmap.width
        dpi = int((pixel_width / width_pt) * 72)
        pdf.close()
        return {
            "dpi": dpi,
            "pass": dpi >= 300,
            "message": f"DPI terdeteksi: {dpi}" + (" ✓" if dpi >= 300 else " ✗ (minimum 300 DPI)")
        }
    except Exception as e:
        return {"dpi": 0, "pass": False, "message": f"Tidak bisa cek DPI: {str(e)}"}

# ── SEARCHABLE PDF ────────────────────────────────────────────────────────────

def create_searchable_pdf(pdf_path: str, pages_text: list[dict]) -> bytes:
    pdf = pypdfium2.PdfDocument(pdf_path)
    output = io.BytesIO()
    c = canvas.Canvas(output, pagesize=A4)

    for i, page_data in enumerate(pages_text):
        if i < len(pdf):
            page = pdf[i]
            w_pt = page.get_width()
            h_pt = page.get_height()
            c.setPageSize((w_pt, h_pt))

            # Render halaman sebagai gambar background
            bitmap = page.render(scale=1.5)
            pil_img = bitmap.to_pil()
            img_bytes = io.BytesIO()
            pil_img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            from reportlab.lib.utils import ImageReader
            c.drawImage(ImageReader(img_bytes), 0, 0, w_pt, h_pt)

            # Embed teks invisible di atas gambar
            c.setFillColorRGB(1, 1, 1, alpha=0)
            c.setFont("Helvetica", 8)
            text = page_data.get("text", "")
            if text:
                words = text.split()
                y_pos = h_pt - 20
                x_pos = 10
                for word in words:
                    c.drawString(x_pos, y_pos, word)
                    x_pos += len(word) * 5
                    if x_pos > w_pt - 50:
                        x_pos = 10
                        y_pos -= 12
                    if y_pos < 20:
                        break

        c.showPage()

    c.save()
    pdf.close()
    return output.getvalue()

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "healthy", "service": "DTC OCR Service"}

@app.post("/check-dpi")
async def check_pdf_dpi(file: UploadFile = File(...)):
    content = await file.read()
    tmp_path = f"/tmp/dpi_check_{file.filename}"
    with open(tmp_path, 'wb') as f:
        f.write(content)
    result = check_dpi(tmp_path)
    os.remove(tmp_path)
    return result

@app.post("/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    logger.info(f"Analyzing: {file.filename}")
    content = await file.read()
    tmp_path = f"/tmp/analyze_{file.filename}"

    with open(tmp_path, 'wb') as f:
        f.write(content)

    try:
        # DPI check
        dpi_result = check_dpi(tmp_path)

        # OCR semua halaman (max 20)
        pdf = pypdfium2.PdfDocument(tmp_path)
        total_pages = len(pdf)
        max_pages = min(total_pages, 20)

        pages_data = []
        full_text = ""

        logger.info(f"Processing {max_pages} pages...")
        for i in range(max_pages):
            logger.info(f"  OCR page {i+1}/{max_pages}")
            page_result = ocr_page(pdf[i])
            pages_data.append(page_result)
            full_text += page_result["text"] + " "

        pdf.close()

        # Buat searchable PDF
        logger.info("Creating searchable PDF...")
        searchable_pdf_bytes = create_searchable_pdf(tmp_path, pages_data)

        # Classification
        doc_type = classify_document(full_text)
        logger.info(f"Document type: {doc_type}")

        # Field extraction
        extracted_fields = extract_fields(doc_type, full_text)

        # Signatory detection
        signatory = detect_signatory(full_text)

        # Grading
        grade, score, summary = grade_document(doc_type, extracted_fields)

        # Avg confidence
        avg_conf = sum(p["confidence"] for p in pages_data) / len(pages_data) if pages_data else 0

        result = {
            "success": True,
            "file_name": file.filename,
            "total_pages": total_pages,
            "pages_analyzed": max_pages,
            "dpi_check": dpi_result,
            "avg_ocr_confidence": round(avg_conf, 3),
            "document_type": doc_type,
            "extracted_fields": extracted_fields,
            "detected_signatory": signatory,
            "grade": grade,
            "ai_score": score,
            "ai_summary": summary,
            "full_text_length": len(full_text),
            "searchable_pdf_base64": __import__('base64').b64encode(searchable_pdf_bytes).decode()
        }

        return JSONResponse(content=result)

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
