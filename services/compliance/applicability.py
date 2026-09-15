import re
from typing import List, Optional
from app.schemas.compliance import ApplicabilityResult
from app.schemas.facts import ProductFacts
from services.compliance.registry import rule_registry

class ApplicabilityService:
    """
    Determines statutory applicability under Legal Metrology (Packaged Commodities) Rules, 2011.
    Evaluates Rule 3 (Retail Packages) and Rule 26 (Statutory Exemptions).
    """

    @staticmethod
    def evaluate_applicability(
        facts: ProductFacts,
        commodity_type: str = "GENERAL_PACKAGED_GOODS",
        is_institutional: bool = False,
        is_fast_food: bool = False,
        is_drug: bool = False
    ) -> ApplicabilityResult:
        exemptions_data = rule_registry.get_exemptions()
        reasons: List[str] = []
        statutory_exemptions: List[str] = []
        is_applicable = True

        # 1. Rule 3 Explanation - Industrial or Institutional Consumers
        if is_institutional:
            is_applicable = False
            statutory_exemptions.append("EXEMPT_INSTITUTIONAL_INDUSTRIAL")
            reasons.append(
                "Rule 3 Explanation: Packages intended for institutional or industrial consumers "
                "for direct use and not for retail sale are exempt from Chapter II."
            )
            return ApplicabilityResult(
                is_applicable=False,
                chapter="Exempted from Chapter II",
                commodity=commodity_type,
                reasons=reasons,
                statutory_exemptions=statutory_exemptions
            )

        # 2. Rule 26(b) - Fast Food items packed by restaurant/hotel
        if is_fast_food or commodity_type == "RESTAURANT_FAST_FOOD":
            is_applicable = False
            statutory_exemptions.append("EXEMPT_RULE_26_B_HOTEL_RESTAURANT")
            reasons.append(
                "Rule 26(b): Fast food items packed by a restaurant or hotel for counter service "
                "are exempt from Chapter II requirements."
            )
            return ApplicabilityResult(
                is_applicable=False,
                chapter="Exempted from Chapter II",
                commodity=commodity_type,
                reasons=reasons,
                statutory_exemptions=statutory_exemptions
            )

        # 3. Rule 26(c) - Drugs under DPCO 1995
        if is_drug or commodity_type == "DRUGS_DPCO":
            is_applicable = False
            statutory_exemptions.append("EXEMPT_RULE_26_C_DRUGS")
            reasons.append(
                "Rule 26(c): Scheduled and non-scheduled formulations covered under the "
                "Drugs (Prices Control) Order, 1995 are governed separately and exempt from Chapter II."
            )
            return ApplicabilityResult(
                is_applicable=False,
                chapter="Exempted from Chapter II",
                commodity=commodity_type,
                reasons=reasons,
                statutory_exemptions=statutory_exemptions
            )

        # 4. Rule 26(a) - Weight/Volume <= 10g or <= 10ml (except tobacco)
        is_tobacco = bool(
            commodity_type in ["TOBACCO", "CIGARETTES", "BIDI"] or
            (facts.generic_name and any(t in facts.generic_name.raw_value.lower() for t in ["tobacco", "bidi", "cigarette", "gutkha", "khaini"]))
        )

        net_val = facts.net_quantity_value.normalized_value if facts.net_quantity_value else None
        net_unit = facts.net_quantity_unit.normalized_value if facts.net_quantity_unit else None

        if net_val is not None and net_unit in ["g", "ml"]:
            if float(net_val) <= 10.0 and not is_tobacco:
                is_applicable = False
                statutory_exemptions.append("EXEMPT_RULE_26_A_WEIGHT_OR_VOL")
                reasons.append(
                    f"Rule 26(a): Net quantity declared is {net_val}{net_unit} (<= 10{net_unit}), "
                    "which is exempt from Chapter II declarations (non-tobacco commodity)."
                )
                return ApplicabilityResult(
                    is_applicable=False,
                    chapter="Exempted from Chapter II",
                    commodity=commodity_type,
                    reasons=reasons,
                    statutory_exemptions=statutory_exemptions
                )

        # 5. Rule 26(d) - Agricultural produce exceeding 50 kg
        is_agri = commodity_type in ["FOOD_GRAINS", "AGRICULTURAL_PRODUCE"]
        if is_agri and net_val is not None and net_unit == "g":
            # 50 kg = 50,000 g
            if float(net_val) > 50000.0:
                is_applicable = False
                statutory_exemptions.append("EXEMPT_RULE_26_D_AGRI_50KG")
                reasons.append(
                    f"Rule 26(d): Agricultural produce package exceeds 50 kg (detected {float(net_val)/1000.0} kg), "
                    "which is exempt under Rule 26(d)."
                )
                return ApplicabilityResult(
                    is_applicable=False,
                    chapter="Exempted from Chapter II",
                    commodity=commodity_type,
                    reasons=reasons,
                    statutory_exemptions=statutory_exemptions
                )

        # If no exemption triggered, Chapter II is fully applicable
        reasons.append(
            "Package qualifies as a pre-packaged commodity intended for retail sale under Rule 3. "
            "Chapter II (Rules 3 to 23) is fully applicable."
        )

        return ApplicabilityResult(
            is_applicable=True,
            chapter="Chapter II (Packages Intended for Retail Sale)",
            commodity=commodity_type,
            reasons=reasons,
            statutory_exemptions=[]
        )

applicability_service = ApplicabilityService()
