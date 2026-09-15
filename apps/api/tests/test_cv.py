import io
import cv2
import numpy as np
from PIL import Image, ImageDraw
from services.cv.measurements import cv_service, CVMeasurementService
from app.schemas.ocr import OCRResult, OCRToken
from app.schemas.facts import ProductFacts, FactValue

def create_sharp_image_bytes():
    img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 350, 250], outline=(0, 0, 0), width=3)
    draw.text((80, 80), "Sharp Printed Text", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def create_blurry_image_bytes():
    sharp = create_sharp_image_bytes()
    nparr = np.frombuffer(sharp, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # Heavy Gaussian Blur
    blurred = cv2.GaussianBlur(img, (25, 25), 0)
    _, encoded = cv2.imencode(".jpg", blurred)
    return encoded.tobytes()

def test_cv_blur_sharp_vs_blurry():
    sharp_bytes = create_sharp_image_bytes()
    sharp_img = cv2.imdecode(np.frombuffer(sharp_bytes, np.uint8), cv2.IMREAD_COLOR)
    sharp_res = CVMeasurementService.analyze_blur(sharp_img)
    assert not sharp_res["is_blurry"]
    assert sharp_res["status"] == "PASS"

    blurry_bytes = create_blurry_image_bytes()
    blurry_img = cv2.imdecode(np.frombuffer(blurry_bytes, np.uint8), cv2.IMREAD_COLOR)
    blurry_res = CVMeasurementService.analyze_blur(blurry_img)
    assert blurry_res["is_blurry"]
    assert blurry_res["status"] == "REVIEW_REQUIRED"

def test_cv_contrast():
    sharp_bytes = create_sharp_image_bytes()
    sharp_img = cv2.imdecode(np.frombuffer(sharp_bytes, np.uint8), cv2.IMREAD_COLOR)
    contrast_res = CVMeasurementService.analyze_contrast(sharp_img, [])
    assert "contrast_score" in contrast_res
    assert contrast_res["contrast_score"] > 20.0
    assert contrast_res["status"] == "PASS"

def test_cv_font_height_estimation_rule_7():
    img = np.zeros((1000, 800, 3), dtype=np.uint8)
    tokens = [
        OCRToken(text="Net Qty: 1 kg", confidence=0.98, bbox=[0.2, 0.40, 0.5, 0.43]), # 30px height
        OCRToken(text="MRP Rs. 140.00", confidence=0.97, bbox=[0.2, 0.50, 0.6, 0.53])  # 30px height
    ]

    # Rule 7 with Net Qty 1000g -> requires min 4.0mm
    font_res = CVMeasurementService.estimate_font_height(img, tokens, net_qty_grams=1000.0)
    assert "estimated_mm" in font_res
    assert font_res["required_min_mm"] == 4.0
    # Statutory Safety Invariant: Without physical scale marker, status is always REVIEW_REQUIRED
    assert font_res["status"] == "REVIEW_REQUIRED"
    assert "uncalibrated" in font_res["reasoning"]

def test_cv_full_pipeline():
    sharp_bytes = create_sharp_image_bytes()
    tokens = [OCRToken(text="MRP Rs. 140.00", confidence=0.98, bbox=[0.2, 0.5, 0.8, 0.6])]
    ocr_result = OCRResult(tokens=tokens, full_text="MRP Rs. 140.00", average_confidence=0.98, image_width=400, image_height=300)
    facts = ProductFacts(mrp_value=FactValue(raw_value="140", normalized_value=140.0, confidence=0.98, source="regex"))

    findings = cv_service.run_full_pipeline(sharp_bytes, ocr_result, facts)
    assert "blur_analysis" in findings
    assert "contrast_analysis" in findings
    assert "font_height_analysis" in findings
    assert "tampering_analysis" in findings

    # Check facts were enriched
    assert facts.blur_score is not None
    assert facts.contrast_score is not None
    assert facts.estimated_font_height_mm is not None
