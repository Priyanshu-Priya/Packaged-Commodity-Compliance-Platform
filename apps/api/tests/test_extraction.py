import pytest
from services.nlp.normalizer import Normalizer
from services.nlp.regex_extractor import RegexFactExtractor
from app.schemas.ocr import OCRResult, OCRToken

def test_normalizer_currency():
    assert Normalizer.normalize_currency_amount("MRP Rs. 140.00") == 140.0
    assert Normalizer.normalize_currency_amount("₹ 120") == 120.0
    assert Normalizer.normalize_currency_amount("Rs 99/-") == 99.0
    assert Normalizer.normalize_currency_amount("MRP: Rs. 1,250.50") == 1250.50
    assert Normalizer.normalize_currency_amount("Max Retail Price 45.00") == 45.0

def test_normalizer_quantity_weight():
    q1 = Normalizer.normalize_quantity("1", "kg")
    assert q1["base_value"] == 1000.0
    assert q1["base_unit"] == "g"

    q2 = Normalizer.normalize_quantity("500", "g")
    assert q2["base_value"] == 500.0
    assert q2["base_unit"] == "g"

    q3 = Normalizer.normalize_quantity("0.5", "kg")
    assert q3["base_value"] == 500.0
    assert q3["base_unit"] == "g"

    q4 = Normalizer.normalize_quantity("250", "gm")
    assert q4["base_value"] == 250.0
    assert q4["base_unit"] == "g"

def test_normalizer_quantity_volume():
    v1 = Normalizer.normalize_quantity("1", "l")
    assert v1["base_value"] == 1000.0
    assert v1["base_unit"] == "ml"

    v2 = Normalizer.normalize_quantity("750", "ml")
    assert v2["base_value"] == 750.0
    assert v2["base_unit"] == "ml"

    v3 = Normalizer.normalize_quantity("2", "litres")
    assert v3["base_value"] == 2000.0
    assert v3["base_unit"] == "ml"

def test_normalizer_dates():
    d1 = Normalizer.normalize_date("08/2026")
    assert d1 is not None
    assert d1["iso"] == "2026-08"
    assert d1["month"] == 8
    assert d1["year"] == 2026

    d2 = Normalizer.normalize_date("AUG 2026")
    assert d2 is not None
    assert d2["iso"] == "2026-08"

    d3 = Normalizer.normalize_date("December 2025")
    assert d3 is not None
    assert d3["iso"] == "2025-12"

    d4 = Normalizer.normalize_date("05-2024")
    assert d4 is not None
    assert d4["iso"] == "2024-05"

def test_normalizer_pincode_and_phone():
    assert Normalizer.normalize_pincode("New Delhi - 110020") == "110020"
    assert Normalizer.normalize_pincode("Bangalore 560001, India") == "560001"
    assert Normalizer.normalize_pincode("No code here") is None

    assert "1800-11-2233" in Normalizer.normalize_phone("Toll Free: 1800-11-2233")

def test_regex_fact_extractor_full_package():
    tokens = [
        OCRToken(text="ROYAL BASMATI RICE", confidence=0.99, bbox=[0.2, 0.1, 0.8, 0.2]),
        OCRToken(text="Generic Name: Basmati Rice", confidence=0.95, bbox=[0.2, 0.25, 0.8, 0.3]),
        OCRToken(text="Net Qty: 1 kg", confidence=0.98, bbox=[0.2, 0.35, 0.5, 0.4]),
        OCRToken(text="MRP Rs. 140.00 (Incl. of all taxes)", confidence=0.97, bbox=[0.2, 0.45, 0.8, 0.5]),
        OCRToken(text="Unit Sale Price: Rs. 140.00 per kg", confidence=0.94, bbox=[0.2, 0.55, 0.7, 0.6]),
        OCRToken(text="Mfd. Date: 08/2026", confidence=0.96, bbox=[0.2, 0.65, 0.5, 0.7]),
        OCRToken(text="Best Before: 24 Months from Packaging", confidence=0.93, bbox=[0.2, 0.7, 0.8, 0.75]),
        OCRToken(text="Manufactured & Packed By: Himalayan Foods Pvt. Ltd.", confidence=0.95, bbox=[0.2, 0.78, 0.8, 0.82]),
        OCRToken(text="Plot 42, Industrial Area, New Delhi - 110020", confidence=0.92, bbox=[0.2, 0.83, 0.8, 0.87]),
        OCRToken(text="Country of Origin: India", confidence=0.98, bbox=[0.2, 0.88, 0.6, 0.92]),
        OCRToken(text="Consumer Care: 1800-11-2233 | care@himalayanfoods.com", confidence=0.97, bbox=[0.2, 0.93, 0.8, 0.97])
    ]

    full_text = "\n".join(t.text for t in tokens)
    ocr_result = OCRResult(
        tokens=tokens,
        full_text=full_text,
        average_confidence=0.96,
        image_width=800,
        image_height=1000
    )

    facts = RegexFactExtractor.extract_facts(ocr_result)

    # 1. MRP
    assert facts.mrp_value is not None
    assert facts.mrp_value.normalized_value == 140.0
    assert facts.mrp_currency.normalized_value == "INR"
    assert facts.inclusive_of_taxes_clause is not None

    # 2. Net Quantity
    assert facts.net_quantity_value is not None
    assert facts.net_quantity_value.normalized_value == 1000.0 # 1 kg normalized to 1000g
    assert facts.net_quantity_unit.normalized_value == "g"

    # 3. USP
    assert facts.unit_sale_price is not None
    assert facts.unit_sale_price.normalized_value["amount"] == 140.0

    # 4. Dates
    assert facts.mfg_date is not None
    assert facts.mfg_date.normalized_value == "2026-08"
    assert facts.best_before is not None

    # 5. Manufacturer & Origin
    assert facts.manufacturer_name is not None
    assert "Himalayan Foods" in facts.manufacturer_name.normalized_value
    assert facts.manufacturer_address is not None
    assert facts.manufacturer_address.normalized_value["pincode"] == "110020"
    assert facts.country_of_origin.normalized_value == "India"

    # 6. Consumer Care
    assert facts.consumer_care_email is not None
    assert facts.consumer_care_email.normalized_value == "care@himalayanfoods.com"
    assert facts.consumer_care_phone is not None
    assert "1800" in facts.consumer_care_phone.normalized_value
