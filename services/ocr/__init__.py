import logging
from services.ocr.base import BaseOCRProvider
from services.ocr.mock_engine import MockOCREngine
from services.ocr.preprocessor import ImagePreprocessor
from app.core.config import settings

logger = logging.getLogger("legal_metrology.ocr")

def get_ocr_engine() -> BaseOCRProvider:
    provider = settings.OCR_PROVIDER.lower()
    
    if provider == "easyocr":
        try:
            from services.ocr.easy_ocr_engine import EasyOCREngine
            return EasyOCREngine(use_gpu=False)
        except Exception as e:
            logger.warning(f"EasyOCR initialization failed ({e}), falling back to MockOCREngine")
            return MockOCREngine()

    # Default provider (mock engine for instant deterministic tests and CI)
    return MockOCREngine()

__all__ = ["BaseOCRProvider", "MockOCREngine", "ImagePreprocessor", "get_ocr_engine"]
