import os
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.scan import Scan, ReviewLog
from app.schemas.ocr import OCRResult
from app.schemas.facts import ProductFacts
from app.schemas.compliance import (
    ComplianceFinding, ComplianceStatus, ComplianceSummary, ApplicabilityResult
)
from services.ocr import get_ocr_engine
from services.nlp.regex_extractor import RegexFactExtractor
from services.cv.measurements import cv_service
from services.cv.annotator import visual_annotator
from services.compliance.applicability import applicability_service
from services.compliance.evaluator import legal_evaluator
from services.compliance.scoring import scoring_service

class ScanService:
    @staticmethod
    def execute_ocr(scan: Scan, db: Session) -> Tuple[OCRResult, ProductFacts, Dict[str, Any]]:
        """
        Runs OCR, structured fact extraction, and CV measurements.
        """
        if not os.path.exists(scan.image_path):
            raise FileNotFoundError(f"Image file not found at: {scan.image_path}")

        with open(scan.image_path, "rb") as f:
            image_bytes = f.read()

        ocr_engine = get_ocr_engine()
        ocr_result: OCRResult = ocr_engine.extract(image_bytes)

        # 1. Extract structured facts from OCR tokens
        facts: ProductFacts = RegexFactExtractor.extract_facts(ocr_result)

        # 2. Run Computer Vision measurements (Rule 7 font height, Rule 8 blur/contrast, tampering)
        cv_findings = cv_service.run_full_pipeline(image_bytes, ocr_result, facts)

        # 3. Update database record
        scan.ocr_json = json.dumps(ocr_result.model_dump())
        scan.facts_json = json.dumps(facts.model_dump())
        scan.status = "FACTS_EXTRACTED"
        db.commit()
        db.refresh(scan)

        return ocr_result, facts, cv_findings

    @staticmethod
    def execute_full_pipeline(scan: Scan, db: Session) -> Tuple[OCRResult, ProductFacts, List[ComplianceFinding], ComplianceSummary]:
        """
        Complete end-to-end Legal Metrology inspection pipeline:
        Image -> OCR -> Facts -> CV -> Applicability -> Legal Rule Evaluation -> Scoring -> Visual Evidence Overlay
        """
        if not os.path.exists(scan.image_path):
            raise FileNotFoundError(f"Image file not found at: {scan.image_path}")

        with open(scan.image_path, "rb") as f:
            image_bytes = f.read()

        # Step 1: OCR
        ocr_engine = get_ocr_engine()
        ocr_result: OCRResult = ocr_engine.extract(image_bytes)

        # Step 2: Extract Facts
        facts: ProductFacts = RegexFactExtractor.extract_facts(ocr_result)

        # Step 3: Computer Vision Measurements
        cv_findings = cv_service.run_full_pipeline(image_bytes, ocr_result, facts)

        # Step 4: Statutory Applicability (Rule 3 & Rule 26)
        applicability: ApplicabilityResult = applicability_service.evaluate_applicability(
            facts=facts,
            commodity_type=scan.commodity_type
        )

        # Step 5: Deterministic Legal Metrology Rule Evaluation
        findings: List[ComplianceFinding] = legal_evaluator.evaluate(
            facts=facts,
            ocr_result=ocr_result,
            cv_findings=cv_findings,
            applicability=applicability,
            commodity_type=scan.commodity_type
        )

        # Step 6: Scoring & Overall Verdict
        summary: ComplianceSummary = scoring_service.calculate_summary(
            scan_id=scan.id,
            findings=findings,
            applicability=applicability,
            ruleset_version=scan.ruleset_version
        )

        # Step 7: Visual Evidence Overlay
        annotated_filename = f"{scan.id}_annotated.jpg"
        annotated_path = settings.ANNOTATED_DIR / annotated_filename
        try:
            visual_annotator.annotate(
                image_bytes=image_bytes,
                findings=findings,
                output_path=annotated_path
            )
            scan.annotated_image_path = str(annotated_path)
        except Exception as e:
            # Fall back without failing whole analysis if image annotation fails
            scan.annotated_image_path = None

        # Step 8: Persist to DB
        now = datetime.now(timezone.utc)
        scan.ocr_json = json.dumps(ocr_result.model_dump())
        scan.facts_json = json.dumps(facts.model_dump())
        scan.findings_json = json.dumps([f.model_dump() for f in findings])
        scan.summary_json = json.dumps(summary.model_dump())
        scan.overall_verdict = summary.overall_verdict.value
        scan.compliance_score = summary.compliance_score
        scan.status = "COMPLETED"
        scan.completed_at = now

        db.commit()
        db.refresh(scan)

        return ocr_result, facts, findings, summary

    @staticmethod
    def adjudicate_finding(
        scan: Scan,
        rule_id: str,
        updated_status: ComplianceStatus,
        notes: str,
        reviewer_name: str,
        db: Session
    ) -> Tuple[ComplianceFinding, ComplianceSummary]:
        """
        Enables an enforcement officer to review, confirm, or override an AI finding.
        Logs to audit trail and recalculates compliance score and verdict dynamically.
        """
        if not scan.findings_json:
            raise ValueError("No findings available to adjudicate for this scan")

        if isinstance(updated_status, str):
            updated_status = ComplianceStatus(updated_status)

        findings_data = json.loads(scan.findings_json)
        target_finding = None
        previous_status = None

        for item in findings_data:
            if item["rule_id"] == rule_id:
                previous_status = item["status"]
                item["status"] = updated_status.value
                item["reasoning"] += f" [Officer Overridden: {notes}]"
                target_finding = ComplianceFinding(**item)
                break

        if not target_finding:
            raise ValueError(f"Rule ID '{rule_id}' not found in scan findings")

        # Convert all to findings list for recalculation
        all_findings = [ComplianceFinding(**f) for f in findings_data]

        # Re-evaluate applicability
        facts_obj = ProductFacts(**json.loads(scan.facts_json)) if scan.facts_json else ProductFacts()
        applicability = applicability_service.evaluate_applicability(facts_obj, scan.commodity_type)

        # Recalculate summary
        updated_summary = scoring_service.calculate_summary(
            scan_id=scan.id,
            findings=all_findings,
            applicability=applicability,
            ruleset_version=scan.ruleset_version
        )

        # Record in ReviewLog
        log_entry = ReviewLog(
            scan_id=scan.id,
            rule_id=rule_id,
            previous_status=previous_status or "UNKNOWN",
            updated_status=updated_status.value,
            reviewer_name=reviewer_name or "Enforcement Officer",
            review_notes=notes,
            reviewed_at=datetime.now(timezone.utc)
        )
        db.add(log_entry)

        # Update Scan
        scan.findings_json = json.dumps([f.model_dump() for f in all_findings])
        scan.summary_json = json.dumps(updated_summary.model_dump())
        scan.overall_verdict = updated_summary.overall_verdict.value
        scan.compliance_score = updated_summary.compliance_score
        db.commit()
        db.refresh(scan)

        return target_finding, updated_summary

scan_service = ScanService()
