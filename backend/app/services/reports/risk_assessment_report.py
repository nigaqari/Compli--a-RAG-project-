import io
from typing import Dict, Any
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, Image, HRFlowable, KeepTogether
from reportlab.lib import colors
from app.services.pdf_report_builder import (
    create_report_document, get_report_styles, NumberedCanvas,
    BRAND_RED, BRAND_DARK, BRAND_BORDER, BRAND_LIGHT_BG, SEV_HIGH, SEV_MED, SEV_LOW
)
from app.services.chart_renderer import render_risk_breakdown_donut

def build_risk_assessment_report(data: Dict[str, Any]) -> io.BytesIO:
    buf = io.BytesIO()
    doc = create_report_document(buf)
    styles = get_report_styles()
    story = []

    # Header
    story.append(Paragraph("Risk Assessment & Mitigation Report", styles['ReportTitle']))
    story.append(Paragraph(
        f"Contract Document: <b>{data['document_name']}</b> • Type: {data['document_type'].upper()} • Total Risks: {data['total_risks']}",
        styles['ReportSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_RED, spaceBefore=2, spaceAfter=12))

    # Top Chart & Stat Box
    donut_png = render_risk_breakdown_donut(
        data.get('high_risks', 0),
        data.get('medium_risks', 0),
        data.get('low_risks', 0)
    )
    donut_img = Image(io.BytesIO(donut_png), width=2.4*72, height=1.7*72)

    stat_html = f"""
    <b>Risk Evaluation Summary:</b><br/><br/>
    • <font color='#DC2626'><b>High Severity:</b></font> {data.get('high_risks', 0)} risks<br/>
    • <font color='#D97706'><b>Medium Severity:</b></font> {data.get('medium_risks', 0)} risks<br/>
    • <font color='#16A34A'><b>Low Severity:</b></font> {data.get('low_risks', 0)} risks<br/><br/>
    <b>Overall Exposure Level:</b> {'CRITICAL' if data.get('high_risks', 0) > 0 else ('MODERATE' if data.get('medium_risks', 0) > 0 else 'LOW')}
    """
    stat_para = Paragraph(stat_html, styles['ReportBody'])

    summary_table = Table([[stat_para, donut_img]], colWidths=[280, 224])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Full Detailed Risk Section
    story.append(Paragraph("Detailed Risk Identification & Rationale", styles['SectionHeading']))

    risks = data.get('risks', [])
    if not risks:
        story.append(Paragraph("No significant legal or contractual risks were identified in this document.", styles['ReportBody']))
    else:
        for i, r in enumerate(risks, 1):
            sev = r.get('severity', 'low').lower()
            if sev == 'high':
                sev_color = SEV_HIGH
                sev_label = "HIGH RISK"
            elif sev == 'medium':
                sev_color = SEV_MED
                sev_label = "MEDIUM RISK"
            else:
                sev_color = SEV_LOW
                sev_label = "LOW RISK"

            page_info = f" • Page {r['page_number']}" if r.get('page_number') else ""

            header_text = f"<b>{i}. {r['title']}</b> ({sev_label}{page_info})"
            header_p = Paragraph(f"<font color='{sev_color.hexval()}'>{header_text}</font>", styles['SubSectionHeading'])
            body_p = Paragraph(r.get('rationale', ''), styles['ReportBody'])

            risk_block = Table([[header_p], [body_p]], colWidths=[504])
            risk_block.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                ('BOX', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
                ('LINEBEFORE', (0, 0), (0, -1), 3, sev_color),
                ('PADDING', (0, 0), (-1, -1), 7),
            ]))

            story.append(risk_block)
            story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    buf.seek(0)
    return buf
