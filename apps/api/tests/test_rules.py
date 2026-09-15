def test_get_all_rules(client):
    response = client.get("/api/v1/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["ruleset_version"] == "PC_RULES_2011_v2023"
    assert len(data["rules"]) >= 10
    
    # Check that Rule 6(1)(a), Rule 6(1)(e) MRP, Rule 7 font size, Rule 26 exemption are present
    rule_ids = [r["rule_id"] for r in data["rules"]]
    assert "PC_RULE_6_1_A_MANUFACTURER" in rule_ids
    assert "PC_RULE_6_1_E_MRP" in rule_ids
    assert "PC_RULE_6_1_C_NET_QUANTITY" in rule_ids
    assert "PC_RULE_7_FONT_SIZE" in rule_ids
    assert "PC_RULE_26_EXEMPTIONS" in rule_ids

def test_get_rule_by_id(client):
    response = client.get("/api/v1/rules/PC_RULE_6_1_E_MRP")
    assert response.status_code == 200
    rule = response.json()
    assert rule["source_rule"] == "Rule 6(1)(e)"
    assert "Maximum Retail Price" in rule["title"]
    assert "inclusive_of_taxes_clause" in rule["required_fields"]

def test_get_rule_not_found(client):
    response = client.get("/api/v1/rules/NON_EXISTENT_RULE")
    assert response.status_code == 404

def test_get_commodities(client):
    response = client.get("/api/v1/commodities")
    assert response.status_code == 200
    commodities = response.json()
    assert len(commodities) >= 5
    ids = [c["id"] for c in commodities]
    assert "FOOD_GRAINS" in ids
    assert "EDIBLE_OILS" in ids

def test_get_exemptions(client):
    response = client.get("/api/v1/exemptions")
    assert response.status_code == 200
    exemptions = response.json()
    assert len(exemptions) >= 3
