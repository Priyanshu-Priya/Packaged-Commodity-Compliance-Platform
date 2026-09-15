import io
from PIL import Image, ImageDraw

def create_dummy_jpeg():
    img = Image.new("RGB", (300, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), "Basmati Rice 1kg", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def test_scan_upload_and_analyze_lifecycle(client):
    # 1. Upload scan
    img_buf = create_dummy_jpeg()
    files = {"file": ("test_package.jpg", img_buf, "image/jpeg")}
    data = {"commodity_type": "FOOD_GRAINS"}

    upload_res = client.post("/api/v1/scans/upload", files=files, data=data)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert "scan_id" in upload_data
    assert upload_data["status"] == "UPLOADED"
    scan_id = upload_data["scan_id"]

    # 2. Before analyze, /ocr should return 400
    ocr_before = client.get(f"/api/v1/scans/{scan_id}/ocr")
    assert ocr_before.status_code == 400

    # 3. Analyze scan (run OCR + Facts Extraction)
    analyze_res = client.post(f"/api/v1/scans/{scan_id}/analyze")
    assert analyze_res.status_code == 200
    analyze_data = analyze_res.json()
    assert analyze_data["status"] in ["FACTS_EXTRACTED", "COMPLETED"]
    assert analyze_data["tokens_extracted"] > 0
    assert "facts" in analyze_data

    # 4. Fetch OCR results
    ocr_after = client.get(f"/api/v1/scans/{scan_id}/ocr")
    assert ocr_after.status_code == 200
    ocr_data = ocr_after.json()
    assert "tokens" in ocr_data
    assert len(ocr_data["tokens"]) > 0
    assert "full_text" in ocr_data

    # 5. Fetch Facts results
    facts_after = client.get(f"/api/v1/scans/{scan_id}/facts")
    assert facts_after.status_code == 200
    facts_data = facts_after.json()
    assert isinstance(facts_data, dict)

    # 6. Fetch image file
    img_res = client.get(f"/api/v1/scans/{scan_id}/image")
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] in ["image/jpeg", "image/jpg"]

def test_upload_invalid_mime(client):
    fake_txt = io.BytesIO(b"Not an image")
    files = {"file": ("malicious.txt", fake_txt, "text/plain")}
    res = client.post("/api/v1/scans/upload", files=files)
    assert res.status_code == 400
    assert "Unsupported image format" in res.json()["detail"]
