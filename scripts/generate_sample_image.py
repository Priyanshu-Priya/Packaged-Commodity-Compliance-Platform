import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def generate_sample_package(dest_path: str):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    # Create a realistic 800x1000 packaged commodity label (Royal Basmati Rice)
    width, height = 800, 1000
    img = Image.new("RGB", (width, height), color="#0D1B2A") # Deep navy package background
    draw = ImageDraw.Draw(img)

    # Outer decorative border (gold)
    draw.rectangle([20, 20, width - 20, height - 20], outline="#D4AF37", width=4)
    draw.rectangle([30, 30, width - 30, height - 30], outline="#D4AF37", width=1)

    # Top Brand & Common Name
    draw.text((width // 2, 90), "HIMALAYAN HERITAGE", fill="#D4AF37", anchor="mm")
    draw.text((width // 2, 140), "PREMIUM BASMATI RICE", fill="#FFFFFF", anchor="mm")
    draw.text((width // 2, 180), "Traditional Long Grain Aged Rice", fill="#94A3B8", anchor="mm")

    # Grouped Declarations Panel (Principal Display Panel - PDP)
    panel_top = 240
    draw.rectangle([60, panel_top, width - 60, height - 80], fill="#1E293B", outline="#334155", width=2)

    lines = [
        ("MANDATORY LEGAL METROLOGY DECLARATIONS", "#F1C40F", 280),
        ("Generic Name: Basmati Rice (Agricultural Produce)", "#E2E8F0", 330),
        ("Net Quantity: 1 kg", "#38BDF8", 380),
        ("Maximum Retail Price (MRP): Rs. 140.00", "#4ADE80", 430),
        ("(Inclusive of all taxes)", "#4ADE80", 470),
        ("Unit Sale Price (USP): Rs. 140.00 per kg", "#FCD34D", 520),
        ("Month & Year of Packaging: 08/2026", "#E2E8F0", 570),
        ("Best Before: 24 Months from Packaging", "#94A3B8", 610),
        ("Manufactured & Packed By:", "#F1C40F", 670),
        ("Himalayan Foods Pvt. Ltd.", "#FFFFFF", 710),
        ("Plot 42, Okhla Industrial Area Phase-III, New Delhi - 110020", "#CBD5E1", 750),
        ("Country of Origin: India", "#E2E8F0", 790),
        ("Consumer Care: 1800-11-2233 | care@himalayanfoods.com", "#38BDF8", 850),
    ]

    for text, color, y_pos in lines:
        draw.text((width // 2, y_pos), text, fill=color, anchor="mm")

    img.save(dest_path, format="JPEG", quality=95)
    print(f"[Sample Image] Generated packaged commodity image at: {dest_path}")

if __name__ == "__main__":
    generate_sample_package("data/golden/samples/sample_rice.jpg")
