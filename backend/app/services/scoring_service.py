from app.models.compliance import FindingType, RiskSeverity, ComplianceResult
import logging

logger = logging.getLogger(__name__)

# Weight configurations for Compliance Score (how much to penalize)
COMPLIANCE_WEIGHTS = {
    FindingType.missing_clause: {
        "mandatory": 15,
        "recommended": 7
    },
    FindingType.weak_clause: {
        "mandatory": 5,
        "recommended": 3
    },
    FindingType.conflicting_clause: {
        "mandatory": 15,
        "recommended": 7
    },
    FindingType.policy_violation: {
        "mandatory": 20,
        "recommended": 20
    }
}

# Weight configurations for Risk Score (how much to penalize based on severity)
RISK_WEIGHTS = {
    RiskSeverity.high: 20,
    RiskSeverity.medium: 8,
    RiskSeverity.low: 3
}

def calculate_scores(result: ComplianceResult) -> tuple[float, float]:
    """Calculates compliance score and risk score based on findings."""
    compliance_score = 100.0
    risk_score = 100.0

    for finding in result.findings:
        # 1. Compliance Score penalty
        is_mandatory = False
        if finding.policy_requirement:
            is_mandatory = finding.policy_requirement.mandatory
        elif finding.finding_type == FindingType.policy_violation:
            is_mandatory = True # Violations are heavily penalized
            
        weight_dict = COMPLIANCE_WEIGHTS.get(finding.finding_type)
        if weight_dict:
            penalty = weight_dict["mandatory"] if is_mandatory else weight_dict["recommended"]
            compliance_score -= penalty

        # 2. Risk Score penalty
        risk_penalty = RISK_WEIGHTS.get(finding.severity, 0)
        risk_score -= risk_penalty

    # Cap at 0
    compliance_score = max(0.0, compliance_score)
    risk_score = max(0.0, risk_score)

    return compliance_score, risk_score
