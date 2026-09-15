import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional

class ImagePreprocessor:
    @staticmethod
    def decode_image(image_bytes: bytes) -> np.ndarray:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid or corrupted image format")
        return img

    @staticmethod
    def assess_quality(img: np.ndarray) -> Dict[str, Any]:
        """
        Calculates blur metric using Laplacian variance and contrast using grayscale standard deviation.
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        contrast_score = float(gray.std())
        is_blurry = laplacian_var < 75.0
        
        return {
            "laplacian_variance": round(laplacian_var, 2),
            "contrast_score": round(contrast_score, 2),
            "is_blurry": is_blurry,
            "width": int(img.shape[1]),
            "height": int(img.shape[0])
        }

    @staticmethod
    def resize_max_dim(img: np.ndarray, max_dim: int = 1800) -> np.ndarray:
        """
        Downsamples overly large photos to preserve memory and speed up OCR while maintaining aspect ratio.
        """
        h, w = img.shape[:2]
        if max(h, w) <= max_dim:
            return img
        
        if h > w:
            new_h = max_dim
            new_w = int(w * (max_dim / h))
        else:
            new_w = max_dim
            new_h = int(h * (max_dim / w))
        
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def denoise(img: np.ndarray) -> np.ndarray:
        """
        Applies fast bilateral filter to remove noise/specular glare while keeping text edges sharp.
        """
        return cv2.bilateralFilter(img, d=5, sigmaColor=50, sigmaSpace=50)

    @staticmethod
    def enhance_contrast(img: np.ndarray) -> np.ndarray:
        """
        Enhances contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
        """
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    @staticmethod
    def deskew(img: np.ndarray) -> np.ndarray:
        """
        Detects predominant text angle and deskews the image if tilted between -45 and 45 degrees.
        """
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) < 100:
                return img
            
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle
            
            if abs(angle) < 1.0 or abs(angle) > 30.0:
                return img # Negligible skew or too extreme
            
            (h, w) = img.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        except Exception:
            return img

    @classmethod
    def preprocess_pipeline(
        cls,
        image_bytes: bytes,
        apply_resize: bool = True,
        apply_denoise: bool = False,
        apply_contrast: bool = True,
        apply_deskew: bool = False
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        img = cls.decode_image(image_bytes)
        quality = cls.assess_quality(img)

        if apply_resize:
            img = cls.resize_max_dim(img)
        if apply_denoise:
            img = cls.denoise(img)
        if apply_contrast:
            img = cls.enhance_contrast(img)
        if apply_deskew:
            img = cls.deskew(img)

        return img, quality
