import io
from typing import Dict, Any
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
from reportlab.lib import colors
from app.services.pdf_report_builder import (
    create_report_document, get_report_styles, NumberedCanvas,
    BRAND_RED, BRAND_DARK, BRAND_BORDER, BRAND_LIGHT_BG, SEV_HIGH, SEV_MED, SEV_LOW
)

def build_complete_analysis_report(data: Dict[str, Any]) -> io.BytesIO:
    buf = io.BytesIO()
    doc = create_report_document(buf)
    styles = get_report_styles()
    story = []

    exec_data = data.get('executive', {})
    risk_data = data.get('risks', {})
    clauses = data.get('clauses', [])
    recommendations = data.get('recommendations', [])
    compliance = data.get('compliance')

    # Document Header
    story.append(Paragraph("Complete Contract Analysis & Audit Report", styles['ReportTitle']))
    story.append(Paragraph(
        f"Document: <b>{exec_data.get('document_name', 'Document')}</b> • Type: {exec_data.get('document_type', 'Contract').upper()} • Pages: {exec_data.get('page_count') or 'N/A'}",
        styles['ReportSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_RED, spaceBefore=2, spaceAfter=12))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", styles['SectionHeading']))
    summary_text = exec_data.get('executive_summary', 'No summary available.')
    story.append(Paragraph(summary_text.replace("\n", "<br/>"), styles['ReportBody']))
    story.append(Spacer(1, 8))

    # Parties
    parties = exec_data.get('key_parties', [])
    if parties:
        story.append(Paragraph("Contracting Parties", styles['SubSectionHeading']))
        party_rows = [[
            Paragraph("Party Name", styles['TableHeader']),
            Paragraph("Role in Agreement", styles['TableHeader'])
        ]]
        for p in parties:
            party_rows.append([
                Paragraph(f"<b>{p.get('name', '')}</b>", styles['TableCell']),
                Paragraph(p.get('role', ''), styles['TableCell'])
            ])
        pt = Table(party_rows, colWidths=[180, 324])
        pt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_DARK),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG])
        ]))
        story.append(pt)
        story.append(Spacer(1, 10))

    # 2. Clause Analysis Table (All 8 Categories)
    story.append(Paragraph("2. Clause Detection & Extraction Analysis", styles['SectionHeading']))
    if not clauses:
        story.append(Paragraph("No clause extraction available.", styles['ReportBody']))
    else:
        clause_table_data = [[
            Paragraph("Clause Category", styles['TableHeader']),
            Paragraph("Status", styles['TableHeader']),
            Paragraph("Summary / Extracted Content", styles['TableHeader']),
            Paragraph("Page", styles['TableHeader'])
        ]]
        for c in clauses:
            status_p = Paragraph("<font color='#16A34A'><b>FOUND</b></font>", styles['TableCell']) if c.get('found') else Paragraph("<font color='#94A3B8'>MISSING</font>", styles['TableCell'])
            cat_p = Paragraph(f"<b>{c.get('category', '').replace('_', ' ').title()}</b>", styles['TableCell'])
            sum_text = c.get('summary') or ("Clause not detected in document." if not c.get('found') else "—")
            sum_p = Paragraph(sum_text, styles['TableCell'])
            page_p = Paragraph(f"{c.get('page_number')}" if c.get('page_number') else "—", styles['TableCell'])
            clause_table_data.append([cat_p, status_p, sum_p, page_p])

        ct = Table(clause_table_data, colWidths=[100, 54, 310, 40])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_DARK),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG])
        ]))
        story.append(ct)
        story.append(Spacer(1, 12))

    # 3. Risk Assessment Section
    story.append(Paragraph("3. Contractual Risks Assessment", styles['SectionHeading']))
    risks = risk_data.get('risks', [])
    if not risks:
        story.append(Paragraph("No contractual risks detected.", styles['ReportBody']))
    else:
        for r in risks:
            sev = r.get('severity', 'low').lower()
            sev_color = SEV_HIGH if sev == 'high' else (SEV_MED if sev == 'medium' else SEV_LOW)
            header_str = f"<b>{r.get('title', '')}</b> ({sev.upper()} RISK" + (f", Page {r['page_number']}" if r.get('page_number') else "") + ")"
            header_p = Paragraph(f"<font color='{sev_color.hexval()}'>{header_str}</font>", styles['SubSectionHeading'])
            body_p = Paragraph(r.get('rationale', ''), styles['ReportBody'])

            r_block = Table([[header_p], [body_p]], colWidths=[504])
            r_block.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                ('BOX', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
                ('LINEBEFORE', (0, 0), (0, -1), 3, sev_color),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(r_block)
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 8))

    # 4. Actionable Recommendations
    story.append(Paragraph("4. Recommended Modifications & Next Steps", styles['SectionHeading']))
    if not recommendations:
        story.append(Paragraph("No specific recommendations generated.", styles['ReportBody']))
    else:
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"<b>{i}.</b> {rec}", styles['ReportBody']))
        story.append(Spacer(1, 8))

    # 5. Policy Compliance Summary (If evaluated)
    if compliance:
        story.append(Paragraph("5. Organizational Policy Compliance Summary", styles['SectionHeading']))
        c_summary = f"""
        <b>Evaluated Against Policy:</b> {compliance.get('policy_name')} (v{compliance.get('policy_version')})<br/>
        <b>Compliance Score:</b> <b>{int(compliance.get('compliance_score', 100))}%</b> | <b>Risk Score:</b> <b>{int(compliance.get('risk_score', 0))}%</b><br/>
        <b>Total Identified Gaps:</b> {compliance.get('total_findings', 0)}
        """
        story.append(Paragraph(c_summary, styles['ReportBody']))

    doc.build(story, canvasmaker=NumberedCanvas)
    buf.seek(0)
    return buf
