import io
from typing import Dict, Any
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib import colors
from app.services.pdf_report_builder import (
    create_report_document, get_report_styles, NumberedCanvas,
    BRAND_RED, BRAND_DARK, BRAND_BORDER, BRAND_LIGHT_BG, SEV_HIGH, SEV_MED, SEV_LOW
)

def build_executive_summary_report(data: Dict[str, Any]) -> io.BytesIO:
    buf = io.BytesIO()
    doc = create_report_document(buf)
    styles = get_report_styles()
    story = []

    # Title & Metadata Header
    story.append(Paragraph("Executive Summary Report", styles['ReportTitle']))
    story.append(Paragraph(
        f"Document: <b>{data['document_name']}</b> • Type: {data['document_type'].upper()} • Pages: {data.get('page_count') or 'N/A'}",
        styles['ReportSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_RED, spaceBefore=2, spaceAfter=14))

    # Executive Summary Prose
    story.append(Paragraph("Executive Summary", styles['SectionHeading']))
    summary_text = data.get('executive_summary') or "No summary available."
    story.append(Paragraph(summary_text.replace("\n", "<br/>"), styles['ReportBody']))
    story.append(Spacer(1, 10))

    # Key Parties Section
    key_parties = data.get('key_parties') or []
    if key_parties:
        story.append(Paragraph("Key Contracting Parties", styles['SectionHeading']))
        party_data = [[
            Paragraph("Party Name", styles['TableHeader']),
            Paragraph("Role / Description", styles['TableHeader'])
        ]]
        for p in key_parties:
            party_data.append([
                Paragraph(f"<b>{p.get('name', 'N/A')}</b>", styles['TableCell']),
                Paragraph(p.get('role', 'N/A'), styles['TableCell'])
            ])

        party_table = Table(party_data, colWidths=[180, 324])
        party_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_DARK),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG])
        ]))
        story.append(party_table)
        story.append(Spacer(1, 12))

    # Top Risks Section
    top_risks = data.get('top_risks') or []
    story.append(Paragraph("Top Identified Risks", styles['SectionHeading']))
    if not top_risks:
        story.append(Paragraph("No significant risks identified in this document.", styles['ReportBody']))
    else:
        risk_table_data = [[
            Paragraph("Severity", styles['TableHeader']),
            Paragraph("Risk Title & Rationale", styles['TableHeader']),
            Paragraph("Location", styles['TableHeader'])
        ]]
        for r in top_risks:
            sev = r.get('severity', 'low').lower()
            if sev == 'high':
                sev_p = Paragraph("HIGH", styles['BadgeHigh'])
            elif sev == 'medium':
                sev_p = Paragraph("MEDIUM", styles['BadgeMed'])
            else:
                sev_p = Paragraph("LOW", styles['BadgeLow'])

            rationale = r.get('rationale', '')
            title = r.get('title', 'Risk Item')
            content_p = Paragraph(f"<b>{title}</b><br/><font color='#64748B'>{rationale}</font>", styles['TableCell'])
            page_p = Paragraph(f"Page {r['page_number']}" if r.get('page_number') else "—", styles['TableCell'])

            risk_table_data.append([sev_p, content_p, page_p])

        risk_table = Table(risk_table_data, colWidths=[70, 374, 60])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_DARK),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_LIGHT_BG])
        ]))
        story.append(risk_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("Prepared by <b>Compli AI Intelligence System</b>. All citations reference the source document.", styles['MutedText']))

    doc.build(story, canvasmaker=NumberedCanvas)
    buf.seek(0)
    return buf
