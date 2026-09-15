import urllib.request
import json

def test_endpoints():
    print("--- 1. Testing Frontend (Vite) ---")
    try:
        with urllib.request.urlopen("http://localhost:5173/") as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            print(f"Status: {resp.status}, HTML length: {len(content)}")
            assert "<title>Legal Metrology" in content or "vite" in content.lower()
            print(" Frontend serving successfully!")
    except Exception as e:
        print(f" Frontend error: {e}")

    print("\n--- 2. Testing Backend Scans Ledger ---")
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/api/v1/scans") as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Status: {resp.status}, Total Scans: {data.get('total')}")
            for s in data.get('scans', []):
                print(f"  * {s['scan_number']}: Verdict={s['overall_verdict']}, Score={s['compliance_score']}%, Status={s['status']}")
            first_scan_id = data['scans'][0]['id']
    except Exception as e:
        print(f" Scans ledger error: {e}")
        return

    print("\n--- 3. Testing Scan Details & Findings ---")
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1/scans/{first_scan_id}") as resp:
            scan_detail = json.loads(resp.read().decode('utf-8'))
            findings = scan_detail.get('findings', [])
            print(f"Status: {resp.status}, Scan {scan_detail['scan_number']} has {len(findings)} findings")
            for f in findings[:4]:
                print(f"  * {f['source_rule']} ({f['title']}): {f['status']}")
    except Exception as e:
        print(f" Scan details error: {e}")

    print("\n--- 4. Testing PDF Report Generation ---")
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1/scans/{first_scan_id}/report/pdf") as resp:
            pdf_bytes = resp.read()
            print(f"Status: {resp.status}, Content-Type: {resp.headers.get('Content-Type')}")
            print(f"PDF Size: {len(pdf_bytes)} bytes, Magic Header: {pdf_bytes[:4]}")
            assert pdf_bytes.startswith(b"%PDF")
            print(" PDF Inspection Certificate verified!")
    except Exception as e:
        print(f" PDF generation error: {e}")

    print("\n--- 5. Testing Officer Adjudication API ---")
    try:
        req_data = json.dumps({
            "rule_id": "PC_RULE_6_1_E_MRP",
            "status": "PASS",
            "notes": "Verified by Enforcement Officer with tax invoice and primary substrate inspection.",
            "reviewer_name": "Chief Inspector V. Patel"
        }).encode('utf-8')
        req = urllib.request.Request(
            f"http://127.0.0.1:8000/api/v1/scans/{first_scan_id}/review",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode('utf-8'))
            print(f"Adjudication response: rule_id={res_json.get('rule_id')}, new status={res_json.get('status')}")
            print(f"Recalculated overall verdict: {res_json.get('overall_verdict')}, score: {res_json.get('compliance_score')}%")

        # Check reviews audit endpoint
        with urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1/scans/{first_scan_id}/reviews") as resp:
            reviews = json.loads(resp.read().decode('utf-8'))
            print(f"Audit trail logs: {len(reviews)} entries")
            print(f"Latest log: {reviews[0]['reviewer_name']} -> {reviews[0]['review_notes']}")
            print(" Adjudication and Audit Trail verified!")
    except Exception as e:
        print(f" Adjudication error: {e}")

if __name__ == "__main__":
    test_endpoints()
