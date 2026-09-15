import re
from typing import Optional, Dict, Any, Tuple
from datetime import datetime

class Normalizer:
    MONTH_MAP = {
        "jan": 1, "january": 1,
        "feb": 2, "february": 2,
        "mar": 3, "march": 3,
        "apr": 4, "april": 4,
        "may": 5,
        "jun": 6, "june": 6,
        "jul": 7, "july": 7,
        "aug": 8, "august": 8,
        "sep": 9, "september": 9, "sept": 9,
        "oct": 10, "october": 10,
        "nov": 11, "november": 11,
        "dec": 12, "december": 12
    }

    @staticmethod
    def normalize_currency_amount(raw_text: str) -> Optional[float]:
        """
        Extracts and normalizes numeric currency amount from strings like:
        'MRP Rs. 140.00', '₹ 120', 'Rs 99/-', '150.50'
        """
        cleaned = raw_text.replace(",", "")
        match = re.search(r"(\d+(?:\.\d{1,2})?)", cleaned)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    @classmethod
    def normalize_quantity(cls, raw_val: str, raw_unit: str) -> Dict[str, Any]:
        """
        Normalizes quantity and unit to standard metric base units (grams, milliliters, meters, units).
        """
        val_cleaned = raw_val.replace(",", "").strip()
        try:
            val = float(val_cleaned)
        except ValueError:
            return {"value": None, "unit": raw_unit, "base_value": None, "base_unit": None}

        unit_clean = raw_unit.lower().strip()
        base_val = val
        base_unit = unit_clean

        # Weight normalization to grams (g)
        if unit_clean in ["kg", "kilogram", "kgs"]:
            base_val = val * 1000.0
            base_unit = "g"
        elif unit_clean in ["g", "gm", "gms", "gram", "grams"]:
            base_val = val
            base_unit = "g"
        # Volume normalization to milliliters (ml)
        elif unit_clean in ["l", "ltr", "litre", "liter", "litres"]:
            base_val = val * 1000.0
            base_unit = "ml"
        elif unit_clean in ["ml", "millilitre", "milliliter"]:
            base_val = val
            base_unit = "ml"
        # Length normalization to meters (m)
        elif unit_clean in ["m", "meter", "metre"]:
            base_val = val
            base_unit = "m"
        elif unit_clean in ["cm", "centimeter"]:
            base_val = val / 100.0
            base_unit = "m"
        elif unit_clean in ["mm", "millimeter"]:
            base_val = val / 1000.0
            base_unit = "m"
        # Count/Unit
        elif unit_clean in ["n", "u", "unit", "units", "piece", "pieces", "nos"]:
            base_val = val
            base_unit = "N"

        return {
            "value": val,
            "unit": raw_unit,
            "base_value": round(base_val, 4),
            "base_unit": base_unit
        }

    @classmethod
    def normalize_date(cls, raw_date: str) -> Optional[Dict[str, Any]]:
        """
        Normalizes dates into month, year, and ISO format YYYY-MM.
        Handles '08/2026', '08-2026', 'AUG 2026', 'August 2026', '08/26'.
        """
        text = raw_date.strip()

        # Format 1: MM/YYYY or MM-YYYY
        m = re.search(r"\b(0?[1-9]|1[0-2])[\/\-\.](20\d{2}|\d{2})\b", text)
        if m:
            month = int(m.group(1))
            year_str = m.group(2)
            year = int(f"20{year_str}" if len(year_str) == 2 else year_str)
            return {"month": month, "year": year, "iso": f"{year:04d}-{month:02d}", "raw": raw_date}

        # Format 2: Mon YYYY (e.g. AUG 2026 or August 2026)
        m = re.search(r"\b([a-zA-Z]{3,9})\s+[\'\`]?([12]\d{3}|\d{2})\b", text)
        if m:
            mon_str = m.group(1).lower()
            year_str = m.group(2)
            year = int(f"20{year_str}" if len(year_str) == 2 else year_str)
            month = cls.MONTH_MAP.get(mon_str)
            if month:
                return {"month": month, "year": year, "iso": f"{year:04d}-{month:02d}", "raw": raw_date}

        return None

    @staticmethod
    def normalize_phone(raw_phone: str) -> str:
        """
        Normalizes phone numbers to standard format e.g. '1800-11-2233' or standard 10-digit number.
        """
        cleaned = re.sub(r"[^\d\-+]", "", raw_phone)
        return cleaned

    @staticmethod
    def normalize_pincode(text: str) -> Optional[str]:
        """
        Extracts 6-digit Indian postal code.
        """
        m = re.search(r"\b([1-9][0-9]{5})\b", text)
        return m.group(1) if m else None
