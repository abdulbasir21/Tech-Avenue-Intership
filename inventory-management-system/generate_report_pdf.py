# -*- coding: utf-8 -*-
"""
Generate docs/schema-implementation-report.pdf using ReportLab
Comprehensive engineering report for mentorship interview defense.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak, HRFlowable
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

CALLOUT_BG = colors.HexColor('#EFF6FF')     # Light blue
CALLOUT_BORDER = colors.HexColor('#3B82F6')
SUCCESS_BG = colors.HexColor('#ECFDF5')     # Light green
SUCCESS_BORDER = colors.HexColor('#10B981')
REJECT_BG = colors.HexColor('#FFF1F2')      # Light red
REJECT_BORDER = colors.HexColor('#F43F5E')
WARN_BG = colors.HexColor('#FEF3C7')        # Light amber
WARN_BORDER = colors.HexColor('#F59E0B')
CODE_BG = colors.HexColor('#F8FAFC')
CODE_BORDER = colors.HexColor('#E2E8F0')

TOTAL_WIDTH = 540  # 8.5in * 72 - 72pt margins (0.5 inch each side)

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
            self.drawString(36, 11 * 72 - 24, "INVENTORY MANAGEMENT SYSTEM  |  SCHEMA IMPLEMENTATION REPORT")
            self.setFont('Helvetica', 7.5)
            self.drawRightString(8.5 * 72 - 36, 11 * 72 - 24, "PostgreSQL & Prisma ORM")
            self.setStrokeColor(BORDER_COL)
            self.setLineWidth(0.5)
            self.line(36, 11 * 72 - 28, 8.5 * 72 - 36, 11 * 72 - 28)
            
            # Footer
            self.line(36, 30, 8.5 * 72 - 36, 30)
            self.setFont('Helvetica', 7.5)
            self.setFillColor(TEXT_MUTED)
            self.drawString(36, 18, "TECHNICAL MENTORSHIP DEFENSE DOCUMENT  |  CONFIDENTIAL & VERIFIED")
            page_text = f"Page {page_num} of {total_pages}"
            self.drawRightString(8.5 * 72 - 36, 18, page_text)
        self.restoreState()


def create_report(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=NAVY
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK
    )
    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK
    )
    presenting_style = ParagraphStyle(
        'Presenting_Text',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11.5,
        textColor=DARK_BLUE
    )
    code_inline = ParagraphStyle(
        'CodeInline',
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK_BLUE
    )
    code_block = ParagraphStyle(
        'CodeBlock',
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=DARK_BLUE
    )
    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_DARK
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_DARK
    )
    table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=WHITE
    )

    story = []

    def make_presenting_box(text):
        content = [
            Paragraph("<b>Explain it like I'm presenting:</b>", h2_style),
            Spacer(1, 2),
            Paragraph(text, presenting_style)
        ]
        t = Table([[content]], colWidths=[TOTAL_WIDTH])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CALLOUT_BG),
            ('BOX', (0,0), (-1,-1), 0.75, CALLOUT_BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    def make_code_box(code_text):
        content = Paragraph(code_text.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_block)
        t = Table([[content]], colWidths=[TOTAL_WIDTH])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CODE_BG),
            ('BOX', (0,0), (-1,-1), 0.5, CODE_BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    # ══════════════════════════════════════════════════════════════════════════
    # COVER / HEADER
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Inventory Management System with Shared Masters", title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Database Layer Implementation & Mentorship Defense Report</b>", ParagraphStyle('SubHeader', fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=PRIMARY)))
    story.append(Spacer(1, 3))
    story.append(Paragraph("<b>Stack:</b> Node.js &bull; TypeScript &bull; PostgreSQL (Neon Serverless) &bull; Prisma ORM 6.19.3 &bull; Express (prepared)", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=8))

    # ══════════════════════════════════════════════════════════════════════════
    # 1. TASK SUMMARY
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Task Summary: Assignment Scope & Deliverables", h1_style))
    story.append(make_presenting_box(
        "\"My mentor asked me to build the solid database foundation for an inventory system. I focused purely on the data models, exact constraints, ledger immutability, and seeding. I did not write APIs or frontend code because this phase is strictly about guaranteeing that bad data can never enter the database in the first place.\""
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "The objective was to take the design specification in <code>docs/inventory-management-erd.dbml</code> and implement the entire persistence layer inside <code>server/</code>. The business scope is restricted to a <b>single company with a single store location</b> managing <b>office supplies and IT consumables</b> (e.g. keyboards, toner cartridges, pens, printer paper).",
        body_style
    ))
    story.append(Spacer(1, 4))

    scope_data = [
        [Paragraph("In Scope (Completed & Live in Database)", table_header), Paragraph("Out of Scope (Explicitly Not Done in this Task)", table_header)],
        [
            Paragraph("&bull; 22 relational models and 7 PostgreSQL enums in Prisma.<br/>"
                      "&bull; Dual connection architecture for Neon serverless pooler.<br/>"
                      "&bull; 17 named CHECK constraints added via raw SQL migration.<br/>"
                      "&bull; Append-only trigger preventing UPDATE/DELETE on ledger.<br/>"
                      "&bull; Single-source rule on stock movements via num_nonnulls().<br/>"
                      "&bull; Automated seed script for 3 roles, units, categories, admin.<br/>"
                      "&bull; Automated test suite proving negative constraint rejections.", table_cell),
            Paragraph("&bull; <b>No asset management:</b> No individual asset tags, warranty tracking, depreciations, maintenance, or lifecycles.<br/>"
                      "&bull; <b>No backend API routes:</b> No Express routers, controllers, services, or middleware.<br/>"
                      "&bull; <b>No authentication flows:</b> No JWT generation, sessions, or password reset tokens.<br/>"
                      "&bull; <b>No frontend:</b> No UI components, HTML forms, or web pages.<br/>"
                      "&bull; <b>No multi-warehouse / multi-currency:</b> Single store and single currency.", table_cell)
        ]
    ]
    st = Table(scope_data, colWidths=[TOTAL_WIDTH*0.5, TOTAL_WIDTH*0.5])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(st)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 2. WHAT WAS BUILT (STEP-BY-STEP)
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. What Was Built: Step-by-Step Implementation Sequence", h1_style))
    story.append(make_presenting_box(
        "\"I completed the implementation in seven structured phases: from initializing the Prisma project and connecting to Neon, to modeling the 22 tables, injecting raw SQL constraints that Prisma cannot express, writing the seed script, and verifying every business rule with live automated tests.\""
    ))
    story.append(Spacer(1, 6))

    steps_data = [
        [Paragraph("Step", table_header), Paragraph("Phase Name", table_header), Paragraph("Key Files Created / Modified", table_header), Paragraph("CLI Commands Executed", table_header)],
        [
            Paragraph("1", table_cell_bold),
            Paragraph("Project Setup & Neon Connection", table_cell),
            Paragraph("<code>server/package.json</code><br/><code>server/tsconfig.json</code><br/><code>server/.env.example</code><br/><code>.gitignore</code>", table_cell),
            Paragraph("<code>npm init -y</code><br/><code>npm i -D prisma@6.19.3 tsx typescript</code><br/><code>npm i @prisma/client@6.19.3</code><br/><code>npx prisma init</code>", table_cell)
        ],
        [
            Paragraph("2", table_cell_bold),
            Paragraph("Enums, Auth & Shared Masters", table_cell),
            Paragraph("<code>server/prisma/schema.prisma</code>", table_cell),
            Paragraph("Defined 7 enums & 8 foundation models (roles, users, departments, employees, categories, units, suppliers, products).", table_cell)
        ],
        [
            Paragraph("3", table_cell_bold),
            Paragraph("Document Models", table_cell),
            Paragraph("<code>server/prisma/schema.prisma</code>", table_cell),
            Paragraph("Defined 9 transactional models: purchase_orders (+items), goods_receipts (+items), stock_requests (+items), stock_issues (+items), stock_adjustments.", table_cell)
        ],
        [
            Paragraph("4", table_cell_bold),
            Paragraph("Inventory, Ledger & Logs", table_cell),
            Paragraph("<code>server/prisma/schema.prisma</code>", table_cell),
            Paragraph("Defined 5 core inventory models: inventory_balances, stock_movements, notifications, notification_recipients, audit_logs.<br/><code>npx prisma validate</code>", table_cell)
        ],
        [
            Paragraph("5", table_cell_bold),
            Paragraph("Raw SQL Migration & Constraints", table_cell),
            Paragraph("<code>server/prisma/migrations/20261112160116_init_inventory_schema/migration.sql</code>", table_cell),
            Paragraph("<code>npx prisma migrate dev --create-only --name init_inventory_schema</code><br/>Injected 17 CHECK constraints, trigger, num_nonnulls.<br/><code>npx prisma migrate dev</code>", table_cell)
        ],
        [
            Paragraph("6", table_cell_bold),
            Paragraph("Database Seeding", table_cell),
            Paragraph("<code>server/prisma/seed.ts</code><br/><code>server/package.json</code>", table_cell),
            Paragraph("Wired seed runner in package.json.<br/><code>npx prisma db seed</code> (seeded 3 roles, departments, units, categories, admin).", table_cell)
        ],
        [
            Paragraph("7", table_cell_bold),
            Paragraph("Automated Verification", table_cell),
            Paragraph("<code>server/prisma/verify.ts</code><br/><code>docs/implementation-log.md</code>", table_cell),
            Paragraph("<code>npx prisma validate</code><br/><code>npx prisma migrate status</code><br/><code>npx tsx prisma/verify.ts</code> (All 7 assertions passed).", table_cell)
        ],
    ]
    step_t = Table(steps_data, colWidths=[24, 110, 150, TOTAL_WIDTH - 284])
    step_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(step_t)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 3. HOW THE DBML WAS TURNED INTO PRISMA
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. How the DBML was Turned into Prisma: Mapping Rules", h1_style))
    story.append(make_presenting_box(
        "\"Prisma uses camelCase for TypeScript models while PostgreSQL uses snake_case for tables and columns. I used @@map and @map throughout so the database matches the DBML specification 100%, while keeping the TypeScript developer experience clean. Every relation explicitly specifies onDelete: Restrict to preserve business history.\""
    ))
    story.append(Spacer(1, 6))

    mapping_data = [
        [Paragraph("DBML Feature / Type", table_header), Paragraph("Prisma Mapping Syntax", table_header), Paragraph("Real Model Example", table_header), Paragraph("Engineering Reason", table_header)],
        [
            Paragraph("<code>bigint</code> identity PK", table_cell),
            Paragraph("<code>BigInt @id @default(autoincrement())</code>", table_cell),
            Paragraph("<code>StockMovement.id</code><br/><code>AuditLog.id</code>", table_cell),
            Paragraph("High-volume transaction tables exceed 2.14B integer limit in high-throughput environments.", table_cell)
        ],
        [
            Paragraph("<code>numeric(12,3)</code><br/><code>numeric(14,2)</code>", table_cell),
            Paragraph("<code>Decimal @db.Decimal(12, 3)</code><br/><code>Decimal @db.Decimal(14, 2)</code>", table_cell),
            Paragraph("<code>quantityOnHand</code><br/><code>totalAmount</code>", table_cell),
            Paragraph("Floating point types cause IEEE-754 rounding errors. Exact decimal arithmetic is mandatory.", table_cell)
        ],
        [
            Paragraph("<code>timestamptz</code>", table_cell),
            Paragraph("<code>DateTime @db.Timestamptz</code>", table_cell),
            Paragraph("<code>createdAt</code><br/><code>updatedAt</code>", table_cell),
            Paragraph("Stores UTC timestamps with time zone offset, preventing timezone drift.", table_cell)
        ],
        [
            Paragraph("<code>date</code>", table_cell),
            Paragraph("<code>DateTime @db.Date</code>", table_cell),
            Paragraph("<code>orderDate</code><br/><code>receivedDate</code>", table_cell),
            Paragraph("Stores calendar dates without time component (e.g. 2026-11-12).", table_cell)
        ],
        [
            Paragraph("<code>inet</code> (IP address)", table_cell),
            Paragraph("<code>String? @db.Inet</code>", table_cell),
            Paragraph("<code>AuditLog.ipAddress</code>", table_cell),
            Paragraph("PostgreSQL native inet data type for IPv4 and IPv6 network addresses.", table_cell)
        ],
        [
            Paragraph("Table & Column naming", table_cell),
            Paragraph("<code>@@map(\"table_name\")</code><br/><code>@map(\"col_name\")</code>", table_cell),
            Paragraph("<code>@@map(\"purchase_orders\")</code><br/><code>poNumber @map(\"po_number\")</code>", table_cell),
            Paragraph("Database uses snake_case; Prisma client code uses TypeScript camelCase.", table_cell)
        ],
        [
            Paragraph("Foreign Key rules", table_cell),
            Paragraph("<code>@relation(fields: [...], references: [...], onDelete: Restrict)</code>", table_cell),
            Paragraph("All foreign keys across all 22 tables", table_cell),
            Paragraph("Guarantees referential integrity. Prevents accidental cascade deletions of master history.", table_cell)
        ],
        [
            Paragraph("Composite unique keys", table_cell),
            Paragraph("<code>@@unique([f1, f2], map: \"name\")</code>", table_cell),
            Paragraph("<code>[purchaseOrderId, productId]</code> on PO lines", table_cell),
            Paragraph("Enforces document rule: the same product cannot be added twice to one purchase order.", table_cell)
        ],
        [
            Paragraph("1:1 Primary Key + FK", table_cell),
            Paragraph("<code>productId Int @id @map(\"product_id\")</code><br/><code>product Product @relation(...)</code>", table_cell),
            Paragraph("<code>InventoryBalance.productId</code>", table_cell),
            Paragraph("inventory_balances has exactly one row per product; product_id serves as both PK and FK.", table_cell)
        ],
    ]
    map_t = Table(mapping_data, colWidths=[90, 130, 120, TOTAL_WIDTH - 340])
    map_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(map_t)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 4. WHAT PRISMA CANNOT DO AND HOW IT WAS SOLVED
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. What Prisma Cannot Do & How It Was Solved (Raw SQL Migration)", h1_style))
    story.append(make_presenting_box(
        "\"Prisma Schema Language is great for structural DDL, but it cannot declare table CHECK constraints, PostgreSQL functions, or triggers. Rather than giving up on these essential database guarantees, I used 'prisma migrate dev --create-only' to generate the baseline SQL, then directly appended the DBML check constraints, the num_nonnulls() rule, and the append-only trigger before applying the migration.\""
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>A. The 17 Named CHECK Constraints Added to the Migration:</b>", h2_style))
    story.append(Paragraph(
        "These constraints ensure invalid data states are rejected by PostgreSQL itself, regardless of any future bugs in API code:",
        body_style
    ))
    story.append(Spacer(1, 2))

    check_sql_sample = (
        "-- 1. Products: critical stock must never exceed minimum stock\n"
        "ALTER TABLE \"products\" ADD CONSTRAINT \"chk_products_min_stock\" CHECK (min_stock_level >= 0);\n"
        "ALTER TABLE \"products\" ADD CONSTRAINT \"chk_products_critical_stock\"\n"
        "  CHECK (critical_stock_level >= 0 AND critical_stock_level <= min_stock_level);\n\n"
        "-- 2. Purchase Orders & Lines: ordered quantity must be > 0 and line total must match math\n"
        "ALTER TABLE \"purchase_orders\" ADD CONSTRAINT \"chk_po_dates\"\n"
        "  CHECK (expected_delivery_date IS NULL OR expected_delivery_date >= order_date);\n"
        "ALTER TABLE \"purchase_order_items\" ADD CONSTRAINT \"chk_poi_qty_positive\" CHECK (quantity_ordered > 0);\n"
        "ALTER TABLE \"purchase_order_items\" ADD CONSTRAINT \"chk_poi_line_total\"\n"
        "  CHECK (line_total = round(quantity_ordered * unit_price, 2));\n\n"
        "-- 3. Stock Requests: mandatory reason and reviewer when rejected\n"
        "ALTER TABLE \"stock_requests\" ADD CONSTRAINT \"chk_sr_rejection\"\n"
        "  CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND reviewed_by_user_id IS NOT NULL));\n\n"
        "-- 4. Stock Adjustments: damaged and lost can only DECREASE stock\n"
        "ALTER TABLE \"stock_adjustments\" ADD CONSTRAINT \"chk_sa_reason_matches_type\"\n"
        "  CHECK (reason_category NOT IN ('damaged', 'lost') OR adjustment_type = 'decrease');\n"
        "ALTER TABLE \"stock_adjustments\" ADD CONSTRAINT \"chk_sa_reason_not_blank\"\n"
        "  CHECK (length(btrim(reason)) > 0);\n\n"
        "-- 5. Inventory Balances: quantity on hand must NEVER drop below zero\n"
        "ALTER TABLE \"inventory_balances\" ADD CONSTRAINT \"chk_bal_no_negative_stock\" CHECK (quantity_on_hand >= 0);"
    )
    story.append(make_code_box(check_sql_sample))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>B. The num_nonnulls() Single-Source Ledger Rule:</b>", h2_style))
    story.append(Paragraph(
        "In <code>stock_movements</code>, every movement must originate from exactly one transaction: a goods receipt line, a stock issue line, or an adjustment. We used PostgreSQL's built-in <code>num_nonnulls()</code> function to enforce this with mathematical certainty:",
        body_style
    ))
    story.append(Spacer(1, 2))

    ledger_sql = (
        "ALTER TABLE \"stock_movements\" ADD CONSTRAINT \"chk_mov_single_source\"\n"
        "  CHECK (num_nonnulls(goods_receipt_item_id, stock_issue_item_id, stock_adjustment_id) = 1);\n\n"
        "ALTER TABLE \"stock_movements\" ADD CONSTRAINT \"chk_mov_type_sign_source\"\n"
        "  CHECK (\n"
        "    (movement_type = 'goods_receipt' AND quantity_change > 0 AND goods_receipt_item_id IS NOT NULL) OR\n"
        "    (movement_type = 'stock_issue' AND quantity_change < 0 AND stock_issue_item_id IS NOT NULL) OR\n"
        "    (movement_type = 'adjustment_increase' AND quantity_change > 0 AND stock_adjustment_id IS NOT NULL) OR\n"
        "    (movement_type = 'adjustment_decrease' AND quantity_change < 0 AND stock_adjustment_id IS NOT NULL)\n"
        "  );"
    )
    story.append(make_code_box(ledger_sql))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>C. The Append-Only Ledger Trigger on stock_movements:</b>", h2_style))
    story.append(Paragraph(
        "In financial and inventory ledgers, rows must be immutable. A past movement can never be updated or deleted; any correction requires a new compensating movement. We created a PostgreSQL trigger function that intercepts and raises an exception on any attempt to execute <code>UPDATE</code> or <code>DELETE</code> on <code>stock_movements</code>:",
        body_style
    ))
    story.append(Spacer(1, 2))

    trigger_sql = (
        "CREATE OR REPLACE FUNCTION trg_prevent_stock_movements_mutation()\n"
        "RETURNS TRIGGER AS $$\n"
        "BEGIN\n"
        "  RAISE EXCEPTION 'Table stock_movements is an append-only ledger: UPDATE and DELETE operations are prohibited.';\n"
        "END;\n"
        "$$ LANGUAGE plpgsql;\n\n"
        "CREATE TRIGGER trg_stock_movements_no_update_delete\n"
        "BEFORE UPDATE OR DELETE ON \"stock_movements\"\n"
        "FOR EACH ROW\n"
        "EXECUTE FUNCTION trg_prevent_stock_movements_mutation();"
    )
    story.append(make_code_box(trigger_sql))
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 5. NEON CONNECTION SETUP
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. The Neon Connection Architecture: Pooled vs. Direct URL", h1_style))
    story.append(make_presenting_box(
        "\"Neon is serverless Postgres. To prevent connection exhaustion from hundreds of web clients, application traffic connects through a PgBouncer connection pooler using DATABASE_URL. However, connection poolers run in transaction mode and forbid session advisory locks, which Prisma Migrate requires. That's why we configure directUrl pointing to DATABASE_URL_UNPOOLED for migrations.\""
    ))
    story.append(Spacer(1, 6))

    neon_data = [
        [Paragraph("Environment Variable Name", table_header), Paragraph("Neon Connection Mode", table_header), Paragraph("Prisma Schema Field", table_header), Paragraph("Purpose & Workload Type", table_header)],
        [
            Paragraph("<code>DATABASE_URL</code>", table_cell_bold),
            Paragraph("Pooled (PgBouncer, port 5432 with pooler endpoint)", table_cell),
            Paragraph("<code>url = env(\"DATABASE_URL\")</code>", table_cell),
            Paragraph("Application runtime queries. Supports high concurrency and short-lived web requests without running out of serverless connection slots.", table_cell)
        ],
        [
            Paragraph("<code>DATABASE_URL_UNPOOLED</code>", table_cell_bold),
            Paragraph("Direct TCP (Direct compute instance endpoint)", table_cell),
            Paragraph("<code>directUrl = env(\"DATABASE_URL_UNPOOLED\")</code>", table_cell),
            Paragraph("Used exclusively by Prisma CLI for DDL migrations. Bypasses PgBouncer to allow session-level advisory locks.", table_cell)
        ]
    ]
    nt = Table(neon_data, colWidths=[120, 110, 130, TOTAL_WIDTH - 360])
    nt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(nt)
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>Security Rules Enforced:</b><br/>"
        "1. <b>Zero Credentials Committed:</b> The actual secret connection string is never committed to Git, printed to console, or included in documentation.<br/>"
        "2. <b>Git Exclusions:</b> Both root <code>.gitignore</code> and <code>server/.gitignore</code> explicitly ignore <code>.env</code> and <code>.env.*</code>.<br/>"
        "3. <b>Safe Template:</b> Created <code>server/.env.example</code> containing sanitized placeholder hostnames and usernames.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 6. VERIFICATION RESULTS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Verification Results: Real Automated Test Outputs", h1_style))
    story.append(make_presenting_box(
        "\"To prove this implementation works, I didn't rely on assumptions. I wrote server/prisma/verify.ts which queried PostgreSQL's information_schema to verify all 22 tables exist, and then fired negative SQL test cases against the database. Every constraint and trigger successfully rejected invalid transactions and accepted valid ones.\""
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Table Inventory (information_schema.tables):</b> Exactly 22 application tables + 1 Prisma migration table:", body_bold))
    story.append(Spacer(1, 2))
    
    tables_list = (
        "[1] audit_logs  [2] categories  [3] departments  [4] employees  [5] goods_receipt_items  [6] goods_receipts\n"
        "[7] inventory_balances  [8] notification_recipients  [9] notifications  [10] products  [11] purchase_order_items\n"
        "[12] purchase_orders  [13] roles  [14] stock_adjustments  [15] stock_issue_items  [16] stock_issues\n"
        "[17] stock_movements  [18] stock_request_items  [19] stock_requests  [20] suppliers  [21] units  [22] users\n"
        "+ _prisma_migrations (Total: 23 tables)"
    )
    story.append(make_code_box(tables_list))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>The 6 Negative Constraint & Trigger Tests (Live Output):</b>", h2_style))

    test_results_data = [
        [Paragraph("Test Description", table_header), Paragraph("Constraint / Trigger", table_header), Paragraph("Negative Input (Rejected)", table_header), Paragraph("Valid Input (Accepted)", table_header)],
        [
            Paragraph("1. Negative Stock Balance", table_cell_bold),
            Paragraph("<code>chk_bal_no_negative_stock</code>", table_cell),
            Paragraph("<b>REJECTED:</b> <code>quantity_on_hand = -5.000</code><br/><i>Error: Failing row contains (1, -5.000, out_of_stock...)</i>", table_cell),
            Paragraph("<b>ACCEPTED:</b> <code>quantity_on_hand = 12.000</code> saved successfully.", table_cell)
        ],
        [
            Paragraph("2. Zero Quantity Ordered", table_cell_bold),
            Paragraph("<code>chk_poi_qty_positive</code>", table_cell),
            Paragraph("<b>REJECTED:</b> <code>quantity_ordered = 0.000</code><br/><i>Error: Failing row contains (1, 1, 1, 0.000, 25.00...)</i>", table_cell),
            Paragraph("<b>ACCEPTED:</b> <code>quantity_ordered = 20.000</code> @ 25.00 = 500.00 saved.", table_cell)
        ],
        [
            Paragraph("3. Dual Sources on Ledger", table_cell_bold),
            Paragraph("<code>chk_mov_single_source</code>", table_cell),
            Paragraph("<b>REJECTED:</b> Row with both <code>goods_receipt_item_id = 1</code> AND <code>stock_adjustment_id = 1</code>.<br/><i>Error: Failing row violates num_nonnulls() = 1</i>", table_cell),
            Paragraph("<b>ACCEPTED:</b> Movement with single source (<code>goods_receipt_item_id = 1</code>) inserted.", table_cell)
        ],
        [
            Paragraph("4. UPDATE on Ledger", table_cell_bold),
            Paragraph("<code>trg_stock_movements_no_update_delete</code>", table_cell),
            Paragraph("<b>REJECTED:</b> <code>UPDATE stock_movements SET quantity_change = 15</code><br/><i>Error: Code P0001: Table stock_movements is an append-only ledger: UPDATE and DELETE operations are prohibited.</i>", table_cell),
            Paragraph("<b>RULE PROVEN:</b> Invariant ledger history cannot be tampered with.", table_cell)
        ],
        [
            Paragraph("5. DELETE on Ledger", table_cell_bold),
            Paragraph("<code>trg_stock_movements_no_update_delete</code>", table_cell),
            Paragraph("<b>REJECTED:</b> <code>DELETE FROM stock_movements WHERE id = 1</code><br/><i>Error: Code P0001: Table stock_movements is an append-only ledger: UPDATE and DELETE operations are prohibited.</i>", table_cell),
            Paragraph("<b>RULE PROVEN:</b> Ledger entries are permanently immutable.", table_cell)
        ],
        [
            Paragraph("6. Damaged Increase Adjustment", table_cell_bold),
            Paragraph("<code>chk_sa_reason_matches_type</code>", table_cell),
            Paragraph("<b>REJECTED:</b> <code>adjustment_type = 'increase'</code> with <code>reason_category = 'damaged'</code>.<br/><i>Error: Failing row violates chk_sa_reason_matches_type</i>", table_cell),
            Paragraph("<b>ACCEPTED:</b> Damaged adjustment with <code>adjustment_type = 'decrease'</code> (ID: 3) saved.", table_cell)
        ],
    ]
    trt = Table(test_results_data, colWidths=[90, 110, 170, TOTAL_WIDTH - 370])
    trt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(trt)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 7. PROBLEMS ENCOUNTERED & FIXES, DBML VS PRISMA DIFFERENCES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Problems Encountered & How They Were Resolved", h1_style))
    story.append(make_presenting_box(
        "\"Real software projects always encounter edge cases. During setup, npm pulled an unreleased Prisma 8 RC with breaking CLI changes, Neon had cold-start latency, and Prisma PSL couldn't express check constraints. I systematically solved each problem: pinned stable Prisma 6.19.3, added wake-up handling for Neon, and extended the generated SQL migration.\""
    ))
    story.append(Spacer(1, 6))

    issues_data = [
        [Paragraph("Problem Encountered", table_header), Paragraph("Root Cause Analysis", table_header), Paragraph("Resolution Implemented", table_header)],
        [
            Paragraph("Prisma CLI Version Mismatch", table_cell_bold),
            Paragraph("Running <code>npm install prisma</code> installed <code>8.0.0-rc.33</code>, but <code>@prisma/client</code> installed <code>7.10.1</code>, breaking CLI flags like <code>--datasource-provider</code>.", table_cell),
            Paragraph("Pinned both packages to the battle-tested, stable release <b>Prisma 6.19.3</b> in <code>server/package.json</code>.", table_cell)
        ],
        [
            Paragraph("Neon Cold Start (Error P1001)", table_cell_bold),
            Paragraph("Neon serverless endpoints automatically scale compute to zero when idle. Initial TCP connection timed out while Neon spun up.", table_cell),
            Paragraph("Configured query retry and ran a lightweight ping query via <code>prisma db execute</code> to warm the instance before running migrations.", table_cell)
        ],
        [
            Paragraph("Prisma PSL Expressiveness Limits", table_cell_bold),
            Paragraph("Prisma schema syntax cannot define CHECK constraints, functions, or database triggers.", table_cell),
            Paragraph("Used <code>prisma migrate dev --create-only</code> to scaffold the baseline DDL, then appended the raw SQL constraints and triggers directly to <code>migration.sql</code>.", table_cell)
        ],
        [
            Paragraph("DBML vs. Prisma Discrepancies", table_cell_bold),
            Paragraph("DBML defines a polymorphic relation in <code>audit_logs</code> (<code>entity_type</code> + <code>entity_id</code>) that has no foreign key to any single table.", table_cell),
            Paragraph("Faithfully modeled in Prisma as scalar fields <code>entityType String</code> and <code>entityId BigInt</code> with index <code>@@index([entityType, entityId])</code> without artificial FKs.", table_cell)
        ],
    ]
    it = Table(issues_data, colWidths=[110, 160, TOTAL_WIDTH - 270])
    it.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(it)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 8. COMMANDS CHEAT SHEET
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Database Commands Cheat Sheet", h1_style))
    story.append(make_presenting_box(
        "\"Here is the exact operational command reference for maintaining and developing this database layer. In production, we always run 'migrate deploy', while in local development we run 'migrate dev'.\""
    ))
    story.append(Spacer(1, 6))

    cmd_data = [
        [Paragraph("Command", table_header), Paragraph("Environment", table_header), Paragraph("What It Does & When to Run It", table_header)],
        [
            Paragraph("<code>npx prisma validate</code>", table_cell_bold),
            Paragraph("Development / CI", table_cell),
            Paragraph("Checks <code>schema.prisma</code> syntax, relation consistency, and attributes without touching the database.", table_cell)
        ],
        [
            Paragraph("<code>npx prisma migrate dev --create-only --name &lt;name&gt;</code>", table_cell_bold),
            Paragraph("Development", table_cell),
            Paragraph("Scaffolds a new migration SQL file from schema diffs without applying it. Allows manual SQL editing (adding checks, triggers).", table_cell)
        ],
        [
            Paragraph("<code>npx prisma migrate dev</code>", table_cell_bold),
            Paragraph("Development", table_cell),
            Paragraph("Applies unapplied migrations, updates the shadow database, records them in <code>_prisma_migrations</code>, and runs <code>prisma generate</code>.", table_cell)
        ],
        [
            Paragraph("<code>npx prisma migrate deploy</code>", table_cell_bold),
            Paragraph("Staging / Production", table_cell),
            Paragraph("Applies pending migrations in production without checking the shadow database or creating new migration files.", table_cell)
        ],
        [
            Paragraph("<code>npx prisma migrate status</code>", table_cell_bold),
            Paragraph("All environments", table_cell),
            Paragraph("Compares migrations in <code>prisma/migrations/</code> against the <code>_prisma_migrations</code> table in the database.", table_cell)
        ],
        [
            Paragraph("<code>npx prisma db seed</code>", table_cell_bold),
            Paragraph("All environments", table_cell),
            Paragraph("Executes the seed script declared in <code>package.json</code> (runs <code>npx tsx prisma/seed.ts</code>) using idempotent upserts.", table_cell)
        ],
        [
            Paragraph("<code>npx prisma studio</code>", table_cell_bold),
            Paragraph("Development", table_cell),
            Paragraph("Spins up an interactive local web GUI (typically at port 5555) to visually inspect and browse tables and relations.", table_cell)
        ],
    ]
    ct = Table(cmd_data, colWidths=[150, 80, TOTAL_WIDTH - 230])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, ALT_ROW]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(ct)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 9. WHAT COMES NEXT (APIs) & DATABASE GUARANTEES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("9. What Comes Next (API Layer) & What the Database Guarantees", h1_style))
    story.append(make_presenting_box(
        "\"The database is the ultimate source of truth. It guarantees zero negative stock, immutable ledger history, and valid math. The upcoming API layer can focus purely on business workflows, over-receiving validations, and user permissions, knowing the database will never allow corrupt data.\""
    ))
    story.append(Spacer(1, 6))

    guarantees_data = [
        [Paragraph("Already Guaranteed by the Database Layer", table_header), Paragraph("Must Be Enforced by the Next API Layer", table_header)],
        [
            Paragraph("&bull; <b>No Negative Stock:</b> <code>chk_bal_no_negative_stock</code> guarantees <code>quantity_on_hand &gt;= 0</code>.<br/>"
                      "&bull; <b>Immutable Ledger:</b> Trigger completely blocks UPDATE and DELETE on <code>stock_movements</code>.<br/>"
                      "&bull; <b>Single Movement Source:</b> <code>num_nonnulls(...) = 1</code> guarantees every movement links to exactly one source line.<br/>"
                      "&bull; <b>Accurate Order Math:</b> <code>line_total = quantity * unit_price</code> enforced by check.<br/>"
                      "&bull; <b>Damaged Inventory Rule:</b> Damaged or lost items can never increase stock.<br/>"
                      "&bull; <b>Rejection Audit:</b> Rejected stock requests require both a reviewer ID and rejection reason text.<br/>"
                      "&bull; <b>Historical Integrity:</b> <code>onDelete: Restrict</code> ensures master records cannot be cascaded away.", table_cell),
            Paragraph("&bull; <b>Over-Receiving Checks:</b> Verify that <code>quantity_received</code> across all receipts does not exceed <code>quantity_ordered</code>.<br/>"
                      "&bull; <b>Over-Issuing Checks:</b> Verify that <code>quantity_issued</code> does not exceed approved requested quantity.<br/>"
                      "&bull; <b>Row-Level Locking Concurrency:</b> Lock <code>inventory_balances</code> with <code>SELECT ... FOR UPDATE</code> during stock movements in ascending <code>product_id</code> order to avoid deadlocks.<br/>"
                      "&bull; <b>Smart Alerting Logic:</b> Recalculate <code>alert_level</code> and insert notifications only when the tier worsens.<br/>"
                      "&bull; <b>Express Auth & RBAC:</b> Verify JWTs and check role codes (<code>admin</code>, <code>inventory_manager</code>, <code>employee</code>) in route middleware.", table_cell)
        ]
    ]
    gt = Table(guarantees_data, colWidths=[TOTAL_WIDTH*0.5, TOTAL_WIDTH*0.5])
    gt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COL),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(gt)
    story.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════════════════════════
    # 10. 20 LIKELY INTERVIEW QUESTIONS & HONEST ANSWERS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("10. 20 Likely Mentor Interview Questions & Defense Answers", h1_style))
    story.append(make_presenting_box(
        "\"Here are 20 anticipated questions a senior backend mentor might ask, with concise, honest, and technically accurate answers drawn directly from our implementation.\""
    ))
    story.append(Spacer(1, 6))

    qa_list = [
        ("Q1: Why did you use Prisma ORM alongside PostgreSQL on Neon?",
         "Prisma provides full type safety, autocompletion in TypeScript, automatic migrations, and declarative schema modeling. PostgreSQL on Neon provides rock-solid ACID compliance, native relational constraints, and serverless compute."),

        ("Q2: Why does schema.prisma have both url and directUrl?",
         "Neon uses PgBouncer connection pooling for normal queries (DATABASE_URL). But PgBouncer runs in transaction pooling mode and blocks session-level advisory locks. Prisma Migrate needs those locks to avoid race conditions, so directUrl points to the unpooled direct TCP connection (DATABASE_URL_UNPOOLED)."),

        ("Q3: Why did you edit the generated migration file instead of using pure Prisma?",
         "Prisma Schema Language cannot define SQL CHECK constraints, functions, or triggers. By using 'prisma migrate dev --create-only', we let Prisma scaffold the table structures, and then appended raw SQL for the 17 business checks, num_nonnulls() rule, and append-only trigger before applying it."),

        ("Q4: What does onDelete: Restrict do, and why did you use it on all foreign keys?",
         "It prevents deleting a parent row if child rows reference it. For example, you cannot delete a department if employees belong to it, or delete a product with existing stock movements. We use soft-deletes (is_active) instead to preserve audit history."),

        ("Q5: Why are users and employees separated into two distinct tables?",
         "An employee is a physical person who can receive office supplies. A user is an authenticated login account. In an office, all 100 staff might be employees, but only 5 might need system logins (Admin and Inventory Managers)."),

        ("Q6: Why did you use 3 fixed roles instead of an extensible permissions table?",
         "The system only has three fixed roles: admin, inventory_manager, and employee. Adding a permissions and role_permissions table would create unnecessary join overhead for a static RBAC model. Role checks are cleanly handled in Express middleware."),

        ("Q7: What is the relationship between inventory_balances and stock_movements?",
         "stock_movements is the append-only ledger and single source of truth. inventory_balances is a derived read cache (1:1 with products). Every stock change inserts a ledger row and updates the balance row in the same transaction."),

        ("Q8: Why not calculate current stock on the fly with SUM(quantity_change)?",
         "Summing millions of ledger rows on every dashboard load or stock query causes severe table-scan performance penalties. Storing the cached balance in inventory_balances under a CHECK (quantity_on_hand >= 0) gives instant O(1) reads."),

        ("Q9: How will the API prevent race conditions when two users issue stock simultaneously?",
         "The API stock service will lock the product's inventory_balances row using SELECT ... FOR UPDATE before computing the new balance and inserting the ledger movement. For multiple products, locks will be acquired in ascending product_id order to prevent deadlocks."),

        ("Q10: What is num_nonnulls() and why is it used on stock_movements?",
         "PostgreSQL's num_nonnulls() counts how many arguments are not null. chk_mov_single_source enforces num_nonnulls(goods_receipt_item_id, stock_issue_item_id, stock_adjustment_id) = 1, proving every movement has exactly one source."),

        ("Q11: Why enforce append-only immutability with a PostgreSQL trigger instead of API logic?",
         "API validations can be bypassed by manual database queries, seed scripts, or raw SQL. A database trigger runs on every single UPDATE or DELETE statement at the database engine level, guaranteeing the ledger is truly tamper-proof."),

        ("Q12: Why does stock_adjustments have a constraint for damaged and lost items?",
         "If an item is marked 'damaged' or 'lost', physical inventory has decreased. chk_sa_reason_matches_type ensures nobody can accidentally record a damaged adjustment with adjustment_type = 'increase'."),

        ("Q13: How does partial delivery work when 20 keyboards are ordered and 12 arrive first?",
         "A PO item is created for 20. The first delivery creates a goods_receipt with a goods_receipt_item of 12 (increasing stock by +12). Outstanding quantity (8) is computed as quantity_ordered - SUM(quantity_received), moving PO status to partially_received."),

        ("Q14: Does creating a Purchase Order or submitting a Stock Request change stock levels?",
         "No. Purchase orders and stock requests are planning documents. Stock only moves upon physical deliveries (goods_receipt_items), employee handovers (stock_issue_items), or approved manual adjustments (stock_adjustments)."),

        ("Q15: What is the difference between prisma migrate dev and prisma migrate deploy?",
         "migrate dev is for local development: it creates new migrations, compares against a shadow database, and triggers seeding. migrate deploy is for staging/production: it strictly applies existing unapplied migrations without altering schema files."),

        ("Q16: How do you know the CHECK constraints actually work in the database?",
         "We executed server/prisma/verify.ts which issued deliberate invalid SQL queries (e.g. quantity_on_hand = -5, quantity_ordered = 0, dual movement sources). PostgreSQL rejected every one with check constraint violation errors."),

        ("Q17: Why did you use BigInt for stock_movements and audit_logs instead of Int?",
         "Int is a 32-bit signed integer capped at 2,147,483,647 rows. In active warehouses, audit logs and movement ledgers accumulate millions of rows quickly. BigInt (64-bit) prevents primary key integer overflow."),

        ("Q18: Why did you store total_amount on purchase_orders if it can be calculated from items?",
         "total_amount represents the legally agreed document grand total at order placement time. Storing it on the header avoids repeating aggregation queries, and chk_po_total_nonneg guarantees it cannot be negative."),

        ("Q19: How do you prevent sensitive database credentials from leaking to GitHub?",
         "Both .gitignore files explicitly ignore .env and .env.*. A sanitized template server/.env.example was created with placeholder URLs. Git history was verified before pushing to confirm no credentials were tracked."),

        ("Q20: What is the notification alert rule and why not notify on every stock decrease?",
         "If we sent alerts on every decrease, managers would get spammed repeatedly while low stock persists. Notifications are triggered ONLY when a product degrades into a worse alert tier (e.g. normal to low, or low to critical).")
    ]

    for q, a in qa_list:
        qa_data = [
            [Paragraph(f"<b>{q}</b>", h2_style)],
            [Paragraph(a, body_style)]
        ]
        qa_t = Table(qa_data, colWidths=[TOTAL_WIDTH])
        qa_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), ALT_ROW),
            ('BACKGROUND', (0,1), (-1,1), WHITE),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COL),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(qa_t)
        story.append(Spacer(1, 3))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF report successfully generated at: {output_path}")

if __name__ == '__main__':
    target = os.path.join('docs', 'schema-implementation-report.pdf')
    create_report(target)
