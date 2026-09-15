#!/usr/bin/env python3
"""
Single-command launcher for Legal Metrology Packaged Commodity Compliance Platform.
Starts FastAPI backend server and Vite React frontend concurrently with unified logging.
"""
import sys
import subprocess
import time
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def run():
    print("=" * 70)
    print("   LEGAL METROLOGY PACKAGED COMMODITY COMPLIANCE PLATFORM")
    print("   Standards of Weights & Measures Enforcement Division")
    print("=" * 70)
    
    # 1. Start FastAPI backend
    backend_cmd = [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--app-dir", "apps/api",
        "--reload"
    ]
    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(ROOT))

    # 2. Start Vite frontend
    frontend_dir = ROOT / "apps" / "web"
    is_windows = sys.platform.startswith("win")
    npm_cmd = "npm.cmd" if is_windows else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    print("[2/2] Starting React Vite Frontend on http://localhost:5173 ...\n")
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(frontend_dir))

    print("-" * 70)
    print("  Application URLs:")
    print("    Frontend UI:           http://localhost:5173/")
    print("    Backend API Docs:      http://127.0.0.1:8000/docs")
    print("    Inspection Ledger:     http://localhost:5173/ (Dashboard)")
    print("    API Health Check:      http://127.0.0.1:8000/api/v1/health")
    print("-" * 70)
    print("  Press Ctrl+C to stop both servers.\n")

    def cleanup(sig=None, frame=None):
        print("\n[Shutdown] Stopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
            frontend_proc.kill()
        print("[Shutdown] All servers stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            time.sleep(1)
            # Monitor health of processes
            if backend_proc.poll() is not None:
                print("[Error] Backend process exited unexpectedly.")
                cleanup()
            if frontend_proc.poll() is not None:
                print("[Error] Frontend process exited unexpectedly.")
                cleanup()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    run()
