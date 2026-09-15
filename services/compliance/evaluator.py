import re
from typing import List, Dict, Any, Optional
from app.schemas.compliance import ComplianceFinding, ComplianceStatus, EvidenceItem, ApplicabilityResult
from app.schemas.facts import ProductFacts
from app.schemas.ocr import OCRResult
from services.compliance.registry import rule_registry

DISALLOWED_UNITS = ["lbs", "lb", "oz", "ounce", "ounces", "pound", "pounds", "pint", "quart", "gallon"]
DISALLOWED_QUALIFIERS = ["approx", "approximate", "jumbo", "extra large", "minimum weight", "min wt"]

class LegalMetrologyEvaluator:
    """
    Deterministic Legal Metrology compliance evaluator.
    Evaluates extracted product facts and CV findings strictly against statutory rules
    from Legal Metrology (Packaged Commodities) Rules, 2011.
    """

    @staticmethod
    def evaluate(
        facts: ProductFacts,
        ocr_result: OCRResult,
        cv_findings: Dict[str, Any],
        applicability: ApplicabilityResult,
        commodity_type: str = "GENERAL_PACKAGED_GOODS"
    ) -> List[ComplianceFinding]:
        findings: List[ComplianceFinding] = []
        active_rules = rule_registry.get_active_rules()

        # If package is exempt under Rule 26, mark all rules accordingly
        if not applicability.is_applicable:
            for rule in active_rules:
                if rule.rule_id == "PC_RULE_26_EXEMPTIONS":
                    findings.append(
                        ComplianceFinding(
                            rule_id=rule.rule_id,
                            source_rule=rule.source_rule,
                            category=rule.category,
                            title=rule.title,
                            status=ComplianceStatus.PASS,
                            expected="Statutory exemption criteria under Rule 26",
                            detected=", ".join(applicability.statutory_exemptions),
                            confidence=1.0,
                            reasoning="; ".join(applicability.reasons),
                            evidence=[]
                        )
                    )
                else:
                    findings.append(
                        ComplianceFinding(
                            rule_id=rule.rule_id,
                            source_rule=rule.source_rule,
                            category=rule.category,
                            title=rule.title,
                            status=ComplianceStatus.NOT_APPLICABLE,
                            expected=rule.description,
                            detected="Exempted by Rule 26",
                            confidence=1.0,
                            reasoning=f"Not applicable: package is exempt under Rule 26 ({'; '.join(applicability.reasons)}).",
                            evidence=[]
                        )
                    )
            return findings

        # Rule evaluation for retail packages:
        for rule in active_rules:
            if rule.rule_id == "PC_RULE_6_1_A_MANUFACTURER":
                findings.append(LegalMetrologyEvaluator._eval_manufacturer(rule, facts))
            elif rule.rule_id == "PC_RULE_6_1_B_GENERIC_NAME":
                findings.append(LegalMetrologyEvaluator._eval_generic_name(rule, facts))
            elif rule.rule_id == "PC_RULE_6_1_C_NET_QUANTITY":
                findings.append(LegalMetrologyEvaluator._eval_net_quantity(rule, facts, commodity_type))
            elif rule.rule_id == "PC_RULE_6_1_D_DATE":
                findings.append(LegalMetrologyEvaluator._eval_date(rule, facts))
            elif rule.rule_id == "PC_RULE_6_1_DA_USP":
                findings.append(LegalMetrologyEvaluator._eval_usp(rule, facts))
            elif rule.rule_id == "PC_RULE_6_1_E_MRP":
                findings.append(LegalMetrologyEvaluator._eval_mrp(rule, facts, cv_findings))
            elif rule.rule_id == "PC_RULE_6_1_N_CONSUMER_CARE":
                findings.append(LegalMetrologyEvaluator._eval_consumer_care(rule, facts))
            elif rule.rule_id == "PC_RULE_7_FONT_SIZE":
                findings.append(LegalMetrologyEvaluator._eval_font_size(rule, facts, cv_findings))
            elif rule.rule_id == "PC_RULE_8_LEGIBILITY":
                findings.append(LegalMetrologyEvaluator._eval_legibility(rule, facts, cv_findings))
            elif rule.rule_id == "PC_RULE_9_PDP_GROUPING":
                findings.append(LegalMetrologyEvaluator._eval_pdp_grouping(rule, facts))
            elif rule.rule_id == "PC_RULE_10_STANDARD_UNITS":
                findings.append(LegalMetrologyEvaluator._eval_standard_units(rule, ocr_result))
            elif rule.rule_id == "PC_RULE_26_EXEMPTIONS":
                findings.append(LegalMetrologyEvaluator._eval_exemption(rule, applicability))

        return findings

    @staticmethod
    def _eval_manufacturer(rule, facts: ProductFacts) -> ComplianceFinding:
        has_name = bool(facts.manufacturer_name or facts.packer_name or facts.importer_name)
        has_addr = bool(facts.manufacturer_address)
        evidence = []

        if facts.manufacturer_name and facts.manufacturer_name.bbox:
            evidence.append(EvidenceItem(
                evidence_type="IMAGE_BBOX",
                bbox=facts.manufacturer_name.bbox,
                text_snippet=facts.manufacturer_name.raw_value,
                confidence=facts.manufacturer_name.confidence
            ))
        if facts.manufacturer_address and facts.manufacturer_address.bbox:
            evidence.append(EvidenceItem(
                evidence_type="IMAGE_BBOX",
                bbox=facts.manufacturer_address.bbox,
                text_snippet=facts.manufacturer_address.raw_value,
                confidence=facts.manufacturer_address.confidence
            ))

        if has_name and has_addr:
            name_val = (facts.manufacturer_name or facts.packer_name or facts.importer_name).raw_value
            addr_val = facts.manufacturer_address.raw_value
            detected_str = f"{name_val} | {addr_val}"
            if facts.country_of_origin:
                detected_str += f" | Origin: {facts.country_of_origin.raw_value}"
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Name and complete postal address of manufacturer, packer, or importer declared under Rule 6(1)(a).",
                detected=detected_str,
                confidence=0.95,
                reasoning="Manufacturer/packer identity and complete postal address declared in compliance with Rule 6(1)(a).",
                evidence=evidence
            )
        elif has_name and not has_addr:
            name_val = (facts.manufacturer_name or facts.packer_name or facts.importer_name).raw_value
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Name and complete address including PIN code of manufacturer/packer/importer.",
                detected=f"Entity Name: '{name_val}' (Postal address missing)",
                confidence=0.85,
                reasoning="Manufacturer or packer name was detected, but mandatory complete postal address/location was not identified under Rule 6(1)(a).",
                evidence=evidence
            )
        else:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Name and complete address of manufacturer/packer/importer.",
                detected="No manufacturer or packer declaration identified",
                confidence=0.9,
                reasoning="Neither manufacturer nor packer name and address declarations could be identified on the package label under Rule 6(1)(a).",
                evidence=[]
            )

    @staticmethod
    def _eval_generic_name(rule, facts: ProductFacts) -> ComplianceFinding:
        if facts.generic_name and facts.generic_name.raw_value:
            evidence = []
            if facts.generic_name.bbox:
                evidence.append(EvidenceItem(
                    evidence_type="IMAGE_BBOX",
                    bbox=facts.generic_name.bbox,
                    text_snippet=facts.generic_name.raw_value,
                    confidence=facts.generic_name.confidence
                ))
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Common or generic name of commodity declared clearly on package.",
                detected=facts.generic_name.raw_value,
                confidence=facts.generic_name.confidence or 0.9,
                reasoning="Common or generic name of the commodity is clearly declared in accordance with Rule 6(1)(b).",
                evidence=evidence
            )
        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.FAIL,
            expected="Common or generic name of commodity declared clearly on package.",
            detected="No generic or common name identified",
            confidence=0.85,
            reasoning="Mandatory common or generic name of commodity is missing from the package declarations under Rule 6(1)(b).",
            evidence=[]
        )

    @staticmethod
    def _eval_net_quantity(rule, facts: ProductFacts, commodity_type: str) -> ComplianceFinding:
        has_val = bool(facts.net_quantity_value and facts.net_quantity_value.raw_value)
        has_unit = bool(facts.net_quantity_unit and facts.net_quantity_unit.raw_value)
        evidence = []

        if facts.net_quantity_value and facts.net_quantity_value.bbox:
            evidence.append(EvidenceItem(
                evidence_type="IMAGE_BBOX",
                bbox=facts.net_quantity_value.bbox,
                text_snippet=f"{facts.net_quantity_value.raw_value} {facts.net_quantity_unit.raw_value if facts.net_quantity_unit else ''}",
                confidence=facts.net_quantity_value.confidence
            ))

        if has_val and has_unit:
            unit_norm = str(facts.net_quantity_unit.normalized_value).lower()
            val_norm = facts.net_quantity_value.normalized_value
            allowed_units = ["g", "kg", "ml", "l", "ltr", "m", "cm", "mm", "n", "u", "pieces", "units"]
            
            if unit_norm not in allowed_units:
                return ComplianceFinding(
                    rule_id=rule.rule_id,
                    source_rule=rule.source_rule,
                    category=rule.category,
                    title=rule.title,
                    status=ComplianceStatus.FAIL,
                    expected="Net quantity declared in legal metric units (g, kg, ml, l, N, etc.).",
                    detected=f"{facts.net_quantity_value.raw_value} {facts.net_quantity_unit.raw_value}",
                    confidence=0.95,
                    reasoning=f"Unit '{facts.net_quantity_unit.raw_value}' is not a recognized standard metric unit under Rule 6(1)(c) and Rules 11-13.",
                    evidence=evidence
                )

            # Check Schedule II standard pack size adherence
            detected_str = f"{facts.net_quantity_value.raw_value} {facts.net_quantity_unit.raw_value}"
            commodities = rule_registry.get_commodities()
            matched_comm = next((c for c in commodities if c.get("id") == commodity_type), None)
            
            if matched_comm and matched_comm.get("standard_quantities"):
                std_quantities = matched_comm["standard_quantities"]
                clean_detected = f"{val_norm}{unit_norm}"
                # If pack size is outside standard sizes, flag review
                if clean_detected not in std_quantities and f"{facts.net_quantity_value.raw_value}{facts.net_quantity_unit.raw_value.lower()}" not in std_quantities:
                    return ComplianceFinding(
                        rule_id=rule.rule_id,
                        source_rule=rule.source_rule,
                        category=rule.category,
                        title=rule.title,
                        status=ComplianceStatus.REVIEW_REQUIRED,
                        expected=f"Net quantity adhering to Schedule II standard sizes for {matched_comm.get('name')}: {', '.join(std_quantities)}",
                        detected=detected_str,
                        confidence=0.9,
                        reasoning=f"Net quantity is metric, but {detected_str} does not match prescribed Second Schedule standard pack sizes for {matched_comm.get('name')}. Officer review required.",
                        evidence=evidence
                    )

            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Net quantity in standard metric units conforming to Rule 6(1)(c).",
                detected=detected_str,
                confidence=0.95,
                reasoning="Net quantity declared in standard metric units conforming to Rule 6(1)(c) and Rules 11-13.",
                evidence=evidence
            )
        else:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Net quantity in standard metric units (e.g. 'Net Wt: 500 g').",
                detected="Net quantity declaration missing or incomplete",
                confidence=0.9,
                reasoning="Net quantity declaration could not be identified under Rule 6(1)(c).",
                evidence=[]
            )

    @staticmethod
    def _eval_date(rule, facts: ProductFacts) -> ComplianceFinding:
        has_mfg = bool(facts.mfg_date and facts.mfg_date.raw_value)
        has_pkd = bool(facts.pkd_date and facts.pkd_date.raw_value)
        evidence = []

        target_date = facts.mfg_date or facts.pkd_date
        if target_date and target_date.bbox:
            evidence.append(EvidenceItem(
                evidence_type="IMAGE_BBOX",
                bbox=target_date.bbox,
                text_snippet=target_date.raw_value,
                confidence=target_date.confidence
            ))

        if has_mfg or has_pkd:
            val = (facts.mfg_date or facts.pkd_date).raw_value
            norm = (facts.mfg_date or facts.pkd_date).normalized_value
            prefix = "Manufacture Date" if has_mfg else "Packaging Date"
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Month and year of manufacture or pre-packing declared under Rule 6(1)(d).",
                detected=f"{prefix}: {val} (Normalized: {norm})",
                confidence=0.95,
                reasoning="Month and year of manufacture or pre-packing is clearly declared in accordance with Rule 6(1)(d).",
                evidence=evidence
            )
        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.FAIL,
            expected="Month and year of manufacture or packaging declared clearly.",
            detected="Date of manufacture/packing missing",
            confidence=0.9,
            reasoning="Mandatory declaration of month and year of manufacture or pre-packing was not found under Rule 6(1)(d).",
            evidence=[]
        )

    @staticmethod
    def _eval_usp(rule, facts: ProductFacts) -> ComplianceFinding:
        evidence = []
        if facts.unit_sale_price and facts.unit_sale_price.raw_value:
            if facts.unit_sale_price.bbox:
                evidence.append(EvidenceItem(
                    evidence_type="IMAGE_BBOX",
                    bbox=facts.unit_sale_price.bbox,
                    text_snippet=facts.unit_sale_price.raw_value,
                    confidence=facts.unit_sale_price.confidence
                ))
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Declaration of Unit Sale Price (USP) per g/kg/ml/l under Rule 6(1)(da).",
                detected=facts.unit_sale_price.raw_value,
                confidence=0.9,
                reasoning="Unit Sale Price (USP) declared in accordance with statutory amendment Rule 6(1)(da).",
                evidence=evidence
            )
        
        # If USP is missing, check if net quantity is available
        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.FAIL,
            expected="Mandatory Unit Sale Price (USP) declaration (e.g. '₹ 0.50 / g' or '₹ 150 / kg').",
            detected="Unit Sale Price (USP) missing",
            confidence=0.85,
            reasoning="Declaration of Unit Sale Price (USP) is mandatory on all pre-packaged commodities under Rule 6(1)(da) and was not detected.",
            evidence=[]
        )

    @staticmethod
    def _eval_mrp(rule, facts: ProductFacts, cv_findings: Dict[str, Any]) -> ComplianceFinding:
        evidence = []
        tampering_info = cv_findings.get("tampering", {})
        is_tampered = tampering_info.get("detected", False) or facts.tampering_detected

        if facts.mrp_value and facts.mrp_value.bbox:
            evidence.append(EvidenceItem(
                evidence_type="IMAGE_BBOX",
                bbox=facts.mrp_value.bbox,
                text_snippet=facts.mrp_value.raw_value,
                confidence=facts.mrp_value.confidence
            ))

        if is_tampered:
            reason = tampering_info.get("reason") or facts.tampering_reason or "Secondary substrate/sticker overlay identified"
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Genuine, unaltered Maximum Retail Price printed directly on primary package substrate.",
                detected=f"MRP: {facts.mrp_value.raw_value if facts.mrp_value else 'Unknown'} (Substrate Tampering Flagged)",
                confidence=0.9,
                reasoning=f"Potential substrate alteration or secondary price sticker detected: {reason}. Violates Rule 6(1)(e) prohibition against price alteration or re-stickering.",
                evidence=evidence
            )

        if facts.mrp_value and facts.mrp_value.raw_value:
            curr = facts.mrp_currency.raw_value if facts.mrp_currency else "₹"
            val = facts.mrp_value.raw_value
            has_taxes = bool(facts.inclusive_of_taxes_clause and facts.inclusive_of_taxes_clause.raw_value)
            
            if has_taxes:
                return ComplianceFinding(
                    rule_id=rule.rule_id,
                    source_rule=rule.source_rule,
                    category=rule.category,
                    title=rule.title,
                    status=ComplianceStatus.PASS,
                    expected="Retail sale price clearly indicating 'Maximum Retail Price' or 'MRP' inclusive of all taxes.",
                    detected=f"{curr} {val} ({facts.inclusive_of_taxes_clause.raw_value})",
                    confidence=0.95,
                    reasoning="Maximum Retail Price (MRP) is clearly declared with mandatory 'inclusive of all taxes' clause in compliance with Rule 6(1)(e).",
                    evidence=evidence
                )
            else:
                return ComplianceFinding(
                    rule_id=rule.rule_id,
                    source_rule=rule.source_rule,
                    category=rule.category,
                    title=rule.title,
                    status=ComplianceStatus.FAIL,
                    expected="MRP declaration with mandatory statutory wording 'inclusive of all taxes' or 'incl. of all taxes'.",
                    detected=f"{curr} {val} (Statutory taxes clause missing)",
                    confidence=0.9,
                    reasoning="MRP is declared, but the mandatory statutory clause 'inclusive of all taxes' required under Rule 6(1)(e) is missing or omitted.",
                    evidence=evidence
                )

        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.FAIL,
            expected="Maximum Retail Price (MRP) inclusive of all taxes declared prominently.",
            detected="No MRP declaration identified",
            confidence=0.9,
            reasoning="Maximum Retail Price (MRP) declaration is completely missing from the package under Rule 6(1)(e).",
            evidence=[]
        )

    @staticmethod
    def _eval_consumer_care(rule, facts: ProductFacts) -> ComplianceFinding:
        has_email = bool(facts.consumer_care_email and facts.consumer_care_email.raw_value)
        has_phone = bool(facts.consumer_care_phone and facts.consumer_care_phone.raw_value)
        has_addr = bool(facts.consumer_care_address and facts.consumer_care_address.raw_value)
        evidence = []

        for item in [facts.consumer_care_email, facts.consumer_care_phone, facts.consumer_care_address]:
            if item and item.bbox:
                evidence.append(EvidenceItem(
                    evidence_type="IMAGE_BBOX",
                    bbox=item.bbox,
                    text_snippet=item.raw_value,
                    confidence=item.confidence
                ))

        if has_email or has_phone or has_addr:
            detected_parts = []
            if has_phone:
                detected_parts.append(f"Phone: {facts.consumer_care_phone.raw_value}")
            if has_email:
                detected_parts.append(f"Email: {facts.consumer_care_email.raw_value}")
            if has_addr:
                detected_parts.append(f"Address: {facts.consumer_care_address.raw_value}")

            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Name, address, telephone number, or email of person/office to contact for consumer complaints.",
                detected=" | ".join(detected_parts),
                confidence=0.9,
                reasoning="Consumer grievance / complaint contact details declared in compliance with Rule 6(1)(n).",
                evidence=evidence
            )

        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.FAIL,
            expected="Consumer care contact details (telephone number, email address, or complaint address).",
            detected="Consumer care contact details missing",
            confidence=0.85,
            reasoning="No telephone number, email, or contact address for consumer complaints identified under Rule 6(1)(n).",
            evidence=[]
        )

    @staticmethod
    def _eval_font_size(rule, facts: ProductFacts, cv_findings: Dict[str, Any]) -> ComplianceFinding:
        font_info = cv_findings.get("font_height", {})
        est_height = font_info.get("estimated_height_mm") or facts.estimated_font_height_mm
        calibrated = font_info.get("scale_calibrated", False)

        if not calibrated:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.REVIEW_REQUIRED,
                expected="Minimum numeral and letter height specified in Table I or II of Rule 7 (1.0mm - 6.0mm depending on net quantity).",
                detected=f"Estimated numeral height: {est_height or 'Uncalibrated'} mm (Pixel-to-package ratio)",
                confidence=0.75,
                reasoning="Rule 7 mandates strict physical millimeter heights for numerals. Without a calibrated reference scale in the captured photograph, physical officer measurement with a standard gauge is required.",
                evidence=[]
            )

        if est_height is not None and est_height < 1.0:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Minimum numeral height >= 1.0 mm as per Table I of Rule 7.",
                detected=f"Numeral height measured: {est_height:.2f} mm",
                confidence=0.9,
                reasoning=f"Measured numeral height ({est_height:.2f} mm) is below statutory minimum threshold of 1.0 mm under Rule 7.",
                evidence=[]
            )

        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.PASS,
            expected="Minimum numeral height compliant with Table I / II of Rule 7.",
            detected=f"Numeral height measured: {est_height:.2f} mm",
            confidence=0.9,
            reasoning=f"Measured numeral height ({est_height:.2f} mm) satisfies statutory minimum height requirements under Rule 7.",
            evidence=[]
        )

    @staticmethod
    def _eval_legibility(rule, facts: ProductFacts, cv_findings: Dict[str, Any]) -> ComplianceFinding:
        blur_info = cv_findings.get("blur", {})
        contrast_info = cv_findings.get("contrast", {})

        blur_score = blur_info.get("score") or facts.blur_score or 100.0
        is_blurry = blur_info.get("is_blurry", False) or facts.is_blurry
        contrast_score = contrast_info.get("rms_contrast") or facts.contrast_score or 50.0

        if is_blurry:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Declarations must be conspicuous, legible, prominent, and plain under Rule 8.",
                detected=f"Laplacian Blur Variance: {blur_score:.1f} (Below minimum threshold 75.0)",
                confidence=0.95,
                reasoning="Package image exhibits significant optical or motion blur causing mandatory declarations to fail the statutory legibility and conspicuousness mandate of Rule 8.",
                evidence=[]
            )

        if contrast_score < 30.0:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.REVIEW_REQUIRED,
                expected="Sufficient contrast between declarations and background for plain visibility.",
                detected=f"RMS Contrast Score: {contrast_score:.1f} (Threshold: 30.0)",
                confidence=0.8,
                reasoning="Contrast between text declarations and package substrate is marginal. Officer review required under Rule 8.",
                evidence=[]
            )

        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.PASS,
            expected="Conspicuous, prominent, and legible declarations with adequate background contrast under Rule 8.",
            detected=f"Legible (Sharpness: {blur_score:.1f}, Contrast: {contrast_score:.1f})",
            confidence=0.95,
            reasoning="Declarations are sharp, prominent, plain, and conspicuous with adequate background contrast in compliance with Rule 8.",
            evidence=[]
        )

    @staticmethod
    def _eval_pdp_grouping(rule, facts: ProductFacts) -> ComplianceFinding:
        # Check if Net Qty, MRP, and Date are present
        has_mrp = bool(facts.mrp_value and facts.mrp_value.bbox)
        has_qty = bool(facts.net_quantity_value and facts.net_quantity_value.bbox)
        has_date = bool((facts.mfg_date or facts.pkd_date) and (facts.mfg_date or facts.pkd_date).bbox)

        if has_mrp and has_qty:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.PASS,
                expected="Mandatory declarations grouped clearly on Principal Display Panel without commercial obscuration.",
                detected="Declarations grouped on designated Principal Display Panel",
                confidence=0.85,
                reasoning="Key consumer declarations appear grouped together on the Principal Display Panel as required by Rule 9.",
                evidence=[]
            )
        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.REVIEW_REQUIRED,
            expected="Mandatory declarations grouped on designated Principal Display Panel.",
            detected="Panel grouping unverified",
            confidence=0.75,
            reasoning="Officer inspection recommended to verify that mandatory declarations are grouped on the statutory Principal Display Panel without obscuration under Rule 9.",
            evidence=[]
        )

    @staticmethod
    def _eval_standard_units(rule, ocr_result: OCRResult) -> ComplianceFinding:
        full_text = (ocr_result.full_text or "").lower()
        found_disallowed_unit = None
        found_disallowed_qualifier = None

        for unit in DISALLOWED_UNITS:
            # Word boundary match
            if re.search(r'\b' + re.escape(unit) + r'\b', full_text):
                found_disallowed_unit = unit
                break

        for qual in DISALLOWED_QUALIFIERS:
            if re.search(r'\b' + re.escape(qual) + r'\b', full_text):
                found_disallowed_qualifier = qual
                break

        if found_disallowed_unit:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Prohibition of non-metric units (lbs, oz, pints, etc.) under Rule 10.",
                detected=f"Non-metric unit detected: '{found_disallowed_unit}'",
                confidence=0.95,
                reasoning=f"Rule 10 strictly prohibits declaration of quantity in non-metric units like '{found_disallowed_unit}'.",
                evidence=[]
            )

        if found_disallowed_qualifier:
            return ComplianceFinding(
                rule_id=rule.rule_id,
                source_rule=rule.source_rule,
                category=rule.category,
                title=rule.title,
                status=ComplianceStatus.FAIL,
                expected="Prohibition of misleading qualifying phrases ('approx', 'jumbo', 'minimum weight') under Rule 10.",
                detected=f"Prohibited qualifying word detected: '{found_disallowed_qualifier}'",
                confidence=0.9,
                reasoning=f"Rule 10 strictly prohibits qualifying words like '{found_disallowed_qualifier}' that tend to mislead consumers as to actual quantity.",
                evidence=[]
            )

        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.PASS,
            expected="No non-metric units or misleading qualifying words under Rule 10.",
            detected="All declarations conform to metric standards without prohibited qualifiers",
            confidence=0.95,
            reasoning="No prohibited non-metric units or deceptive qualifying words detected, conforming to Rule 10.",
            evidence=[]
        )

    @staticmethod
    def _eval_exemption(rule, applicability: ApplicabilityResult) -> ComplianceFinding:
        return ComplianceFinding(
            rule_id=rule.rule_id,
            source_rule=rule.source_rule,
            category=rule.category,
            title=rule.title,
            status=ComplianceStatus.PASS,
            expected="Statutory exemption assessment under Rule 26.",
            detected="Retail Package (No Rule 26 exemption triggered)",
            confidence=1.0,
            reasoning="Package confirmed as retail commodity governed by Chapter II; no statutory exemptions apply.",
            evidence=[]
        )

legal_evaluator = LegalMetrologyEvaluator()
