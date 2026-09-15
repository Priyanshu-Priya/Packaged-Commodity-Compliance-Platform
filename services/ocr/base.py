from abc import ABC, abstractmethod
from app.schemas.ocr import OCRResult

class BaseOCRProvider(ABC):
    @abstractmethod
    def extract(self, image_bytes: bytes) -> OCRResult:
        """
        Extract text, tokens, confidences, and bounding boxes from image bytes.
        """
        pass
