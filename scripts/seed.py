import sys
import json
import uuid
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API_ROOT = ROOT / "apps" / "api"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(API_ROOT))

from app.core.database import SessionLocal, init_db
from app.core.config import settings
from app.models.scan import Scan, ReviewLog
from app.services.scan_service import scan_service

def seed():
    print("[Seed] Initializing database and storage directories...")
    init_db()
    db = SessionLocal()

    # Clear existing scans and reviews
    db.query(ReviewLog).delete()
    db.query(Scan).delete()
    db.commit()

    sample_src = ROOT / "data" / "golden" / "samples" / "sample_rice.jpg"
    sample_dst = settings.UPLOAD_DIR / "sample_rice_1kg.jpg"
    if sample_src.exists():
        shutil.copyfile(sample_src, sample_dst)
        print(f"[Seed] Copied sample image: {sample_src.name}")
    else:
        print(f"[Seed] ERROR: Sample image not found at {sample_src}")
        db.close()
        return

    now = datetime.now(timezone.utc)

    # SCAN 1: Real OCR Analysis of Himalayan Heritage Basmati Rice 1kg
    print("\n[Seed] Processing Scan 1: Himalayan Heritage Basmati Rice 1kg")
    print("  > Using REAL OCR extraction (EasyOCR)")
    scan_1_id = str(uuid.uuid4())
    scan_1 = Scan(
        id=scan_1_id,
        scan_number="LM-202609-00101",
        image_filename="sample_rice_1kg.jpg",
        image_path=str(sample_dst),
        commodity_type="FOOD_GRAINS",
        status="UPLOADED",
        created_at=now - timedelta(hours=4)
    )
    db.add(scan_1)
    db.commit()
    db.refresh(scan_1)

    try:
        print("  > Running full pipeline: OCR > Facts > CV > Compliance Rules > Scoring > Visual Evidence")
        ocr_result, facts, findings, summary = scan_service.execute_full_pipeline(scan_1, db)

        print(f"\n  [OK] OCR Complete: Extracted {len(ocr_result.tokens)} text tokens")
        print(f"    - Average confidence: {ocr_result.average_confidence:.1%}")

        print(f"\n  [OK] Facts Extracted:")
        if facts.generic_name:
            print(f"    - Generic Name: {facts.generic_name.normalized_value}")
        if facts.net_quantity_value:
            print(f"    - Net Quantity: {facts.net_quantity_value.normalized_value} {facts.net_quantity_unit.normalized_value if facts.net_quantity_unit else ''}")
        if facts.mrp_value:
            print(f"    - MRP: Rs. {facts.mrp_value.normalized_value}")
        if facts.manufacturer_name:
            print(f"    - Manufacturer: {facts.manufacturer_name.normalized_value}")
        if facts.mfg_date:
            print(f"    - Mfg Date: {facts.mfg_date.normalized_value}")

        print(f"\n  [OK] Compliance Evaluation Complete:")
        print(f"    - Overall Verdict: {summary.overall_verdict.value}")
        print(f"    - Compliance Score: {summary.compliance_score}%")
        print(f"    - Total Findings: {len(findings)}")

        pass_count = sum(1 for f in findings if f.status.value == "PASS")
        fail_count = sum(1 for f in findings if f.status.value == "FAIL")
        review_count = sum(1 for f in findings if f.status.value == "REVIEW_REQUIRED")
        na_count = sum(1 for f in findings if f.status.value == "NOT_APPLICABLE")

        print(f"      > PASS: {pass_count}, FAIL: {fail_count}, REVIEW_REQUIRED: {review_count}, NOT_APPLICABLE: {na_count}")

        if fail_count > 0:
            print(f"\n  [WARN] Non-compliant findings:")
            for f in findings:
                if f.status.value == "FAIL":
                    print(f"      > {f.source_rule}: {f.title}")

        # Add an officer adjudication review if there are findings requiring review
        review_findings = [f for f in findings if f.status.value == "REVIEW_REQUIRED"]
        if review_findings:
            first_review = review_findings[0]
            print(f"\n  > Adding officer adjudication for: {first_review.rule_id}")
            scan_service.adjudicate_finding(
                scan=scan_1,
                rule_id=first_review.rule_id,
                updated_status="PASS",
                notes="Physical verification conducted with calibrated instruments. Finding confirmed compliant upon manual inspection.",
                reviewer_name="Inspector S. Sharma, Legal Metrology",
                db=db
            )
            print(f"    [OK] Adjudication recorded in audit trail")

        print(f"\n[Seed] [OK] Successfully seeded 1 real compliance scan using actual OCR extraction")
        print(f"  Scan ID: {scan_1_id}")
        print(f"  Scan Number: {scan_1.scan_number}")
        print(f"  Status: {scan_1.status}")
        print(f"\n[Seed] To upload your own images, use the /api/v1/scans/upload endpoint")
        print(f"  Then trigger analysis with POST /api/v1/scans/{{scan_id}}/analyze")

    except Exception as e:
        print(f"\n[Seed] ERROR during pipeline execution: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()

    db.close()

if __name__ == "__main__":
    seed()
