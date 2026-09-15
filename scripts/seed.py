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
from services.ocr.mock_engine import MockOCREngine
from services.nlp.regex_extractor import RegexFactExtractor
from services.cv.measurements import cv_service
from services.cv.annotator import visual_annotator
from services.compliance.applicability import applicability_service
from services.compliance.evaluator import legal_evaluator
from services.compliance.scoring import scoring_service
from app.schemas.facts import ProductFacts, FactValue
from app.schemas.ocr import OCRResult, OCRToken

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

    now = datetime.now(timezone.utc)

    # 1. SCAN 1: Compliant Basmati Rice 1kg (Full pipeline execution)
    print("[Seed] Processing Scan 1: Royal Basmati Rice 1kg (Compliant)...")
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

    scan_service.execute_full_pipeline(scan_1, db)
    # Add an officer adjudication review confirming Rule 7 font measurement
    scan_service.adjudicate_finding(
        scan=scan_1,
        rule_id="PC_RULE_7_FONT_SIZE",
        updated_status="PASS",
        notes="Physical verification conducted with digital micrometer gauge: numeral height measured at 4.2mm, exceeding Table I requirements.",
        reviewer_name="Inspector S. Sharma, Legal Metrology",
        db=db
    )

    # 2. SCAN 2: Non-compliant Biscuit Pack (Missing MRP Taxes Clause & USP)
    print("[Seed] Processing Scan 2: Biscuit Pack (Non-Compliant — Missing Taxes Clause & USP)...")
    scan_2_id = str(uuid.uuid4())
    scan_2 = Scan(
        id=scan_2_id,
        scan_number="LM-202609-00102",
        image_filename="sample_biscuit_pack.jpg",
        image_path=str(sample_dst),
        commodity_type="BISCUITS_CONFECTIONERY",
        status="UPLOADED",
        created_at=now - timedelta(hours=3)
    )
    db.add(scan_2)
    db.commit()

    with open(sample_dst, "rb") as f:
        img_bytes = f.read()

    biscuit_tokens = [
        OCRToken(text="CRUNCHY CHOC DELIGHT BISCUITS", confidence=0.97, bbox=[0.2, 0.1, 0.8, 0.18]),
        OCRToken(text="Net Qty: 200 g", confidence=0.98, bbox=[0.15, 0.35, 0.45, 0.41]),
        OCRToken(text="MRP Rs. 40.00", confidence=0.96, bbox=[0.15, 0.43, 0.55, 0.49]), # Missing taxes clause!
        OCRToken(text="Mfd. Date: 07/2026", confidence=0.95, bbox=[0.15, 0.51, 0.50, 0.56]),
        OCRToken(text="Manufactured By: Sweet Bakery Ltd., Mumbai - 400001", confidence=0.93, bbox=[0.15, 0.65, 0.85, 0.72]),
        OCRToken(text="Care: care@sweetbakery.com", confidence=0.94, bbox=[0.15, 0.75, 0.65, 0.80])
    ]
    ocr_biscuit = OCRResult(
        tokens=biscuit_tokens,
        full_text="\n".join(t.text for t in biscuit_tokens),
        average_confidence=0.95,
        image_width=800,
        image_height=600
    )
    facts_biscuit = RegexFactExtractor.extract_facts(ocr_biscuit)
    cv_biscuit = cv_service.run_full_pipeline(img_bytes, ocr_biscuit, facts_biscuit)
    app_biscuit = applicability_service.evaluate_applicability(facts_biscuit, "BISCUITS_CONFECTIONERY")
    findings_biscuit = legal_evaluator.evaluate(facts_biscuit, ocr_biscuit, cv_biscuit, app_biscuit, "BISCUITS_CONFECTIONERY")
    summary_biscuit = scoring_service.calculate_summary(scan_2_id, findings_biscuit, app_biscuit)

    ann_biscuit_path = settings.ANNOTATED_DIR / f"{scan_2_id}_annotated.jpg"
    visual_annotator.annotate(img_bytes, findings_biscuit, ann_biscuit_path)

    scan_2.ocr_json = json.dumps(ocr_biscuit.model_dump())
    scan_2.facts_json = json.dumps(facts_biscuit.model_dump())
    scan_2.findings_json = json.dumps([f.model_dump() for f in findings_biscuit])
    scan_2.summary_json = json.dumps(summary_biscuit.model_dump())
    scan_2.overall_verdict = summary_biscuit.overall_verdict.value
    scan_2.compliance_score = summary_biscuit.compliance_score
    scan_2.annotated_image_path = str(ann_biscuit_path)
    scan_2.status = "COMPLETED"
    scan_2.completed_at = now - timedelta(hours=3, minutes=-1)
    db.commit()

    # 3. SCAN 3: Edible Oil (Review Required: Uncalibrated Scale + Standard Size Review)
    print("[Seed] Processing Scan 3: Edible Sunflower Oil (Review Required)...")
    scan_3_id = str(uuid.uuid4())
    scan_3 = Scan(
        id=scan_3_id,
        scan_number="LM-202609-00103",
        image_filename="sample_edible_oil_1l.jpg",
        image_path=str(sample_dst),
        commodity_type="EDIBLE_OILS",
        status="UPLOADED",
        created_at=now - timedelta(hours=2)
    )
    db.add(scan_3)
    db.commit()

    oil_tokens = [
        OCRToken(text="SUNPURE EDIBLE SUNFLOWER OIL", confidence=0.98, bbox=[0.2, 0.1, 0.8, 0.18]),
        OCRToken(text="Net Qty: 910 g", confidence=0.97, bbox=[0.15, 0.35, 0.45, 0.41]), # 910g is non-standard under Second Schedule!
        OCRToken(text="MRP Rs. 185.00 (Inclusive of all taxes)", confidence=0.97, bbox=[0.15, 0.43, 0.75, 0.49]),
        OCRToken(text="Unit Sale Price: Rs. 0.20 / g", confidence=0.94, bbox=[0.15, 0.51, 0.65, 0.56]),
        OCRToken(text="Mfd. Date: 08/2026", confidence=0.95, bbox=[0.15, 0.58, 0.50, 0.63]),
        OCRToken(text="Packed By: Agro Oils Ltd., Kandla Port, Gujarat - 370210", confidence=0.93, bbox=[0.15, 0.68, 0.85, 0.75]),
        OCRToken(text="Consumer Grievances: 1800-22-3344", confidence=0.96, bbox=[0.15, 0.78, 0.70, 0.84])
    ]
    ocr_oil = OCRResult(
        tokens=oil_tokens,
        full_text="\n".join(t.text for t in oil_tokens),
        average_confidence=0.96,
        image_width=800,
        image_height=600
    )
    facts_oil = RegexFactExtractor.extract_facts(ocr_oil)
    cv_oil = cv_service.run_full_pipeline(img_bytes, ocr_oil, facts_oil)
    app_oil = applicability_service.evaluate_applicability(facts_oil, "EDIBLE_OILS")
    findings_oil = legal_evaluator.evaluate(facts_oil, ocr_oil, cv_oil, app_oil, "EDIBLE_OILS")
    summary_oil = scoring_service.calculate_summary(scan_3_id, findings_oil, app_oil)

    ann_oil_path = settings.ANNOTATED_DIR / f"{scan_3_id}_annotated.jpg"
    visual_annotator.annotate(img_bytes, findings_oil, ann_oil_path)

    scan_3.ocr_json = json.dumps(ocr_oil.model_dump())
    scan_3.facts_json = json.dumps(facts_oil.model_dump())
    scan_3.findings_json = json.dumps([f.model_dump() for f in findings_oil])
    scan_3.summary_json = json.dumps(summary_oil.model_dump())
    scan_3.overall_verdict = summary_oil.overall_verdict.value
    scan_3.compliance_score = summary_oil.compliance_score
    scan_3.annotated_image_path = str(ann_oil_path)
    scan_3.status = "COMPLETED"
    scan_3.completed_at = now - timedelta(hours=2, minutes=-1)
    db.commit()

    # 4. SCAN 4: Instant Coffee Sachet 5g (Rule 26(a) Statutory Exemption <= 10g)
    print("[Seed] Processing Scan 4: Instant Coffee Sachet 5g (Rule 26(a) Statutory Exemption)...")
    scan_4_id = str(uuid.uuid4())
    scan_4 = Scan(
        id=scan_4_id,
        scan_number="LM-202609-00104",
        image_filename="sample_coffee_sachet_5g.jpg",
        image_path=str(sample_dst),
        commodity_type="TEA_COFFEE",
        status="UPLOADED",
        created_at=now - timedelta(minutes=45)
    )
    db.add(scan_4)
    db.commit()

    coffee_tokens = [
        OCRToken(text="SUPER BLEND COFFEE", confidence=0.98, bbox=[0.2, 0.1, 0.8, 0.2]),
        OCRToken(text="Net Qty: 5 g", confidence=0.99, bbox=[0.2, 0.4, 0.6, 0.5]),
        OCRToken(text="MRP Rs. 5.00", confidence=0.95, bbox=[0.2, 0.55, 0.6, 0.65])
    ]
    ocr_coffee = OCRResult(
        tokens=coffee_tokens,
        full_text="\n".join(t.text for t in coffee_tokens),
        average_confidence=0.97,
        image_width=800,
        image_height=600
    )
    facts_coffee = RegexFactExtractor.extract_facts(ocr_coffee)
    cv_coffee = cv_service.run_full_pipeline(img_bytes, ocr_coffee, facts_coffee)
    app_coffee = applicability_service.evaluate_applicability(facts_coffee, "TEA_COFFEE")
    findings_coffee = legal_evaluator.evaluate(facts_coffee, ocr_coffee, cv_coffee, app_coffee, "TEA_COFFEE")
    summary_coffee = scoring_service.calculate_summary(scan_4_id, findings_coffee, app_coffee)

    ann_coffee_path = settings.ANNOTATED_DIR / f"{scan_4_id}_annotated.jpg"
    visual_annotator.annotate(img_bytes, findings_coffee, ann_coffee_path)

    scan_4.ocr_json = json.dumps(ocr_coffee.model_dump())
    scan_4.facts_json = json.dumps(facts_coffee.model_dump())
    scan_4.findings_json = json.dumps([f.model_dump() for f in findings_coffee])
    scan_4.summary_json = json.dumps(summary_coffee.model_dump())
    scan_4.overall_verdict = summary_coffee.overall_verdict.value
    scan_4.compliance_score = summary_coffee.compliance_score
    scan_4.annotated_image_path = str(ann_coffee_path)
    scan_4.status = "COMPLETED"
    scan_4.completed_at = now - timedelta(minutes=44)
    db.commit()

    print("[Seed] Successfully seeded 4 comprehensive demonstration packages across all statutory outcomes:")
    print("  1. LM-202609-00101: PASS (Royal Basmati Rice 1kg - 100.0% score)")
    print("  2. LM-202609-00102: FAIL (Biscuits 200g - Missing MRP Taxes & USP - 62.5% score)")
    print("  3. LM-202609-00103: REVIEW_REQUIRED (Edible Oil 910g - Non-standard size review - 87.5% score)")
    print("  4. LM-202609-00104: NOT_APPLICABLE (Coffee Sachet 5g - Rule 26(a) Exempt - 100.0% score)")
    db.close()

if __name__ == "__main__":
    seed()
