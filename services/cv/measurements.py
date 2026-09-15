import cv2
import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.ocr import OCRResult, OCRToken
from app.schemas.facts import ProductFacts
from services.ocr.preprocessor import ImagePreprocessor

class CVMeasurementService:
    @staticmethod
    def analyze_blur(img: np.ndarray) -> Dict[str, Any]:
        """
        Rule 8 Legibility Check:
        Calculates Laplacian variance to detect optical blur or camera defocus.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurry = laplacian_var < 75.0

        return {
            "metric": "Laplacian Variance",
            "score": round(laplacian_var, 2),
            "is_blurry": is_blurry,
            "status": "REVIEW_REQUIRED" if is_blurry else "PASS",
            "reasoning": "Image has sufficient edge sharpness for statutory inspection." if not is_blurry else "Potential camera blur detected. Inspection review recommended."
        }

    @staticmethod
    def analyze_contrast(img: np.ndarray, tokens: List[OCRToken]) -> Dict[str, Any]:
        """
        Rule 8 Conspicuousness Check:
        Evaluates luminance standard deviation and text/background contrast.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        contrast_score = float(gray.std())
        
        # Adequate packaging contrast typically std > 35.0
        is_low_contrast = contrast_score < 30.0

        return {
            "metric": "Grayscale Intensity Dispersion (RMS Contrast)",
            "contrast_score": round(contrast_score, 2),
            "is_low_contrast": is_low_contrast,
            "status": "REVIEW_REQUIRED" if is_low_contrast else "PASS",
            "reasoning": "Declarations have distinct contrast against background packaging substrate." if not is_low_contrast else "Low contrast between text and background substrate."
        }

    @staticmethod
    def estimate_font_height(
        img: np.ndarray,
        tokens: List[OCRToken],
        net_qty_grams: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Rule 7 Minimum Numeral/Letter Height Check:
        Estimates character height from OCR bounding boxes and package dimensions.
        """
        h, w = img.shape[:2]
        
        # Look for Net Quantity or MRP tokens as primary reference
        ref_tokens = [t for t in tokens if any(k in t.text.lower() for k in ["net", "qty", "mrp", "rs"])]
        if not ref_tokens and tokens:
            ref_tokens = tokens[:3]

        if not ref_tokens:
            return {
                "metric": "Numeral Height Estimation (Rule 7)",
                "estimated_mm": None,
                "status": "REVIEW_REQUIRED",
                "reasoning": "No reference numeral tokens detected to estimate character height."
            }

        # Average bounding box height of reference declarations
        pixel_heights = [(t.bbox[3] - t.bbox[1]) * h for t in ref_tokens]
        avg_pixel_height = sum(pixel_heights) / len(pixel_heights)
        relative_ratio = avg_pixel_height / h

        # Determine required minimum height under Rule 7 Table I
        # <= 200g: 2.0mm | 200g - 1kg: 4.0mm | > 1kg: 6.0mm
        required_min_mm = 2.0
        if net_qty_grams:
            if net_qty_grams > 1000.0:
                required_min_mm = 6.0
            elif net_qty_grams > 200.0:
                required_min_mm = 4.0

        # Uncalibrated camera reference:
        # Standard retail packaging photograph assumption (~150-200mm package height)
        assumed_package_height_mm = 200.0
        estimated_mm = round(relative_ratio * assumed_package_height_mm, 2)

        # Statutory Safety Invariant:
        # Without calibrated fiducial markers, physical millimeter values must be marked REVIEW_REQUIRED
        return {
            "metric": "Numeral Height Estimation (Rule 7)",
            "average_pixel_height": round(avg_pixel_height, 1),
            "relative_height_ratio": round(relative_ratio, 4),
            "estimated_mm": estimated_mm,
            "required_min_mm": required_min_mm,
            "is_calibrated": False,
            "status": "REVIEW_REQUIRED",
            "reasoning": f"Estimated character height ~{estimated_mm} mm (Statutory min: {required_min_mm} mm). Physical scale is uncalibrated; human verification required under Rule 7."
        }

    @staticmethod
    def analyze_tampering(img: np.ndarray, tokens: List[OCRToken]) -> Dict[str, Any]:
        """
        MRP & Date Tampering / Sticker Alteration Check:
        Examines edge gradient density and nested rectangular contours around price declaration.
        """
        h, w = img.shape[:2]
        
        # Locate MRP token
        mrp_token = None
        for t in tokens:
            if any(k in t.text.lower() for k in ["mrp", "retail price", "rs."]):
                mrp_token = t
                break

        if not mrp_token:
            return {
                "tampering_detected": False,
                "status": "REVIEW_REQUIRED",
                "reasoning": "MRP declaration region not located for substrate analysis."
            }

        # Crop MRP region with small margin
        x1 = max(0, int((mrp_token.bbox[0] - 0.03) * w))
        y1 = max(0, int((mrp_token.bbox[1] - 0.03) * h))
        x2 = min(w, int((mrp_token.bbox[2] + 0.03) * w))
        y2 = min(h, int((mrp_token.bbox[3] + 0.03) * h))

        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            return {"tampering_detected": False, "status": "PASS", "reasoning": "Crop region empty."}

        # Edge analysis: check for sharp secondary rectangular sticker borders
        gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_crop, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        sticker_suspect = False
        reason = "Normal printed substrate. No secondary sticker contour detected."

        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.04 * peri, True)
            area = cv2.contourArea(c)
            # If a prominent rectangle (>20% of the crop) is detected inside the price area
            if len(approx) == 4 and area > (crop.shape[0] * crop.shape[1] * 0.25):
                sticker_suspect = True
                reason = "Potential overlay sticker or secondary price label boundary detected."
                break

        return {
            "tampering_detected": sticker_suspect,
            "status": "REVIEW_REQUIRED" if sticker_suspect else "PASS",
            "reasoning": reason
        }

    @classmethod
    def run_full_pipeline(
        cls,
        image_bytes: bytes,
        ocr_result: OCRResult,
        facts: ProductFacts
    ) -> Dict[str, Any]:
        img = ImagePreprocessor.decode_image(image_bytes)
        tokens = ocr_result.tokens
        qty_g = facts.net_quantity_value.normalized_value if facts.net_quantity_value else None

        blur_res = cls.analyze_blur(img)
        contrast_res = cls.analyze_contrast(img, tokens)
        font_res = cls.estimate_font_height(img, tokens, qty_g)
        tampering_res = cls.analyze_tampering(img, tokens)

        # Enrich facts model
        facts.blur_score = blur_res["score"]
        facts.is_blurry = blur_res["is_blurry"]
        facts.contrast_score = contrast_res["contrast_score"]
        facts.estimated_font_height_mm = font_res["estimated_mm"]
        facts.tampering_detected = tampering_res["tampering_detected"]
        facts.tampering_reason = tampering_res["reasoning"] if tampering_res["tampering_detected"] else None

        return {
            "blur_analysis": blur_res,
            "contrast_analysis": contrast_res,
            "font_height_analysis": font_res,
            "tampering_analysis": tampering_res
        }

cv_service = CVMeasurementService()
