export type ComplianceStatus = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'NOT_APPLICABLE';

export interface EvidenceItem {
  evidence_type: string;
  bbox?: number[];
  text_snippet?: string;
  confidence: number;
  notes?: string;
}

export interface ComplianceFinding {
  rule_id: string;
  source_rule: string;
  category: string;
  title: string;
  status: ComplianceStatus;
  expected: string;
  detected?: string;
  confidence: number;
  reasoning: string;
  evidence: EvidenceItem[];
}

export interface ComplianceSummary {
  scan_id: string;
  overall_verdict: ComplianceStatus;
  compliance_score: number;
  total_checks: number;
  pass_count: number;
  fail_count: number;
  review_count: number;
  not_applicable_count: number;
  ruleset_version: string;
}

export interface OCRToken {
  text: string;
  confidence: number;
  bbox: number[]; // [x1, y1, x2, y2]
  line_number?: number;
}

export interface OCRResult {
  tokens: OCRToken[];
  full_text: string;
  average_confidence: number;
  image_width: number;
  image_height: number;
}

export interface FactValue {
  raw_value?: string;
  normalized_value?: any;
  confidence: number;
  source: string;
  bbox?: number[];
}

export interface ProductFacts {
  manufacturer_name?: FactValue;
  manufacturer_address?: FactValue;
  packer_name?: FactValue;
  importer_name?: FactValue;
  country_of_origin?: FactValue;
  generic_name?: FactValue;
  net_quantity_value?: FactValue;
  net_quantity_unit?: FactValue;
  unit_sale_price?: FactValue;
  mrp_value?: FactValue;
  mrp_currency?: FactValue;
  inclusive_of_taxes_clause?: FactValue;
  mfg_date?: FactValue;
  pkd_date?: FactValue;
  expiry_date?: FactValue;
  best_before?: FactValue;
  consumer_care_email?: FactValue;
  consumer_care_phone?: FactValue;
  consumer_care_address?: FactValue;
  blur_score?: number;
  is_blurry?: boolean;
  contrast_score?: number;
  estimated_font_height_mm?: number;
  tampering_detected?: boolean;
  tampering_reason?: string;
}

export interface LegalRule {
  rule_id: string;
  source_rule: string;
  category: string;
  title: string;
  description: string;
  verification_type: string;
  severity: string;
  enabled: boolean;
}

export interface LegalRuleSet {
  ruleset_version: string;
  title: string;
  effective_date: string;
  rules: LegalRule[];
}

export interface ScanItem {
  id: string;
  scan_number: string;
  commodity_type: string;
  status: string;
  overall_verdict?: ComplianceStatus;
  compliance_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface DashboardSummary {
  total_scans: number;
  pass_count: number;
  fail_count: number;
  review_required_count: number;
  compliance_rate_percent: number;
  active_rules_enforced: number;
  enforcement_jurisdiction: string;
}

export interface ReviewLogItem {
  id: string;
  scan_id: string;
  rule_id: string;
  previous_status: string;
  updated_status: string;
  reviewer_name: string;
  review_notes: string;
  reviewed_at: string;
}

