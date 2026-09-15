import io
import json
import pytest
from PIL import Image, ImageDraw

from app.schemas.facts import ProductFacts, FactValue
from app.schemas.ocr import OCRResult, OCRToken
from app.schemas.compliance import ComplianceStatus, ComplianceFinding, ReviewRequest
from services.compliance.applicability import applicability_service
from services.compliance.evaluator import legal_evaluator
from services.compliance.scoring import scoring_service
from services.cv.annotator import visual_annotator
from services.reports.pdf_generator import pdf_generator
from app.models.scan import Scan

def create_sample_jpeg():
    img = Image.new("RGB", (400, 300), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 350, 250], outline=(0, 0, 0), width=2)
    draw.text((60, 60), "Sample Label", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()

def test_applicability_retail_package():
    facts = ProductFacts(
        net_quantity_value=FactValue(raw_value="500", normalized_value=500.0),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    result = applicability_service.evaluate_applicability(facts, commodity_type="FOOD_GRAINS")
    assert result.is_applicable is True
    assert "Chapter II" in result.chapter
    assert len(result.statutory_exemptions) == 0

def test_applicability_statutory_exemption_10g():
    facts = ProductFacts(
        net_quantity_value=FactValue(raw_value="5", normalized_value=5.0),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    result = applicability_service.evaluate_applicability(facts, commodity_type="GENERAL_PACKAGED_GOODS")
    assert result.is_applicable is False
    assert "EXEMPT_RULE_26_A_WEIGHT_OR_VOL" in result.statutory_exemptions

def test_applicability_tobacco_not_exempt():
    facts = ProductFacts(
        generic_name=FactValue(raw_value="Cigarettes"),
        net_quantity_value=FactValue(raw_value="5", normalized_value=5.0),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    result = applicability_service.evaluate_applicability(facts, commodity_type="TOBACCO")
    assert result.is_applicable is True
    assert len(result.statutory_exemptions) == 0

def test_applicability_fast_food_and_drugs():
    facts = ProductFacts()
    res_ff = applicability_service.evaluate_applicability(facts, commodity_type="RESTAURANT_FAST_FOOD", is_fast_food=True)
    assert res_ff.is_applicable is False
    assert "EXEMPT_RULE_26_B_HOTEL_RESTAURANT" in res_ff.statutory_exemptions

    res_drug = applicability_service.evaluate_applicability(facts, commodity_type="DRUGS_DPCO", is_drug=True)
    assert res_drug.is_applicable is False
    assert "EXEMPT_RULE_26_C_DRUGS" in res_drug.statutory_exemptions

def test_applicability_agri_50kg():
    facts = ProductFacts(
        net_quantity_value=FactValue(raw_value="60000", normalized_value=60000.0),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    result = applicability_service.evaluate_applicability(facts, commodity_type="FOOD_GRAINS")
    assert result.is_applicable is False
    assert "EXEMPT_RULE_26_D_AGRI_50KG" in result.statutory_exemptions

def test_compliance_evaluator_standard_compliant_package():
    facts = ProductFacts(
        manufacturer_name=FactValue(raw_value="Himalayan Foods Pvt. Ltd.", bbox=[0.1, 0.7, 0.5, 0.75]),
        manufacturer_address=FactValue(raw_value="New Delhi - 110020", bbox=[0.1, 0.76, 0.8, 0.8]),
        generic_name=FactValue(raw_value="Basmati Rice", bbox=[0.2, 0.1, 0.8, 0.16]),
        net_quantity_value=FactValue(raw_value="1", normalized_value=1.0, bbox=[0.15, 0.35, 0.45, 0.41]),
        net_quantity_unit=FactValue(raw_value="kg", normalized_value="kg"),
        mrp_value=FactValue(raw_value="140.00", normalized_value=140.0, bbox=[0.15, 0.43, 0.75, 0.49]),
        mrp_currency=FactValue(raw_value="₹"),
        inclusive_of_taxes_clause=FactValue(raw_value="incl. of all taxes"),
        unit_sale_price=FactValue(raw_value="₹ 140.00 / kg", bbox=[0.15, 0.51, 0.65, 0.56]),
        mfg_date=FactValue(raw_value="08/2026", normalized_value="2026-08", bbox=[0.15, 0.58, 0.5, 0.63]),
        consumer_care_email=FactValue(raw_value="care@himalayanfoods.com", bbox=[0.15, 0.84, 0.85, 0.89]),
        blur_score=150.0,
        contrast_score=65.0
    )
    ocr_result = OCRResult(full_text="ROYAL BASMATI RICE 1kg MRP ₹ 140.00 incl of all taxes")
    cv_findings = {"tampering": {"detected": False}, "font_height": {"scale_calibrated": False, "estimated_height_mm": 3.2}}
    applicability = applicability_service.evaluate_applicability(facts, "FOOD_GRAINS")

    findings = legal_evaluator.evaluate(facts, ocr_result, cv_findings, applicability, "FOOD_GRAINS")
    assert len(findings) > 0

    rule_map = {f.rule_id: f for f in findings}
    assert rule_map["PC_RULE_6_1_A_MANUFACTURER"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_B_GENERIC_NAME"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_C_NET_QUANTITY"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_D_DATE"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_DA_USP"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_E_MRP"].status == ComplianceStatus.PASS
    assert rule_map["PC_RULE_6_1_N_CONSUMER_CARE"].status == ComplianceStatus.PASS
    # Rule 7 uncalibrated is REVIEW_REQUIRED
    assert rule_map["PC_RULE_7_FONT_SIZE"].status == ComplianceStatus.REVIEW_REQUIRED

    summary = scoring_service.calculate_summary("scan-123", findings, applicability)
    assert summary.compliance_score >= 80.0
    assert summary.overall_verdict == ComplianceStatus.REVIEW_REQUIRED

def test_compliance_evaluator_missing_taxes_and_tampering():
    facts = ProductFacts(
        mrp_value=FactValue(raw_value="250.00"),
        inclusive_of_taxes_clause=None, # Missing statutory clause
        tampering_detected=True,
        tampering_reason="Suspicious secondary sticker edge detected over MRP substrate"
    )
    ocr_result = OCRResult(full_text="MRP 250")
    cv_findings = {"tampering": {"detected": True, "reason": "Secondary sticker detected"}}
    applicability = applicability_service.evaluate_applicability(facts, "GENERAL_PACKAGED_GOODS")

    findings = legal_evaluator.evaluate(facts, ocr_result, cv_findings, applicability)
    rule_map = {f.rule_id: f for f in findings}

    assert rule_map["PC_RULE_6_1_E_MRP"].status == ComplianceStatus.FAIL
    assert "tampering" in rule_map["PC_RULE_6_1_E_MRP"].detected.lower()

def test_compliance_evaluator_rule_10_non_metric():
    facts = ProductFacts()
    ocr_result = OCRResult(full_text="Net Weight: 2.5 lbs approx jumbo pack")
    cv_findings = {}
    applicability = applicability_service.evaluate_applicability(facts, "GENERAL_PACKAGED_GOODS")

    findings = legal_evaluator.evaluate(facts, ocr_result, cv_findings, applicability)
    rule_map = {f.rule_id: f for f in findings}

    assert rule_map["PC_RULE_10_STANDARD_UNITS"].status == ComplianceStatus.FAIL

def test_visual_annotator():
    img_bytes = create_sample_jpeg()
    finding = ComplianceFinding(
        rule_id="PC_RULE_6_1_E_MRP",
        source_rule="Rule 6(1)(e)",
        category="MRP",
        title="MRP Inclusive of Taxes",
        status=ComplianceStatus.PASS,
        expected="MRP",
        detected="₹ 140",
        reasoning="Compliant",
        evidence=[
            {
                "evidence_type": "IMAGE_BBOX",
                "bbox": [0.1, 0.1, 0.6, 0.4],
                "confidence": 0.95
            }
        ]
    )

    annotated = visual_annotator.annotate(img_bytes, [finding])
    assert len(annotated) > 0
    assert annotated[:2] == b'\xff\xd8' # JPEG SOI marker

def test_scan_full_lifecycle_and_pdf(client):
    # 1. Upload scan
    img_buf = io.BytesIO(create_sample_jpeg())
    files = {"file": ("packet.jpg", img_buf, "image/jpeg")}
    upload_res = client.post("/api/v1/scans/upload", files=files, data={"commodity_type": "FOOD_GRAINS"})
    assert upload_res.status_code == 200
    scan_id = upload_res.json()["scan_id"]

    # 2. Trigger end-to-end analysis
    analyze_res = client.post(f"/api/v1/scans/{scan_id}/analyze")
    assert analyze_res.status_code == 200
    analyze_data = analyze_res.json()
    assert analyze_data["status"] == "COMPLETED"
    assert "overall_verdict" in analyze_data
    assert "compliance_score" in analyze_data
    assert len(analyze_data["findings"]) > 0

    # 3. Retrieve annotated image
    ann_res = client.get(f"/api/v1/scans/{scan_id}/annotated-image")
    assert ann_res.status_code == 200
    assert ann_res.headers["content-type"] in ["image/jpeg", "image/jpg"]

    # 4. Officer Adjudication (Override Rule 7 from REVIEW_REQUIRED to PASS after physical gauge check)
    review_payload = {
        "rule_id": "PC_RULE_7_FONT_SIZE",
        "status": "PASS",
        "notes": "Verified with physical micrometer optical gauge: numeral height measured 4.2mm, meeting Schedule I standards.",
        "reviewer_name": "Inspector S. Sharma"
    }
    review_res = client.post(f"/api/v1/scans/{scan_id}/review", json=review_payload)
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["status"] == "PASS"
    assert review_data["updated_finding"]["status"] == "PASS"

    # 5. Check audit trail
    logs_res = client.get(f"/api/v1/scans/{scan_id}/reviews")
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) == 1
    assert logs[0]["rule_id"] == "PC_RULE_7_FONT_SIZE"
    assert logs[0]["reviewer_name"] == "Inspector S. Sharma"

    # 6. Download Official PDF Inspection Certificate
    pdf_res = client.get(f"/api/v1/scans/{scan_id}/report/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")
