import io
from PIL import Image, ImageDraw
from services.ocr.mock_engine import MockOCREngine
from services.ocr.preprocessor import ImagePreprocessor

def create_sample_image():
    img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "Sample Basmati Rice", fill=(0, 0, 0))
    draw.text((20, 50), "Net Qty: 1 kg", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_image_preprocessor():
    raw_bytes = create_sample_image()
    cv_img = ImagePreprocessor.decode_image(raw_bytes)
    assert cv_img.shape[0] == 300
    assert cv_img.shape[1] == 400
    
    quality = ImagePreprocessor.assess_quality(cv_img)
    assert "laplacian_variance" in quality
    assert "contrast_score" in quality
    assert "is_blurry" in quality
    assert quality["width"] == 400
    assert quality["height"] == 300

def test_mock_ocr_engine():
    raw_bytes = create_sample_image()
    engine = MockOCREngine()
    result = engine.extract(raw_bytes)
    
    assert len(result.tokens) >= 5
    assert result.average_confidence > 0.90
    assert "BASMATI" in result.full_text
    assert "Net Qty" in result.full_text
    assert "MRP" in result.full_text
    
    # Check bounding box format
    first_token = result.tokens[0]
    assert len(first_token.bbox) == 4
    assert 0.0 <= first_token.bbox[0] <= 1.0
