# Legal Metrology Packaged Commodity Compliance Platform

An AI-assisted regulatory compliance verification platform for inspecting pre-packaged commodities under the **Legal Metrology (Packaged Commodities) Rules, 2011** (Government of India).

---

## ⚖️ Core Engineering Invariant

> **AI extracts and measures. Deterministic rules decide compliance.**

Under no circumstances does an AI model or black-box LLM determine whether a manufacturer is "COMPLIANT" or "NON-COMPLIANT".

```text
IMAGE
  ↓
OPENCV QUALITY PREPROCESSOR (Blur, Contrast, Resolution)
  ↓
OCR ENGINE (Text, Tokens, Normalized Bounding Boxes, Confidence)
  ↓
REGEX & HEURISTIC FACT EXTRACTOR (MRP, Units, Net Qty, Dates, Address, USP)
  ↓
COMPUTER VISION MEASUREMENTS (Font Height, Contrast, Legibility, Tampering)
  ↓
APPLICABILITY & EXEMPTION ENGINE (Chapter II, Rule 3, Rule 26)
  ↓
LEGAL METROLOGY RULE ENGINE (Rules 6, 7, 8, 9, 10, 26)
  ↓
EXPLAINABLE VERDICT (PASS / FAIL / REVIEW_REQUIRED / NOT_APPLICABLE)
  ↓
VISUAL EVIDENCE GENERATOR (Annotated BBoxes on Image)
  ↓
OFFICIAL INSPECTION CERTIFICATE (Tamper-evident PDF)
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ & npm 9+ (Tested on Node 22 & npm 11)

### Quickest Start (Single Command)
```bash
# Launches both FastAPI Backend and Vite Web Frontend concurrently
python run.py
```

### Manual Individual Commands

#### 1. Run Backend API
```bash
# Seed demonstration scans and initialize SQLite database
python scripts/seed.py

# Launch FastAPI Server
python -m uvicorn app.main:app --app-dir apps/api --port 8000 --reload
```
Interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`
- Statutory Rules: `http://localhost:8000/api/v1/rules`

#### 2. Run Frontend Web App
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Tests
```bash
python -m pytest apps/api/tests -v
```

---

## 📂 Repository Structure

```text
legal-metrology-compliance/
├── apps/
│   ├── api/                     # FastAPI backend application
│   │   ├── app/
│   │   │   ├── api/v1/          # Endpoints (scans, rules, dashboard, health)
│   │   │   ├── core/            # Database session, config, security
│   │   │   ├── models/          # SQLAlchemy ORM definitions
│   │   │   ├── schemas/         # Pydantic validation contracts
│   │   │   └── main.py          # Application entrypoint
│   │   └── tests/               # Pytest suite
│   └── web/                     # React 19 + TypeScript + Vite + Tailwind CSS
│       ├── src/
│       │   ├── components/      # UI components (Navbar, Badges, Cards)
│       │   ├── pages/           # Dashboard, NewScan, Rules, History
│       │   ├── services/        # API client
│       │   └── types/           # TypeScript interfaces
│       └── package.json
├── services/                    # Perception & Legal reasoning engines
│   ├── ocr/                     # Pluggable OCR interface & OpenCV preprocessor
│   └── compliance/              # Canonical Legal Rule Registry
├── data/
│   └── legal/                   # Authoritative PCR 2011 Rules, Commodities, Exemptions
├── storage/                     # Local storage (uploads, evidence, reports)
├── scripts/                     # Seed & utility scripts
├── docker-compose.yml
└── README.md
```

---

## 📜 Statutory Rules Grounding (PCR 2011)

All rules strictly mirror the official **Legal Metrology (Packaged Commodities) Rules, 2011**:
- **Rule 6(1)(a)**: Name and complete address of manufacturer / packer / importer.
- **Rule 6(1)(b)**: Generic or common name of the commodity.
- **Rule 6(1)(c) & Rules 11–13**: Net quantity expressed in standard metric units.
- **Rule 6(1)(d)**: Month and year of manufacture / packing / import.
- **Rule 6(1)(da)**: Mandatory Unit Sale Price (USP) for packages $> 1\,\text{kg}$ or $> 1\,\text{L}$.
- **Rule 6(1)(e)**: Maximum Retail Price (MRP) inclusive of all taxes.
- **Rule 6(1)(n)**: Consumer care contact details (phone, email, or postal address).
- **Rule 7**: Minimum numeral and letter height based on package quantity/PDP area.
- **Rule 8 & 9**: Legibility, conspicuousness, and Principal Display Panel grouping.
- **Rule 10**: Prohibition of non-metric units or misleading qualifiers.
- **Rule 26**: Statutory exemptions for packages $\le 10\,\text{g}$ or $\le 10\,\text{mL}$.
