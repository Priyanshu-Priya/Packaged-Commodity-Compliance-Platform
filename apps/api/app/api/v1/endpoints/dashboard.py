from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.scan import Scan

router = APIRouter(tags=["Dashboard & Analytics"])

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns high-level compliance metrics for the enforcement dashboard.
    """
    total_scans = db.query(Scan).count()
    pass_count = db.query(Scan).filter(Scan.overall_verdict == "PASS").count()
    fail_count = db.query(Scan).filter(Scan.overall_verdict == "FAIL").count()
    review_count = db.query(Scan).filter(Scan.overall_verdict == "REVIEW_REQUIRED").count()
    
    # Calculate compliance rate
    compliance_rate = round((pass_count / total_scans * 100), 1) if total_scans > 0 else 100.0

    return {
        "total_scans": total_scans,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "review_required_count": review_count,
        "compliance_rate_percent": compliance_rate,
        "active_rules_enforced": 12,
        "enforcement_jurisdiction": "Legal Metrology Department, Government of India"
    }
