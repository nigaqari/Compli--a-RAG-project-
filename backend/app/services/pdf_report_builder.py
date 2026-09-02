import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)

# Colors
BRAND_RED = colors.HexColor('#DC2626')
BRAND_DARK = colors.HexColor('#0F172A')
BRAND_SLATE = colors.HexColor('#475569')
BRAND_LIGHT_BG = colors.HexColor('#F8FAFC')
BRAND_BORDER = colors.HexColor('#E2E8F0')
SEV_HIGH = colors.HexColor('#DC2626')
SEV_MED = colors.HexColor('#D97706')
SEV_LOW = colors.HexColor('#16A34A')

class NumberedCanvas(canvas.Canvas):
    """Canvas that performs a two-pass calculation to draw 'Page X of Y' and headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Header (pages after cover / page 1)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(BRAND_DARK)
        self.drawString(54, 750, "COMPLI")
        self.setFont("Helvetica", 8)
        self.setFillColor(BRAND_SLATE)
        self.drawString(95, 750, "• AI Governance & Contract Intelligence")

        # Top Red Accent Rule
        self.setStrokeColor(BRAND_RED)
        self.setLineWidth(1)
        self.line(54, 742, 558, 742)

        # Footer
        self.setStrokeColor(BRAND_BORDER)
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        self.setFont("Helvetica", 8)
        self.setFillColor(BRAND_SLATE)
        self.drawString(54, 32, f"Confidential & Proprietary • Generated on {datetime.utcnow().strftime('%B %d, %Y')}")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def get_report_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='ReportTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=BRAND_DARK,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name='ReportSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=BRAND_SLATE,
        spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        name='SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=BRAND_DARK,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='SubSectionHeading',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=BRAND_DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='ReportBody',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=BRAND_DARK,
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='ReportBodyBold',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=BRAND_DARK
    ))
    styles.add(ParagraphStyle(
        name='MutedText',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=BRAND_SLATE
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=BRAND_DARK
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.white
    ))
    styles.add(ParagraphStyle(
        name='BadgeHigh',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=SEV_HIGH
    ))
    styles.add(ParagraphStyle(
        name='BadgeMed',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=SEV_MED
    ))
    styles.add(ParagraphStyle(
        name='BadgeLow',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=SEV_LOW
    ))

    return styles

def create_report_document(buf: io.BytesIO) -> SimpleDocTemplate:
    """Initializes standard letter DocTemplate with 54pt (0.75in) margins."""
    return SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
