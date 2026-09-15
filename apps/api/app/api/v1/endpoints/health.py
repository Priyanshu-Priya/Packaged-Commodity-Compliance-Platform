from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from services.compliance.registry import rule_registry

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    rules_count = len(rule_registry.get_active_rules())
    
    return {
        "status": "ready" if (db_ok and rules_count > 0) else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "active_legal_rules": rules_count,
        "storage_ready": settings.STORAGE_DIR.exists()
    }
