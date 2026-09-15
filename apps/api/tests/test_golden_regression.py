import pytest
from app.schemas.facts import ProductFacts, FactValue
from app.schemas.ocr import OCRResult, OCRToken
from app.schemas.compliance import ComplianceStatus
from services.compliance.applicability import applicability_service
from services.compliance.evaluator import legal_evaluator
from services.compliance.scoring import scoring_service

def test_golden_category_food_grains_compliant():
    facts = ProductFacts(
        manufacturer_name=FactValue(raw_value="Punjab Agro Processors Ltd."),
        manufacturer_address=FactValue(raw_value="Ludhiana, Punjab - 141001"),
        generic_name=FactValue(raw_value="Sharbati Whole Wheat Atta", bbox=[0.2, 0.1, 0.8, 0.2]),
        net_quantity_value=FactValue(raw_value="5", normalized_value=5.0, bbox=[0.2, 0.3, 0.5, 0.36]),
        net_quantity_unit=FactValue(raw_value="kg", normalized_value="kg"),
        mrp_value=FactValue(raw_value="280.00", normalized_value=280.0, bbox=[0.2, 0.4, 0.6, 0.46]),
        mrp_currency=FactValue(raw_value="₹"),
        inclusive_of_taxes_clause=FactValue(raw_value="incl. of all taxes"),
        unit_sale_price=FactValue(raw_value="₹ 56.00 / kg"),
        mfg_date=FactValue(raw_value="08/2026"),
        consumer_care_phone=FactValue(raw_value="1800-180-2233")
    )
    ocr = OCRResult(full_text="Punjab Agro Sharbati Atta 5kg MRP ₹280 incl of all taxes")
    cv = {"tampering": {"detected": False}, "font_height": {"scale_calibrated": True, "estimated_height_mm": 4.5}}
    app = applicability_service.evaluate_applicability(facts, "FOOD_GRAINS")

    findings = legal_evaluator.evaluate(facts, ocr, cv, app, "FOOD_GRAINS")
    summary = scoring_service.calculate_summary("scan-g1", findings, app)

    assert app.is_applicable is True
    assert summary.overall_verdict == ComplianceStatus.PASS
    assert summary.fail_count == 0

def test_golden_category_edible_oil_missing_usp():
    facts = ProductFacts(
        manufacturer_name=FactValue(raw_value="Marico Oils India"),
        manufacturer_address=FactValue(raw_value="Mumbai, MH - 400018"),
        generic_name=FactValue(raw_value="Refined Mustard Oil"),
        net_quantity_value=FactValue(raw_value="1", normalized_value=1.0),
        net_quantity_unit=FactValue(raw_value="l", normalized_value="l"),
        mrp_value=FactValue(raw_value="195.00"),
        mrp_currency=FactValue(raw_value="₹"),
        inclusive_of_taxes_clause=FactValue(raw_value="inclusive of all taxes"),
        unit_sale_price=None, # VIOLATION under Rule 6(1)(da)
        mfg_date=FactValue(raw_value="06/2026"),
        consumer_care_email=FactValue(raw_value="care@marico.com")
    )
    ocr = OCRResult(full_text="Refined Mustard Oil 1 Litre MRP 195 inclusive of all taxes")
    cv = {"tampering": {"detected": False}}
    app = applicability_service.evaluate_applicability(facts, "EDIBLE_OILS")

    findings = legal_evaluator.evaluate(facts, ocr, cv, app, "EDIBLE_OILS")
    summary = scoring_service.calculate_summary("scan-g2", findings, app)

    assert summary.overall_verdict == ComplianceStatus.FAIL
    assert any(f.rule_id == "PC_RULE_6_1_DA_USP" and f.status == ComplianceStatus.FAIL for f in findings)

def test_golden_category_tobacco_anti_exemption():
    # Tobacco commodity <= 10g MUST NOT be granted exemption under Rule 26(a)
    facts = ProductFacts(
        generic_name=FactValue(raw_value="Filter Cigarettes (Pack of 10)"),
        net_quantity_value=FactValue(raw_value="8.5", normalized_value=8.5),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    app = applicability_service.evaluate_applicability(facts, "TOBACCO")
    assert app.is_applicable is True
    assert len(app.statutory_exemptions) == 0

def test_golden_category_statutory_exemption_hotel_fast_food():
    facts = ProductFacts()
    app = applicability_service.evaluate_applicability(facts, "RESTAURANT_FAST_FOOD", is_fast_food=True)
    assert app.is_applicable is False
    assert "EXEMPT_RULE_26_B_HOTEL_RESTAURANT" in app.statutory_exemptions

    ocr = OCRResult(full_text="Fresh Sandwich")
    findings = legal_evaluator.evaluate(facts, ocr, {}, app, "RESTAURANT_FAST_FOOD")
    summary = scoring_service.calculate_summary("scan-g4", findings, app)
    assert summary.overall_verdict == ComplianceStatus.NOT_APPLICABLE

def test_golden_category_statutory_exemption_drugs_dpco():
    facts = ProductFacts()
    app = applicability_service.evaluate_applicability(facts, "DRUGS_DPCO", is_drug=True)
    assert app.is_applicable is False
    assert "EXEMPT_RULE_26_C_DRUGS" in app.statutory_exemptions

def test_golden_category_statutory_exemption_agri_bulk():
    facts = ProductFacts(
        net_quantity_value=FactValue(raw_value="75000", normalized_value=75000.0),
        net_quantity_unit=FactValue(raw_value="g", normalized_value="g")
    )
    app = applicability_service.evaluate_applicability(facts, "FOOD_GRAINS")
    assert app.is_applicable is False
    assert "EXEMPT_RULE_26_D_AGRI_50KG" in app.statutory_exemptions

def test_golden_category_institutional_supply():
    facts = ProductFacts()
    app = applicability_service.evaluate_applicability(facts, "GENERAL_PACKAGED_GOODS", is_institutional=True)
    assert app.is_applicable is False
    assert "EXEMPT_INSTITUTIONAL_INDUSTRIAL" in app.statutory_exemptions

def test_golden_category_non_metric_and_deceptive_qualifiers():
    facts = ProductFacts()
    ocr = OCRResult(full_text="King Size Jumbo Pack Net Wt 1.5 lbs approx")
    app = applicability_service.evaluate_applicability(facts, "GENERAL_PACKAGED_GOODS")
    findings = legal_evaluator.evaluate(facts, ocr, {}, app, "GENERAL_PACKAGED_GOODS")

    rule_10 = next(f for f in findings if f.rule_id == "PC_RULE_10_STANDARD_UNITS")
    assert rule_10.status == ComplianceStatus.FAIL
