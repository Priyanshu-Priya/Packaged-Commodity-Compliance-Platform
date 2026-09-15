# System Architecture: Legal Metrology Packaged Commodity Compliance Platform

## 1. Architectural Philosophy

The architecture strictly enforces separation of concerns between:
1. **Perception**: Extracting text, bounding boxes, confidences, and visual dimensions from the package image.
2. **Fact Representation**: Normalizing extracted data into typed Pydantic models (e.g. INR currency, metric units).
3. **Legal Reasoning**: Evaluating deterministic statutory rules from the Legal Metrology (Packaged Commodities) Rules, 2011 against the normalized facts.
4. **Evidence & Audit**: Providing bounding boxes, crops, confidence scores, and legal citations for every finding.

## 2. Ingestion & Perception Flow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Enforcement Officer
    participant Web as Web Frontend (React)
    participant API as FastAPI Gateway
    participant CV as OpenCV Quality Engine
    participant OCR as OCR Engine (Mock / Paddle)
    participant DB as SQLite / PostgreSQL

    Officer->>Web: Upload Package Image (JPEG/PNG)
    Web->>API: POST /api/v1/scans/upload
    API->>CV: Decode Image & Assess Quality (Laplacian blur, contrast)
    CV-->>API: Quality metrics (is_blurry, contrast_score, resolution)
    API->>DB: Create Scan record (status=UPLOADED)
    API-->>Web: Scan registered with SHA-256 and quality stats
    Officer->>Web: Click "Start Compliance Scan"
    Web->>API: Trigger OCR & Compliance Lifecycle
    API->>OCR: Extract tokens with Bounding Boxes & Confidence
    OCR-->>API: OCRResult (tokens, coordinates, full text)
    API->>DB: Save OCR results
```

## 3. Legal Reasoning Pipeline

```mermaid
flowchart TD
    Facts[Structured Product Facts] --> AppEngine[Applicability & Exemption Engine]
    AppEngine -->|Is Package <= 10g/ml?| Rule26{Rule 26 Exemption}
    Rule26 -->|Yes| Exempt[Verdict: NOT_APPLICABLE / EXEMPT]
    Rule26 -->|No| Eval[Evaluate Active Rules]
    
    Eval --> R6a[Rule 6.1.a Manufacturer Address]
    Eval --> R6b[Rule 6.1.b Generic Name]
    Eval --> R6c[Rule 6.1.c Net Quantity & Units]
    Eval --> R6d[Rule 6.1.d Date of Mfg/Packing]
    Eval --> R6da[Rule 6.1.da Unit Sale Price USP]
    Eval --> R6e[Rule 6.1.e MRP incl. Taxes]
    Eval --> R6n[Rule 6.1.n Consumer Care Contact]
    Eval --> R7[Rule 7 Minimum Numeral Height]
    Eval --> R8[Rule 8 Legibility & Contrast]
    
    R6a & R6b & R6c & R6d & R6da & R6e & R6n & R7 & R8 --> ResultCompiler[Compile Findings & Verdict]
    ResultCompiler --> FinalVerdict[PASS / FAIL / REVIEW_REQUIRED]
```

## 4. Modularity and Fallback Guarantees
- If physical millimeter scale cannot be verified from a 2D image, Rule 7 automatically returns `REVIEW_REQUIRED` rather than generating a false legal conviction.
- If an image is excessively blurry, OpenCV Laplacian check alerts the officer before making a legal decision.
- Pluggable OCR interface allows swapping between Mock, PaddleOCR, and Tesseract without modifying the legal rule engine.
