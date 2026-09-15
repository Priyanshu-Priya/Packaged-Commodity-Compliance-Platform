import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.schemas.rules import LegalRule, LegalRuleSet

class RuleRegistry:
    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or settings.LEGAL_RULES_PATH
        self.commodities_path = settings.COMMODITIES_PATH
        self.exemptions_path = settings.EXEMPTIONS_PATH
        self._ruleset: Optional[LegalRuleSet] = None
        self._commodities: List[Dict[str, Any]] = []
        self._exemptions: List[Dict[str, Any]] = []
        self.reload()

    def reload(self) -> None:
        if not self.rules_path.exists():
            raise FileNotFoundError(f"Legal rules file not found at: {self.rules_path}")

        with open(self.rules_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self._ruleset = LegalRuleSet(**data)

        if self.commodities_path.exists():
            with open(self.commodities_path, "r", encoding="utf-8") as f:
                self._commodities = json.load(f).get("commodities", [])

        if self.exemptions_path.exists():
            with open(self.exemptions_path, "r", encoding="utf-8") as f:
                self._exemptions = json.load(f).get("statutory_exemptions", [])

    def get_ruleset(self) -> LegalRuleSet:
        if not self._ruleset:
            self.reload()
        return self._ruleset

    def get_active_rules(self) -> List[LegalRule]:
        return [rule for rule in self.get_ruleset().rules if rule.enabled]

    def get_rule_by_id(self, rule_id: str) -> Optional[LegalRule]:
        for rule in self.get_ruleset().rules:
            if rule.rule_id == rule_id:
                return rule
        return None

    def get_commodities(self) -> List[Dict[str, Any]]:
        return self._commodities

    def get_exemptions(self) -> List[Dict[str, Any]]:
        return self._exemptions

# Global singleton instance
rule_registry = RuleRegistry()
