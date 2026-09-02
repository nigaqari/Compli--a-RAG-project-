import pytest
from app.models.compliance import FindingType, RiskSeverity, ComplianceResult, ComplianceFinding
from app.models.policy import PolicyRequirement
from app.services.scoring_service import calculate_scores

def test_perfect_compliance_score_with_no_findings():
    result = ComplianceResult(findings=[])
    comp_score, risk_score = calculate_scores(result)
    assert comp_score == 100.0
    assert risk_score == 100.0

def test_compliance_penalties_with_mandatory_missing_and_high_risk():
    req = PolicyRequirement(mandatory=True, requirement_text="Mandatory data retention policy")
    finding1 = ComplianceFinding(
        finding_type=FindingType.missing_clause,
        severity=RiskSeverity.high,
        category="data_privacy",
        description="Missing data retention clause",
        policy_requirement=req
    )
    finding2 = ComplianceFinding(
        finding_type=FindingType.policy_violation,
        severity=RiskSeverity.high,
        category="security",
        description="Unencrypted data transfer allowed",
        policy_requirement=None
    )

    result = ComplianceResult(findings=[finding1, finding2])
    comp_score, risk_score = calculate_scores(result)
    # Penalty: missing mandatory = -15, violation = -20 => 100 - 35 = 65
    assert comp_score == 65.0
    # Risk penalty: 2 * high (20) = 40 => 100 - 40 = 60
    assert risk_score == 60.0

def test_score_floor_at_zero():
    # Many high-severity violations to exceed 100 points
    findings = [
        ComplianceFinding(
            finding_type=FindingType.policy_violation,
            severity=RiskSeverity.high,
            category="security",
            description=f"Violation {i}"
        )
        for i in range(10)
    ]
    result = ComplianceResult(findings=findings)
    comp_score, risk_score = calculate_scores(result)
    assert comp_score == 0.0
    assert risk_score == 0.0
