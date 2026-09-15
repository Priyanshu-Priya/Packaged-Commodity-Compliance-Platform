from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class LegalRule(BaseModel):
    rule_id: str
    source_rule: str
    category: str
    title: str
    description: str
    verification_type: str
    severity: str
    required_fields: Optional[List[str]] = None
    required_any_fields: Optional[List[str]] = None
    allowed_units: Optional[List[str]] = None
    disallowed_units: Optional[List[str]] = None
    disallowed_qualifiers: Optional[List[str]] = None
    trigger_condition: Optional[Dict[str, Any]] = None
    enabled: bool = True

class LegalRuleSet(BaseModel):
    ruleset_version: str
    title: str
    effective_date: str
    last_amended: Optional[str] = None
    rules: List[LegalRule]
