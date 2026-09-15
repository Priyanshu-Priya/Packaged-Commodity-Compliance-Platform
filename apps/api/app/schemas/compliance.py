from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class ComplianceStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class EvidenceItem(BaseModel):
    evidence_type: str = "IMAGE_BBOX" # "IMAGE_BBOX", "TEXT_SNIPPET", "MEASUREMENT"
    bbox: Optional[List[float]] = None
    text_snippet: Optional[str] = None
    confidence: float = 1.0
    notes: Optional[str] = None

class ComplianceFinding(BaseModel):
    rule_id: str
    source_rule: str
    category: str
    title: str
    status: ComplianceStatus
    expected: str
    detected: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reasoning: str
    evidence: List[EvidenceItem] = Field(default_factory=list)

class ApplicabilityResult(BaseModel):
    is_applicable: bool = True
    chapter: str = "Chapter II (Packages Intended for Retail Sale)"
    commodity: str = "General Packaged Goods"
    reasons: List[str] = Field(default_factory=list)
    statutory_exemptions: List[str] = Field(default_factory=list)

class ComplianceSummary(BaseModel):
    scan_id: str
    overall_verdict: ComplianceStatus
    compliance_score: float = Field(ge=0.0, le=100.0)
    total_checks: int
    pass_count: int
    fail_count: int
    review_count: int
    not_applicable_count: int
    ruleset_version: str

class ReviewRequest(BaseModel):
    rule_id: str
    status: ComplianceStatus
    notes: str
    reviewer_name: Optional[str] = "Enforcement Officer"

