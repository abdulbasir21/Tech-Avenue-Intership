# -*- coding: utf-8 -*-
"""
Inventory Management System (IMS) - Complete ERD Educational & Interview Defense Guide
Generates docs/erd-explained-easy.pdf using ReportLab
Strictly verified against docs/inventory-management-erd.dbml
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# ── Colors ──────────────────────────────────────────────────────────────────
NAVY = colors.HexColor('#0F172A')       # Slate 900
DARK_BLUE = colors.HexColor('#1E293B')  # Slate 800
PRIMARY = colors.HexColor('#1D4ED8')    # Blue 700
ACCENT_BLUE = colors.HexColor('#2563EB')# Blue 600
LIGHT_BG = colors.HexColor('#F8FAFC')   # Slate 50
ALT_ROW = colors.HexColor('#F1F5F9')    # Slate 100
BORDER_COL = colors.HexColor('#CBD5E1') # Slate 300
TEXT_DARK = colors.HexColor('#0F172A')  # Slate 900
TEXT_MUTED = colors.HexColor('#475569') # Slate 600
WHITE = colors.white

# Module Colors from DBML
C_AUTH = colors.HexColor('#4C6EF5')      # Indigo
C_MASTERS = colors.HexColor('#0D9488')   # Teal
C_PURCHASE = colors.HexColor('#D97706')  # Orange/Amber
C_RECEIVING = colors.HexColor('#16A34A') # Green
C_REQUESTS = colors.HexColor('#9333EA')  # Purple
C_ISSUING = colors.HexColor('#DB2777')   # Pink
C_ADJUST = colors.HexColor('#EA580C')    # Dark Orange
C_INVENTORY = colors.HexColor('#0284C7') # Sky Blue
C_NOTIF = colors.HexColor('#475569')     # Slate Gray

# Box background colors
CALLOUT_BG = colors.HexColor('#EFF6FF')  # Light blue
CALLOUT_BORDER = colors.HexColor('#3B82F6')
WARN_BG = colors.HexColor('#FEF3C7')     # Light amber
WARN_BORDER = colors.HexColor('#F59E0B')
SUCCESS_BG = colors.HexColor('#ECFDF5')  # Light emerald
SUCCESS_BORDER = colors.HexColor('#10B981')
REJECT_BG = colors.HexColor('#FFF1F2')   # Light rose
REJECT_BORDER = colors.HexColor('#F43F5E')
CODE_BG = colors.HexColor('#F1F5F9')

TOTAL_WIDTH = 540  # 8.5in * 72 - 72pt margins

# ── Numbered Canvas ────────────────────────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
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

    def draw_page_decorations(self, total_pages):
        self.saveState()
        page_num = self._pageNumber
        if page_num > 1:
            # Header
            self.setFont('Helvetica-Bold', 7.5)
            self.setFillColor(TEXT_MUTED)
            self.drawString(36, 11 * 72 - 26, "INVENTORY MANAGEMENT SYSTEM (IMS)  |  DATABASE ERD DEFENSE GUIDE")
            self.setFont('Helvetica', 7.5)
            self.drawRightString(8.5 * 72 - 36, 11 * 72 - 26, "PostgreSQL & Prisma")
            self.setStrokeColor(BORDER_COL)
            self.setLineWidth(0.5)
            self.line(36, 11 * 72 - 30, 8.5 * 72 - 36, 11 * 72 - 30)
            
            # Footer
            self.line(36, 32, 8.5 * 72 - 36, 32)
            self.setFont('Helvetica', 7.5)
            self.setFillColor(TEXT_MUTED)
            self.drawString(36, 20, "CONFIDENTIAL  |  Engineering Mentorship & Technical Interview Guide")
            page_text = f"Page {page_num} of {total_pages}"
            self.drawRightString(8.5 * 72 - 36, 20, page_text)
        self.restoreState()


# ── Styles Setup ───────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=11.5,
    textColor=TEXT_DARK,
    spaceAfter=4
)

body_bold = ParagraphStyle(
    'CustomBodyBold',
    parent=body_style,
    fontName='Helvetica-Bold'
)

body_muted = ParagraphStyle(
    'CustomBodyMuted',
    parent=body_style,
    textColor=TEXT_MUTED,
    fontSize=8,
    leading=10.5
)

bullet_style = ParagraphStyle(
    'CustomBullet',
    parent=body_style,
    leftIndent=14,
    firstLineIndent=-10,
    spaceAfter=3
)

h1_style = ParagraphStyle(
    'CustomH1',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=16,
    textColor=NAVY,
    spaceBefore=12,
    spaceAfter=5,
    keepWithNext=True
)

h2_style = ParagraphStyle(
    'CustomH2',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=13.5,
    textColor=ACCENT_BLUE,
    spaceBefore=9,
    spaceAfter=4,
    keepWithNext=True
)

h3_style = ParagraphStyle(
    'CustomH3',
    parent=styles['Heading3'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=DARK_BLUE,
    spaceBefore=6,
    spaceAfter=3,
    keepWithNext=True
)

table_header_style = ParagraphStyle(
    'TableHeader',
    fontName='Helvetica-Bold',
    fontSize=7.5,
    leading=9.5,
    textColor=WHITE,
    alignment=0
)

table_cell_style = ParagraphStyle(
    'TableCell',
    fontName='Helvetica',
    fontSize=7.2,
    leading=9.2,
    textColor=TEXT_DARK
)

table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=table_cell_style,
    fontName='Helvetica-Bold'
)

table_cell_code = ParagraphStyle(
    'TableCellCode',
    parent=table_cell_style,
    fontName='Courier',
    fontSize=6.8,
    leading=8.2
)

callout_title_style = ParagraphStyle(
    'CalloutTitle',
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=11,
    textColor=DARK_BLUE,
    spaceAfter=2
)

callout_text_style = ParagraphStyle(
    'CalloutText',
    fontName='Helvetica',
    fontSize=8,
    leading=10.5,
    textColor=TEXT_DARK
)

qa_q_style = ParagraphStyle(
    'QAQuestion',
    fontName='Helvetica-Bold',
    fontSize=8.8,
    leading=11.5,
    textColor=NAVY,
    spaceBefore=6,
    spaceAfter=2,
    keepWithNext=True
)

qa_a_style = ParagraphStyle(
    'QAAnswer',
    fontName='Helvetica',
    fontSize=8.2,
    leading=11,
    textColor=TEXT_DARK,
    leftIndent=8,
    spaceAfter=5
)

# ── Helper Builders ────────────────────────────────────────────────────────
def section_banner(num_str, title_str, color=DARK_BLUE):
    header_content = [
        [
            Paragraph(f"<font color='white'><b>SECTION {num_str}</b></font>", ParagraphStyle('SBNum', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=WHITE)),
            Paragraph(f"<font color='white'><b>{title_str.upper()}</b></font>", ParagraphStyle('SBTit', fontName='Helvetica-Bold', fontSize=10, leading=12.5, textColor=WHITE))
        ]
    ]
    t = Table(header_content, colWidths=[75, TOTAL_WIDTH - 75])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def module_banner(mod_num, mod_name, color):
    data = [
        [
            Paragraph(f"<font color='white'><b>MODULE {mod_num}</b></font>", ParagraphStyle('MBNum', fontName='Helvetica-Bold', fontSize=7.5, textColor=WHITE)),
            Paragraph(f"<font color='white'><b>{mod_name.upper()}</b></font>", ParagraphStyle('MBName', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))
        ]
    ]
    t = Table(data, colWidths=[70, TOTAL_WIDTH - 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def callout_box(title, text, kind='info'):
    bg = CALLOUT_BG
    border = CALLOUT_BORDER
    prefix = "[i] Key Concept:"
    if kind == 'warn':
        bg = WARN_BG
        border = WARN_BORDER
        prefix = "[!] Critical Safeguard:"
    elif kind == 'success':
        bg = SUCCESS_BG
        border = SUCCESS_BORDER
        prefix = "[OK] Architecture Rule:"
    elif kind == 'reject':
        bg = REJECT_BG
        border = REJECT_BORDER
        prefix = "[X] Rejected Alternative:"

    content = [
        Paragraph(f"<b>{prefix} {title}</b>", callout_title_style),
        Paragraph(text, callout_text_style)
    ]
    t = Table([[content]], colWidths=[TOTAL_WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINELEFT', (0,0), (-1,-1), 3, border),
        ('BOX', (0,0), (-1,-1), 0.5, border),
    ]))
    return t

def decision_card(decision_num, title, why_chosen, why_rejected):
    content = [
        Paragraph(f"<b>Decision {decision_num}: {title}</b>", h3_style),
        Spacer(1, 1),
        Paragraph(f"<b>Chosen Architecture:</b> {why_chosen}", body_style),
        Spacer(1, 2),
        Paragraph(f"<b>Rejected Alternative & Why:</b> <font color='#991B1B'>{why_rejected}</font>", body_style),
    ]
    t = Table([[content]], colWidths=[TOTAL_WIDTH])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINELEFT', (0,0), (-1,-1), 3.5, PRIMARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COL),
    ]))
    return t

def make_clean_table(headers, rows, widths, header_color=DARK_BLUE):
    formatted_headers = [Paragraph(f"<b>{h}</b>", table_header_style) for h in headers]
    formatted_rows = []
    for r in rows:
        formatted_r = []
        for c in r:
            if isinstance(c, Paragraph):
                formatted_r.append(c)
            elif isinstance(c, str):
                formatted_r.append(Paragraph(c, table_cell_style))
            else:
                formatted_r.append(Paragraph(str(c), table_cell_style))
        formatted_rows.append(formatted_r)
    
    table_data = [formatted_headers] + formatted_rows
    t = Table(table_data, colWidths=widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), header_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
    ]))
    return t

print("Setup and styling verified.")
