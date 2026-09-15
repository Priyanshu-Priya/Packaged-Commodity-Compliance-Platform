from typing import List
from app.schemas.compliance import ComplianceFinding, ComplianceStatus, ComplianceSummary, ApplicabilityResult

SEVERITY_WEIGHTS = {
    "HIGH": 1.0,
    "MEDIUM": 0.6,
    "LOW": 0.3
}

class ScoringService:
    """
    Computes explainable compliance score and overall verdict from legal findings.
    """

    @staticmethod
    def calculate_summary(
        scan_id: str,
        findings: List[ComplianceFinding],
        applicability: ApplicabilityResult,
        ruleset_version: str = "PC_RULES_2011_v2023"
    ) -> ComplianceSummary:
        if not applicability.is_applicable:
            return ComplianceSummary(
                scan_id=scan_id,
                overall_verdict=ComplianceStatus.NOT_APPLICABLE,
                compliance_score=100.0,
                total_checks=len(findings),
                pass_count=sum(1 for f in findings if f.status == ComplianceStatus.PASS),
                fail_count=0,
                review_count=sum(1 for f in findings if f.status == ComplianceStatus.REVIEW_REQUIRED),
                not_applicable_count=len(findings),
                ruleset_version=ruleset_version
            )

        pass_count = 0
        fail_count = 0
        review_count = 0
        na_count = 0

        weighted_earned = 0.0
        weighted_total = 0.0

        for f in findings:
            weight = SEVERITY_WEIGHTS.get(getattr(f, "severity", "HIGH"), 1.0)

            if f.status == ComplianceStatus.PASS:
                pass_count += 1
                weighted_earned += weight * 1.0
                weighted_total += weight
            elif f.status == ComplianceStatus.FAIL:
                fail_count += 1
                weighted_earned += weight * 0.0
                weighted_total += weight
            elif f.status == ComplianceStatus.REVIEW_REQUIRED:
                review_count += 1
                # Partial credit for review items requiring physical officer gauge
                weighted_earned += weight * 0.5
                weighted_total += weight
            elif f.status == ComplianceStatus.NOT_APPLICABLE:
                na_count += 1

        if weighted_total > 0:
            score = round((weighted_earned / weighted_total) * 100.0, 1)
        else:
            score = 100.0

        # Strict Legal Metrology verdict hierarchy:
        # 1. Any statutory violation (FAIL) => Overall NON-COMPLIANT (FAIL)
        # 2. No violations but items requiring officer review => REVIEW_REQUIRED
        # 3. All items verified => PASS (COMPLIANT)
        if fail_count > 0:
            overall_verdict = ComplianceStatus.FAIL
        elif review_count > 0:
            overall_verdict = ComplianceStatus.REVIEW_REQUIRED
        else:
            overall_verdict = ComplianceStatus.PASS

        return ComplianceSummary(
            scan_id=scan_id,
            overall_verdict=overall_verdict,
            compliance_score=score,
            total_checks=len(findings),
            pass_count=pass_count,
            fail_count=fail_count,
            review_count=review_count,
            not_applicable_count=na_count,
            ruleset_version=ruleset_version
        )

scoring_service = ScoringService()
