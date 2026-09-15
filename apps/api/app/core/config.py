import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Base repository root directory (5 levels up from apps/api/app/core/config.py)
REPO_ROOT = Path(__file__).resolve().parents[4]

class Settings(BaseSettings):
    PROJECT_NAME: str = "Legal Metrology Packaged Commodity Compliance Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "dev-insecure-legal-metrology-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Dual-mode Database (SQLite for zero-config dev & demo, PostgreSQL in production)
    DATABASE_URL: str = f"sqlite:///{REPO_ROOT.as_posix()}/legal_metrology.db"
    
    # Storage Paths
    STORAGE_DIR: Path = REPO_ROOT / "storage"
    UPLOAD_DIR: Path = REPO_ROOT / "storage" / "uploads"
    EVIDENCE_DIR: Path = REPO_ROOT / "storage" / "evidence"
    REPORT_DIR: Path = REPO_ROOT / "storage" / "reports"
    ANNOTATED_DIR: Path = REPO_ROOT / "storage" / "annotated"
    
    # Authoritative Legal Metrology Rules Paths
    LEGAL_RULES_PATH: Path = REPO_ROOT / "data" / "legal" / "rules.json"
    COMMODITIES_PATH: Path = REPO_ROOT / "data" / "legal" / "commodities.json"
    EXEMPTIONS_PATH: Path = REPO_ROOT / "data" / "legal" / "exemptions.json"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # OCR Provider: "mock", "paddle", or "tesseract"
    OCR_PROVIDER: str = "mock"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(settings.ANNOTATED_DIR, exist_ok=True)
