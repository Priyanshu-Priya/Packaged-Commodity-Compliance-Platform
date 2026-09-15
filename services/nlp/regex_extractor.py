import re
from typing import Optional, List, Dict, Any, Tuple
from app.schemas.ocr import OCRResult, OCRToken
from app.schemas.facts import ProductFacts, FactValue
from services.nlp.normalizer import Normalizer

class RegexFactExtractor:
    @classmethod
    def extract_facts(cls, ocr_result: OCRResult) -> ProductFacts:
        facts = ProductFacts()
        full_text = ocr_result.full_text
        tokens = ocr_result.tokens

        # Helper to find token containing pattern and return (raw_match, token)
        def find_in_tokens(pattern: str) -> Optional[Tuple[str, OCRToken]]:
            regex = re.compile(pattern, re.IGNORECASE)
            for t in tokens:
                m = regex.search(t.text)
                if m:
                    return m.group(0), t
            return None

        # -------------------------------------------------------------
        # 1. Rule 6(1)(e) - Maximum Retail Price (MRP) & Taxes
        # -------------------------------------------------------------
        mrp_pattern = r"(?:MRP|M\.R\.P\.?|MAX(?:IMUM)?\s*RETAIL\s*PRICE|PRICE|R\.S\.?|RS\.?|₹)\s*[:\-]?\s*([₹Rs\.]*\s*\d+(?:[\.,]\d{1,2})?)"
        mrp_match = re.search(mrp_pattern, full_text, re.IGNORECASE)
        if mrp_match:
            raw_mrp_snippet = mrp_match.group(0)
            numeric_val = Normalizer.normalize_currency_amount(raw_mrp_snippet)
            
            # Locate corresponding token for bbox and confidence
            matched_token = None
            for t in tokens:
                if re.search(r"MRP|M\.R\.P|₹|RETAIL\s*PRICE", t.text, re.IGNORECASE):
                    matched_token = t
                    break

            if numeric_val is not None:
                facts.mrp_value = FactValue(
                    raw_value=raw_mrp_snippet,
                    normalized_value=numeric_val,
                    confidence=matched_token.confidence if matched_token else 0.95,
                    source="regex",
                    bbox=matched_token.bbox if matched_token else None
                )
                facts.mrp_currency = FactValue(
                    raw_value="INR",
                    normalized_value="INR",
                    confidence=0.99,
                    source="regex"
                )

        # Inclusive of all taxes check
        tax_pattern = r"(?:incl(?:usive)?\s*(?:of)?\s*(?:all)?\s*taxes|incl\.?\s*of\s*all\s*taxes)"
        tax_match = re.search(tax_pattern, full_text, re.IGNORECASE)
        if tax_match:
            facts.inclusive_of_taxes_clause = FactValue(
                raw_value=tax_match.group(0),
                normalized_value=True,
                confidence=0.96,
                source="regex"
            )

        # -------------------------------------------------------------
        # 2. Rule 6(1)(c) - Net Quantity & Units
        # -------------------------------------------------------------
        qty_pattern = r"(?:Net\s*(?:Qty|Quantity|Weight|Wt\.?)|Volume)\s*[:\-]?\s*(\d+(?:[\.,]\d+)?)\s*([a-zA-Z]+)"
        qty_match = re.search(qty_pattern, full_text, re.IGNORECASE)
        
        # Fallback to standalone quantity: e.g. "1 kg", "500 g", "250 ml", "1 L"
        if not qty_match:
            qty_pattern_fallback = r"\b(\d+(?:[\.,]\d+)?)\s*(kg|g|gm|gms|ml|l|ltr|litre|meter|cm|mm|units?|pieces?)\b"
            qty_match = re.search(qty_pattern_fallback, full_text, re.IGNORECASE)

        if qty_match:
            raw_val_str = qty_match.group(1)
            raw_unit_str = qty_match.group(2)
            norm_qty = Normalizer.normalize_quantity(raw_val_str, raw_unit_str)

            matched_token = None
            for t in tokens:
                if re.search(r"Net\s*(?:Qty|Quantity|Weight)|" + re.escape(raw_val_str), t.text, re.IGNORECASE):
                    matched_token = t
                    break

            if norm_qty["value"] is not None:
                facts.net_quantity_value = FactValue(
                    raw_value=raw_val_str,
                    normalized_value=norm_qty["base_value"],
                    confidence=matched_token.confidence if matched_token else 0.95,
                    source="regex",
                    bbox=matched_token.bbox if matched_token else None
                )
                facts.net_quantity_unit = FactValue(
                    raw_value=raw_unit_str,
                    normalized_value=norm_qty["base_unit"],
                    confidence=matched_token.confidence if matched_token else 0.95,
                    source="regex"
                )

        # -------------------------------------------------------------
        # 3. Rule 6(1)(da) - Unit Sale Price (USP)
        # -------------------------------------------------------------
        usp_pattern = r"(?:USP|Unit\s*Sale\s*Price)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*([a-zA-Z0-9]+)"
        usp_match = re.search(usp_pattern, full_text, re.IGNORECASE)
        if usp_match:
            facts.unit_sale_price = FactValue(
                raw_value=usp_match.group(0),
                normalized_value={"amount": float(usp_match.group(1)), "unit_basis": usp_match.group(2)},
                confidence=0.94,
                source="regex"
            )

        # -------------------------------------------------------------
        # 4. Rule 6(1)(d) - Dates (Mfg / Pkd / Expiry / Best Before)
        # -------------------------------------------------------------
        date_pattern = r"(?:Mfd|Mfg|Packed|Pkd|Date\s*of\s*Pkg|Pkg|Packaging)(?:\.)?(?:\s*Date)?\s*[:\.\-]?\s*([01]?\d[\/\-\.](?:20)?\d{2}|[a-zA-Z]{3,9}\s*(?:20)?\d{2})"
        date_match = re.search(date_pattern, full_text, re.IGNORECASE)
        if date_match:
            raw_date = date_match.group(1)
            norm_date = Normalizer.normalize_date(raw_date)
            facts.mfg_date = FactValue(
                raw_value=raw_date,
                normalized_value=norm_date["iso"] if norm_date else raw_date,
                confidence=0.95,
                source="regex"
            )

        # Best before pattern
        bb_pattern = r"(?:Best\s*Before|Use\s*By|Expiry\s*Date|Exp\.?\s*Date)\s*[:\.]?\s*([^\n\r]+)"
        bb_match = re.search(bb_pattern, full_text, re.IGNORECASE)
        if bb_match:
            facts.best_before = FactValue(
                raw_value=bb_match.group(0).strip(),
                normalized_value=bb_match.group(1).strip(),
                confidence=0.92,
                source="regex"
            )

        # -------------------------------------------------------------
        # 5. Rule 6(1)(a) - Manufacturer / Packer / Address / Origin
        # -------------------------------------------------------------
        mfg_name_pattern = r"(?:Mfg\.?\s*(?:&|and)?\s*Packed\s*By|Manufactured\s*(?:&|and)?\s*Packed\s*By|Manufactured\s*By|Marketed\s*By)\s*[:\.]?\s*([^\n\r]+)"
        mfg_match = re.search(mfg_name_pattern, full_text, re.IGNORECASE)
        if mfg_match:
            company_name = mfg_match.group(1).strip()
            # If the header was captured with the company name on next line, resolve from token list
            if len(company_name) < 3:
                for idx, t in enumerate(tokens):
                    if re.search(r"Manufactured|Packed\s*By", t.text, re.IGNORECASE) and idx + 1 < len(tokens):
                        company_name = tokens[idx + 1].text
                        break

            facts.manufacturer_name = FactValue(
                raw_value=company_name,
                normalized_value=company_name,
                confidence=0.92,
                source="regex"
            )

        # Address & Pincode
        pincode = Normalizer.normalize_pincode(full_text)
        if pincode:
            # Find the line/token containing the pincode to extract full address
            address_snippet = None
            for t in tokens:
                if pincode in t.text:
                    address_snippet = t.text
                    break
            
            facts.manufacturer_address = FactValue(
                raw_value=address_snippet or f"Pincode: {pincode}",
                normalized_value={"pincode": pincode, "full_address": address_snippet or ""},
                confidence=0.96,
                source="regex"
            )

        # Country of Origin
        origin_match = re.search(r"(?:Country\s*of\s*Origin|Made\s*in)\s*[:\-]?\s*([a-zA-Z]+)", full_text, re.IGNORECASE)
        if origin_match:
            country = origin_match.group(1).strip().title()
            facts.country_of_origin = FactValue(
                raw_value=origin_match.group(0),
                normalized_value=country,
                confidence=0.98,
                source="regex"
            )

        # -------------------------------------------------------------
        # 6. Rule 6(1)(b) - Generic Name
        # -------------------------------------------------------------
        generic_match = re.search(r"(?:Generic\s*Name|Common\s*Name|Product)\s*[:\-]?\s*([^\n\r\(\)]+)", full_text, re.IGNORECASE)
        if generic_match:
            gen_name = generic_match.group(1).strip()
            facts.generic_name = FactValue(
                raw_value=gen_name,
                normalized_value=gen_name,
                confidence=0.90,
                source="regex"
            )
        elif len(tokens) > 0:
            # First or prominent token is often product generic/brand name
            candidate = tokens[0].text
            facts.generic_name = FactValue(
                raw_value=candidate,
                normalized_value=candidate,
                confidence=0.75,
                source="heuristic"
            )

        # -------------------------------------------------------------
        # 7. Rule 6(1)(n) - Consumer Care (Phone, Email, Contact)
        # -------------------------------------------------------------
        # Email
        email_match = re.search(r"\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b", full_text)
        if email_match:
            facts.consumer_care_email = FactValue(
                raw_value=email_match.group(1),
                normalized_value=email_match.group(1).lower(),
                confidence=0.99,
                source="regex"
            )

        # Phone / Toll-free: 1800-XXX-XXXX or standard 10-digit number
        phone_match = re.search(r"(?:(?:Toll\s*Free|Phone|Tel|Customer\s*Care|Contact)\s*[:\.]?\s*)?(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\+?91[-\s]?[6-9]\d{9}|0\d{2,4}[-\s]?\d{6,8})\b", full_text, re.IGNORECASE)
        if phone_match:
            phone_num = Normalizer.normalize_phone(phone_match.group(1))
            facts.consumer_care_phone = FactValue(
                raw_value=phone_match.group(0),
                normalized_value=phone_num,
                confidence=0.96,
                source="regex"
            )

        return facts
