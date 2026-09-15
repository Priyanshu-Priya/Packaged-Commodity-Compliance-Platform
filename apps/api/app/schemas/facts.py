from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class FactValue(BaseModel):
    raw_value: Optional[str] = None
    normalized_value: Optional[Any] = None
    confidence: float = 0.0
    source: str = "regex" # "regex", "ner", "heuristic"
    bbox: Optional[List[float]] = None

class ProductFacts(BaseModel):
    # Rule 6(1)(a) Manufacturer/Packer/Importer
    manufacturer_name: Optional[FactValue] = None
    manufacturer_address: Optional[FactValue] = None
    packer_name: Optional[FactValue] = None
    importer_name: Optional[FactValue] = None
    country_of_origin: Optional[FactValue] = None
    
    # Rule 6(1)(b) Generic or Common Name
    generic_name: Optional[FactValue] = None
    
    # Rule 6(1)(c) Net Quantity
    net_quantity_value: Optional[FactValue] = None
    net_quantity_unit: Optional[FactValue] = None
    
    # Rule 6(1)(da) Unit Sale Price
    unit_sale_price: Optional[FactValue] = None
    
    # Rule 6(1)(e) Maximum Retail Price
    mrp_value: Optional[FactValue] = None
    mrp_currency: Optional[FactValue] = None
    inclusive_of_taxes_clause: Optional[FactValue] = None
    
    # Rule 6(1)(d) Dates
    mfg_date: Optional[FactValue] = None
    pkd_date: Optional[FactValue] = None
    expiry_date: Optional[FactValue] = None
    best_before: Optional[FactValue] = None
    
    # Rule 6(1)(n) Consumer Care
    consumer_care_email: Optional[FactValue] = None
    consumer_care_phone: Optional[FactValue] = None
    consumer_care_address: Optional[FactValue] = None
    
    # Computer Vision Measurements
    blur_score: Optional[float] = None
    is_blurry: bool = False
    contrast_ratio: Optional[float] = None
    contrast_score: Optional[float] = None
    estimated_font_height_mm: Optional[float] = None
    tampering_detected: bool = False
    tampering_reason: Optional[str] = None
    
    raw_field_map: Dict[str, Any] = Field(default_factory=dict)
