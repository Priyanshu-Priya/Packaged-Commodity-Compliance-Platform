from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router
from services.compliance.registry import rule_registry

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[Startup] Initializing Database...")
    init_db()
    print("[Startup] Loading Legal Metrology Rules...")
    ruleset = rule_registry.get_ruleset()
    print(f"[Startup] Loaded {len(ruleset.rules)} rules under {ruleset.ruleset_version}")
    yield
    # Shutdown
    print("[Shutdown] Cleaning up resources...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated compliance verification of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check
@app.get("/health", tags=["Root"])
def root_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

# Mount static storage for evidence and uploads
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
