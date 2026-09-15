import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure root and apps/api are in python path
CURRENT = Path(__file__).resolve()
API_ROOT = CURRENT.parent.parent
ROOT = CURRENT.parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(API_ROOT))

from app.main import app
from app.core.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
