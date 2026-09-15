import cv2
import numpy as np
from typing import List, Optional
from services.ocr.base import BaseOCRProvider
from services.ocr.preprocessor import ImagePreprocessor
from app.schemas.ocr import OCRResult, OCRToken

class EasyOCREngine(BaseOCRProvider):
    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self._reader = None

    def _get_reader(self):
        if self._reader is None:
            import easyocr
            import torch
            has_gpu = torch.cuda.is_available() and self.use_gpu
            self._reader = easyocr.Reader(['en'], gpu=has_gpu, verbose=False)
        return self._reader

    def extract(self, image_bytes: bytes) -> OCRResult:
        processed_img, quality = ImagePreprocessor.preprocess_pipeline(
            image_bytes,
            apply_resize=True,
            apply_denoise=False,
            apply_contrast=True,
            apply_deskew=False
        )
        height, width = processed_img.shape[:2]

        reader = self._get_reader()
        # EasyOCR expects RGB or BGR numpy array
        rgb_img = cv2.cvtColor(processed_img, cv2.COLOR_BGR2RGB)
        raw_results = reader.readtext(rgb_img)

        # Sort raw detections top-to-bottom, then left-to-right (reading order)
        # item: (polygon, text, confidence)
        sorted_results = sorted(
            raw_results,
            key=lambda item: (round(min(p[1] for p in item[0]) / 20) * 20, min(p[0] for p in item[0]))
        )

        tokens: List[OCRToken] = []
        for idx, (poly, text, conf) in enumerate(sorted_results, start=1):
            cleaned_text = text.strip()
            if not cleaned_text:
                continue

            # Convert polygon to normalized [x1, y1, x2, y2]
            px_x1 = min(p[0] for p in poly)
            px_y1 = min(p[1] for p in poly)
            px_x2 = max(p[0] for p in poly)
            px_y2 = max(p[1] for p in poly)

            norm_x1 = max(0.0, min(1.0, px_x1 / width))
            norm_y1 = max(0.0, min(1.0, px_y1 / height))
            norm_x2 = max(0.0, min(1.0, px_x2 / width))
            norm_y2 = max(0.0, min(1.0, px_y2 / height))

            tokens.append(OCRToken(
                text=cleaned_text,
                confidence=round(float(conf), 3),
                bbox=[round(norm_x1, 4), round(norm_y1, 4), round(norm_x2, 4), round(norm_y2, 4)],
                line_number=idx
            ))

        full_text = "\n".join(t.text for t in tokens)
        avg_conf = (sum(t.confidence for t in tokens) / len(tokens)) if tokens else 0.0

        return OCRResult(
            tokens=tokens,
            full_text=full_text,
            average_confidence=round(avg_conf, 3),
            image_width=width,
            image_height=height
        )
