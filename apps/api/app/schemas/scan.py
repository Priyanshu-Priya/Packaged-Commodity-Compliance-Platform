from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.compliance import ComplianceStatus, ComplianceFinding, ComplianceSummary
from app.schemas.facts import ProductFacts
from app.schemas.ocr import OCRResult

class ScanCreate(BaseModel):
    commodity_type: str = "FOOD_GRAINS"
    declared_category: Optional[str] = None
    notes: Optional[str] = None

class ScanResponse(BaseModel):
    id: str
    scan_number: str
    image_filename: str
    image_url: str
    annotated_image_url: Optional[str] = None
    status: str # UPLOADED, OCR_COMPLETE, FACTS_EXTRACTED, COMPLETED, FAILED
    commodity_type: str
    overall_verdict: Optional[ComplianceStatus] = None
    compliance_score: Optional[float] = None
    ruleset_version: str = "PC_RULES_2011_v2023"
    ocr_result: Optional[OCRResult] = None
    facts: Optional[ProductFacts] = None
    findings: List[ComplianceFinding] = Field(default_factory=list)
    summary: Optional[ComplianceSummary] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class ReviewAction(BaseModel):
    finding_id: str
    action: str # "CONFIRM", "OVERRIDE", "ADD_NOTE"
    new_status: Optional[ComplianceStatus] = None
    reviewer_notes: str
    reviewer_name: str = "Officer In-Charge"
