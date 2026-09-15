from typing import List
from services.ocr.base import BaseOCRProvider
from services.ocr.preprocessor import ImagePreprocessor
from app.schemas.ocr import OCRResult, OCRToken

class MockOCREngine(BaseOCRProvider):
    """
    Deterministic OCR engine for CI/CD, unit tests, and quick demo evaluation.
    Provides realistic bounding boxes and tokens for standard compliant and non-compliant packages.
    """
    def extract(self, image_bytes: bytes) -> OCRResult:
        img = ImagePreprocessor.decode_image(image_bytes)
        height, width = img.shape[:2]

        # Sample realistic packaging tokens (Standard Food Grain / Rice Pack)
        sample_tokens = [
            OCRToken(text="ROYAL BASMATI RICE", confidence=0.98, bbox=[0.20, 0.08, 0.80, 0.16], line_number=1),
            OCRToken(text="Premium Aged Grain", confidence=0.95, bbox=[0.25, 0.17, 0.75, 0.22], line_number=2),
            OCRToken(text="Net Qty: 1 kg", confidence=0.99, bbox=[0.15, 0.35, 0.45, 0.41], line_number=3),
            OCRToken(text="MRP Rs. 140.00 (Incl. of all taxes)", confidence=0.97, bbox=[0.15, 0.43, 0.75, 0.49], line_number=4),
            OCRToken(text="Unit Sale Price: Rs. 140.00 / kg", confidence=0.94, bbox=[0.15, 0.51, 0.65, 0.56], line_number=5),
            OCRToken(text="Mfd. Date: 08/2026", confidence=0.96, bbox=[0.15, 0.58, 0.50, 0.63], line_number=6),
            OCRToken(text="Best Before 24 Months from Packaging", confidence=0.93, bbox=[0.15, 0.64, 0.70, 0.69], line_number=7),
            OCRToken(text="Manufactured & Packed By:", confidence=0.95, bbox=[0.15, 0.71, 0.55, 0.75], line_number=8),
            OCRToken(text="Himalayan Foods Pvt. Ltd., Industrial Area, Phase II, New Delhi - 110020", confidence=0.92, bbox=[0.15, 0.76, 0.85, 0.82], line_number=9),
            OCRToken(text="For Consumer Complaints: 1800-11-2233 | care@himalayanfoods.com", confidence=0.96, bbox=[0.15, 0.84, 0.85, 0.89], line_number=10)
        ]

        full_text = "\n".join(t.text for t in sample_tokens)
        avg_conf = sum(t.confidence for t in sample_tokens) / len(sample_tokens)

        return OCRResult(
            tokens=sample_tokens,
            full_text=full_text,
            average_confidence=round(avg_conf, 3),
            image_width=width,
            image_height=height
        )
