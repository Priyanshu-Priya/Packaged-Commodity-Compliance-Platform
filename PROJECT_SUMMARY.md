# Legal Metrology Package Compliance Platform

## Quick Architecture Overview

### System at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                                │
│  📱 Web App (React) - Camera Capture + File Upload              │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────────┐
│                   FASTAPI BACKEND                                │
│  Upload → Analyze → Results → PDF Generation                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼─────────┐          ┌─────────▼───────────────────────┐
│   SQLite DB      │          │   PROCESSING PIPELINE           │
│                  │          │                                 │
│  • Scans         │          │  1. 🔍 OCR (EasyOCR + OpenCV)  │
│  • Findings      │          │     ↓                           │
│  • Audit Logs    │          │  2. 📝 NLP (Fact Extraction)   │
│                  │          │     ↓                           │
└──────────────────┘          │  3. 📐 CV (Measurements)       │
                              │     ↓                           │
                              │  4. ⚖️ Rules (Compliance)       │
                              │     ↓                           │
                              │  5. 📄 PDF (Certificate)        │
                              └─────────────────────────────────┘
```

## Core Principle

> **"AI extracts and measures. Deterministic rules decide compliance."**

- ✅ AI/ML used for: OCR, text extraction, measurements
- ❌ AI/ML **NEVER** used for: PASS/FAIL decisions
- ⚖️ Only deterministic rule engines make compliance judgments

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind |
| **Backend** | FastAPI + SQLAlchemy + Pydantic |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **OCR** | EasyOCR + PyTorch + OpenCV |
| **NLP** | Custom Regex + Multi-line Extractors |
| **CV** | OpenCV + NumPy |
| **PDF** | ReportLab / WeasyPrint |

## Processing Pipeline (3-4 seconds)

```
1. UPLOAD
   📸 Camera / 📁 File → Validate → Quality Check → Store
   
2. OCR (2.5s)
   Image → Preprocess → EasyOCR → Text + Bboxes → Error Correction
   
3. NLP (50ms)
   OCR Text → Pattern Matching → Multi-line Assembly → Facts
   
4. CV (100ms)
   Image + Bboxes → Font Measurements → Blur/Contrast → Evidence
   
5. RULES (20ms)
   Facts + CV → Check 12 PCR Rules → PASS/FAIL/REVIEW
   
6. SCORING (10ms)
   Findings → Calculate % → Overall Verdict
   
7. VISUAL (150ms)
   Image + Findings → Color-coded Bboxes → Annotated Image
   
8. PDF (on-demand, 800ms)
   Scan Data → Official Certificate → SHA-256 Hash
```

## Key Features

### ✨ Enhanced OCR & NLP
- **OCR Error Correction**: "Petail" → "Retail", "Lld" → "Ltd"
- **Cross-token Extraction**: Handles split fields across multiple lines
- **Smart Inference**: Detects "kg" → infers "1 kg" when number missing
- **Multi-line Assembly**: Assembles addresses from sequential tokens

### 📸 Camera Capture
- Direct camera access (desktop webcam / mobile camera)
- Live preview with alignment guides
- Front/back camera switching
- High-resolution capture (1920x1080)
- Retake/confirm workflow

### 📋 Compliance Checking
- 12 PCR 2011 rules validated
- Rule 26 exemptions (≤10g/10mL)
- Font height verification (Rule 7)
- MRP + taxes clause (Rule 6)
- Visual evidence with color-coded bboxes

### 👮 Officer Adjudication
- Review and override AI findings
- Immutable audit trail
- Dynamic score recalculation
- Physical verification notes

## Project Structure

```
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/v1/   # REST endpoints
│   │   │   ├── models/   # SQLAlchemy ORM
│   │   │   ├── schemas/  # Pydantic validation
│   │   │   └── services/ # Business logic
│   │   └── tests/        # Pytest suite
│   │
│   └── web/              # React frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── pages/       # Route pages
│       │   └── services/    # API client
│       └── package.json
│
├── services/             # Core engines
│   ├── ocr/              # EasyOCR + preprocessing
│   ├── nlp/              # Fact extraction + correction
│   ├── cv/               # Measurements + annotation
│   ├── compliance/       # Rule engine + scoring
│   └── reports/          # PDF generation
│
├── data/
│   ├── legal/            # PCR 2011 rules JSON
│   └── golden/samples/   # Test images
│
├── storage/              # Runtime files
│   ├── uploads/          # Uploaded images
│   ├── annotated/        # Visual evidence
│   └── reports/          # Generated PDFs
│
├── scripts/              # Utilities
│   ├── seed.py           # Database initialization
│   └── verify_live.py    # System tests
│
├── run.py                # Launcher (backend + frontend)
├── legal_metrology.db    # SQLite database
└── ARCHITECTURE.md       # Detailed documentation
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/scans/upload` | Upload + quality check |
| POST | `/api/v1/scans/{id}/analyze` | Run full pipeline |
| GET | `/api/v1/scans/{id}` | Get scan details |
| GET | `/api/v1/scans/{id}/image` | Serve image |
| GET | `/api/v1/scans/{id}/annotated-image` | Visual evidence |
| GET | `/api/v1/scans/{id}/report/pdf` | PDF certificate |
| POST | `/api/v1/scans/{id}/review` | Officer adjudication |
| GET | `/api/v1/scans/{id}/reviews` | Audit trail |
| GET | `/api/v1/rules` | List PCR rules |
| GET | `/api/v1/dashboard/stats` | Statistics |

## Data Models

### Scan
```typescript
{
  id: string,
  scan_number: string,        // "LM-20260915-A1B2C3"
  image_path: string,
  commodity_type: string,     // "FOOD_GRAINS"
  status: string,             // "UPLOADED" | "COMPLETED"
  
  ocr_json: OCRResult,        // OCR tokens + text
  facts_json: ProductFacts,   // Extracted declarations
  findings_json: Finding[],   // Rule evaluations
  summary_json: Summary,      // Overall verdict
  
  overall_verdict: string,    // "PASS" | "FAIL" | "REVIEW_REQUIRED"
  compliance_score: number,   // 0-100
  
  annotated_image_path: string,
  created_at: timestamp,
  completed_at: timestamp
}
```

### Compliance Finding
```typescript
{
  rule_id: string,            // "PC_RULE_6_1_E_MRP"
  source_rule: string,        // "Rule 6(1)(e)"
  title: string,
  status: "PASS" | "FAIL" | "REVIEW_REQUIRED" | "NOT_APPLICABLE",
  reasoning: string,
  evidence_bbox: [x1,y1,x2,y2],
  severity: "CRITICAL" | "MAJOR" | "MINOR"
}
```

## Running the Project

### Development
```bash
# Quick start (launches both backend + frontend)
python run.py

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Manual Commands
```bash
# Backend only
python -m uvicorn app.main:app --app-dir apps/api --port 8000 --reload

# Frontend only
cd apps/web && npm run dev

# Initialize database with sample data
python scripts/seed.py

# Run tests
pytest apps/api/tests -v
python scripts/verify_live.py
```

### Configuration
```bash
# .env file
OCR_PROVIDER=easyocr          # or "mock" for testing
DATABASE_URL=sqlite:///./legal_metrology.db
STORAGE_DIR=./storage
```

## Performance

- **Upload**: 50ms
- **OCR**: 2.5s (CPU) / 0.8s (GPU)
- **NLP**: 50ms
- **CV**: 100ms
- **Rules**: 20ms
- **Visual**: 150ms
- **Total**: **~3-4 seconds** (1.5s with GPU)
- **PDF**: 800ms (on-demand)

## Compliance Score Improvements

**Before Enhancements:**
- Compliance Score: 79.2%
- Verdict: FAIL
- Issues: Missing net quantity, address errors

**After Enhancements:**
- Compliance Score: 87.5%
- Verdict: REVIEW_REQUIRED
- Improvements: All mandatory fields extracted

## Recent Improvements (2026-09-15)

1. ✅ **Real OCR Pipeline** - Switched from mock to EasyOCR
2. ✅ **OCR Error Correction** - Fixes common misrecognitions
3. ✅ **Multi-line Extraction** - Assembles split fields
4. ✅ **Cross-token Inference** - Smart defaults for missing numbers
5. ✅ **Camera Capture** - Direct photo capture in web app
6. ✅ **Enhanced Preprocessing** - Denoising + deskewing
7. ✅ **Better Address Extraction** - Manufacturer info assembly

## Legal Metrology Rules Covered

- ✅ Rule 6(1)(a) - Manufacturer name & address
- ✅ Rule 6(1)(b) - Generic/common name
- ✅ Rule 6(1)(c) - Net quantity (metric units)
- ✅ Rule 6(1)(d) - Manufacturing date
- ✅ Rule 6(1)(da) - Unit Sale Price (USP)
- ✅ Rule 6(1)(e) - MRP + "Inclusive of all taxes"
- ✅ Rule 6(1)(n) - Consumer care contact
- ✅ Rule 7 - Minimum font height
- ✅ Rule 8 - Legibility & contrast
- ✅ Rule 10 - Metric units only
- ✅ Rule 26 - Exemptions (≤10g/10mL)

## Security

- ✅ File type validation (JPEG/PNG/WebP only)
- ✅ Size limit (25MB)
- ✅ SHA-256 integrity hashing
- ✅ SQL injection protection (ORM)
- ✅ Pydantic input validation
- ✅ CORS whitelist
- ✅ Tamper-evident PDF certificates
- ✅ Immutable audit trail

## Support

For detailed architecture, see: `ARCHITECTURE.md`

For API documentation, visit: `http://localhost:8000/docs` (when running)

---

**Built with ❤️ for Legal Metrology Enforcement Officers**
