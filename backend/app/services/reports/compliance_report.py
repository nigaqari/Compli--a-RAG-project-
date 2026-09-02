import io
from typing import Dict, Any
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
from reportlab.lib import colors
from app.services.pdf_report_builder import (
    create_report_document, get_report_styles, NumberedCanvas,
    BRAND_RED, BRAND_DARK, BRAND_BORDER, BRAND_LIGHT_BG, SEV_HIGH, SEV_MED, SEV_LOW
)
from app.services.chart_renderer import render_compliance_score_gauge

def build_compliance_report(data: Dict[str, Any]) -> io.BytesIO:
    buf = io.BytesIO()
    doc = create_report_document(buf)
    styles = get_report_styles()
    story = []

    # Title & Subtitle
    story.append(Paragraph("Policy Compliance Evaluation Report", styles['ReportTitle']))
    story.append(Paragraph(
        f"Contract: <b>{data['document_name']}</b> • Policy: <b>{data['policy_name']} (v{data['policy_version']})</b> • Evaluated: {data['evaluated_at']}",
        styles['ReportSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_RED, spaceBefore=2, spaceAfter=12))

    # Summary Metrics Row (Score cards + Gauge Chart)
    gauge_png = render_compliance_score_gauge(data.get('compliance_score', 100))
    gauge_img = Image(io.BytesIO(gauge_png), width=2.4*72, height=1.5*72)

    score_val = int(data.get('compliance_score', 100))
    risk_val = int(data.get('risk_score', 0))

    score_color_hex = '#16A34A' if score_val >= 75 else ('#D97706' if score_val >= 50 else '#DC2626')

    metric_html = f"""
    <b>Compliance Score:</b> <font color='{score_color_hex}' size='14'><b>{score_val}%</b></font><br/>
    <b>Risk Exposure:</b> <font color='#DC2626' size='12'><b>{risk_val}%</b></font><br/>
    <b>Policy Category:</b> {data['policy_category'].replace('_', ' ').title()}<br/>
    <b>Total Gaps / Findings:</b> {data.get('total_findings', 0)}
    """
    metric_para = Paragraph(metric_html, styles['ReportBody'])

    top_summary_table = Table([
        [metric_para, gauge_img]
    ], colWidths=[280, 224])
    top_summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(top_summary_table)
    story.append(Spacer(1, 14))

    # Findings Grouped by Type
    story.append(Paragraph("Compliance Findings by Category", styles['SectionHeading']))

    finding_labels = {
        "missing_clause": "Missing Mandatory & Recommended Clauses",
        "conflicting_clause": "Conflicting Contract Clauses",
        "weak_clause": "Weak / Insufficient Clauses",
        "policy_violation": "Direct Policy Violations"
    }

    findings_by_type = data.get('findings_by_type', {})
    has_any_finding = False

    for ftype, flist in findings_by_type.items():
        if not flist:
            continue
        has_any_finding = True
        label = finding_labels.get(ftype, ftype.replace('_', ' ').title())

        story.append(Paragraph(f"<b>{label} ({len(flist)})</b>", styles['SubSectionHeading']))

        table_data = [[
            Paragraph("Category", styles['TableHeader']),
            Paragraph("Finding Description", styles['TableHeader']),
            Paragraph("Severity", styles['TableHeader']),
            Paragraph("Policy Requirement Checked", styles['TableHeader'])
        ]]

        for f in flist:
            sev = f.get('severity', 'low').lower()
            if sev == 'high':
                sev_p = Paragraph("HIGH", styles['BadgeHigh'])
            elif sev == 'medium':
                sev_p = Paragraph("MED", styles['BadgeMed'])
            else:
                sev_p = Paragraph("LOW", styles['BadgeLow'])

            cat_p = Paragraph(f.get('category', '').replace('_', ' ').title(), styles['TableCell'])
            desc_p = Paragraph(f.get('description', ''), styles['TableCell'])
            req_p = Paragraph(f.get('policy_requirement') or "—", styles['TableCell'])

            table_data.append([cat_p, desc_p, sev_p, req_p])

        t = Table(table_data, colWidths=[90, 194, 45, 175])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_DARK),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG])
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    if not has_any_finding:
        story.append(Paragraph("<b>No compliance gaps detected.</b> The document satisfies all evaluated policy requirements.", styles['ReportBody']))
        story.append(Spacer(1, 10))

    # Suggestions / Action Plan
    suggestions = data.get('suggestions', [])
    if suggestions:
        story.append(Spacer(1, 6))
        story.append(Paragraph("Actionable Recommendations for Remediation", styles['SectionHeading']))
        for i, s in enumerate(suggestions, 1):
            story.append(Paragraph(f"<b>{i}.</b> {s}", styles['ReportBody']))

    doc.build(story, canvasmaker=NumberedCanvas)
    buf.seek(0)
    return buf
