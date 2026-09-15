import io
import urllib.request
from PIL import Image

def test_live_upload():
    img = Image.new('RGB', (400, 300), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    img_bytes = buf.getvalue()

    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    parts = []
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_upload.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
    parts.append(img_bytes)
    parts.append(f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="commodity_type"\r\n\r\nFOOD_GRAINS\r\n--{boundary}--\r\n'.encode('utf-8'))
    body = b''.join(parts)

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/scans/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST'
    )

    with urllib.request.urlopen(req) as resp:
        print('Upload Status:', resp.status)
        print('Upload Result:', resp.read().decode('utf-8'))

if __name__ == '__main__':
    test_live_upload()
