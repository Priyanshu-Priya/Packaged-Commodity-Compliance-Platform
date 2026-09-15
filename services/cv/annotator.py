import os
import cv2
import numpy as np
from typing import List, Optional
from pathlib import Path
from app.schemas.compliance import ComplianceFinding, ComplianceStatus
from services.ocr.preprocessor import ImagePreprocessor

COLOR_MAP = {
    ComplianceStatus.PASS: (46, 180, 80),           # Bright Green (BGR)
    ComplianceStatus.FAIL: (50, 50, 225),           # Crimson Red (BGR)
    ComplianceStatus.REVIEW_REQUIRED: (20, 160, 240), # Amber Gold (BGR)
    ComplianceStatus.NOT_APPLICABLE: (150, 150, 150)  # Slate Gray (BGR)
}

class VisualAnnotator:
    """
    Generates high-contrast visual evidence overlays on package images
    highlighting statutory compliance declarations with rule citations.
    """

    @staticmethod
    def annotate(
        image_bytes: bytes,
        findings: List[ComplianceFinding],
        output_path: Optional[Path] = None
    ) -> bytes:
        img = ImagePreprocessor.decode_image(image_bytes)
        height, width = img.shape[:2]
        overlay = img.copy()

        # Iterate over all findings that have bounding box evidence
        for finding in findings:
            color = COLOR_MAP.get(finding.status, (200, 200, 200))
            badge_text = f"{finding.source_rule}: {finding.status.value}"

            for ev in finding.evidence:
                if not ev.bbox or len(ev.bbox) != 4:
                    continue

                b = ev.bbox
                # Handle normalized vs absolute
                if b[0] <= 1.0 and b[1] <= 1.0 and b[2] <= 1.0 and b[3] <= 1.0:
                    x1 = int(b[0] * width)
                    y1 = int(b[1] * height)
                    x2 = int(b[2] * width)
                    y2 = int(b[3] * height)
                else:
                    x1, y1, x2, y2 = int(b[0]), int(b[1]), int(b[2]), int(b[3])

                # Clamp within boundaries
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(width - 1, x2), min(height - 1, y2)

                if x2 <= x1 or y2 <= y1:
                    continue

                # 1. Draw translucent colored fill over declaration
                cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)

                # 2. Draw solid border on original image
                cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

                # 3. Draw badge label
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.45
                thickness = 1
                (text_w, text_h), baseline = cv2.getTextSize(badge_text, font, font_scale, thickness)

                # Position badge above box if space permits, else inside top
                badge_y1 = max(0, y1 - text_h - 6)
                badge_y2 = badge_y1 + text_h + 6
                badge_x2 = min(width - 1, x1 + text_w + 10)

                cv2.rectangle(img, (x1, badge_y1), (badge_x2, badge_y2), color, -1)
                cv2.putText(
                    img,
                    badge_text,
                    (x1 + 4, badge_y2 - 4),
                    font,
                    font_scale,
                    (255, 255, 255),
                    thickness,
                    cv2.LINE_AA
                )

        # Alpha blend overlay with 20% opacity for subtle highlighting
        cv2.addWeighted(overlay, 0.20, img, 0.80, 0, img)

        success, encoded = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not success:
            raise RuntimeError("Failed to encode annotated image to JPEG")

        annotated_bytes = encoded.tobytes()

        if output_path:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(annotated_bytes)

        return annotated_bytes

visual_annotator = VisualAnnotator()
