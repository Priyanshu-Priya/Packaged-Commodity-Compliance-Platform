from typing import List, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class OCRToken(BaseModel):
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] normalized or pixel coordinates")
    line_number: Optional[int] = None

class OCRResult(BaseModel):
    tokens: List[OCRToken] = []
    full_text: str = ""
    average_confidence: float = 0.0
    image_width: int = 0
    image_height: int = 0
