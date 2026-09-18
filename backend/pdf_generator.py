from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image,
    HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Helvetica (the default base-14 PDF font) has no glyph for the Rupee sign
# (U+20B9) and silently renders it as a tofu box. DejaVu Sans does, so it's
# bundled under assets/fonts and used anywhere currency is printed.
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts")
try:
    pdfmetrics.registerFont(TTFont("DejaVuSans", os.path.join(_FONT_DIR, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", os.path.join(_FONT_DIR, "DejaVuSans-Bold.ttf")))
except Exception:
    pass

# =====================================================
# Invoice PDF
# =====================================================

def generate_invoice(invoice):
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = f"pdfs/invoice_{invoice.id}.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    # ---- Brand palette (matches the portal's navy/gold design system) ----
    NAVY = HexColor("#0f172a")
    GOLD = HexColor("#f59e0b")
    GOLD_LIGHT = HexColor("#fbbf24")
    SLATE = HexColor("#334155")
    MUTED = HexColor("#94a3b8")
    BORDER = HexColor("#e2e8f0")
    BG_ALT = HexColor("#f8fafc")
    GREEN = HexColor("#16a34a")
    GREEN_BG = HexColor("#dcfce7")
    AMBER_TEXT = HexColor("#b45309")
    AMBER_BG = HexColor("#fef3c7")
    RED = HexColor("#dc2626")
    RED_BG = HexColor("#fee2e2")

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=18 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    kv_style = ParagraphStyle("KV", parent=styles["Normal"], leading=15, spaceAfter=8)
    plain_style = ParagraphStyle("Plain", parent=styles["Normal"], textColor=SLATE, fontSize=9, leading=13)
    section_label_style = ParagraphStyle(
        "SectionLabel", parent=styles["Normal"], textColor=MUTED, fontSize=8.5,
        fontName="Helvetica-Bold", leading=11, spaceAfter=6,
    )
    note_style = ParagraphStyle("Note", parent=styles["Normal"], textColor=SLATE, fontSize=9, leading=13)
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], textColor=MUTED, fontSize=8, alignment=1, leading=11)

    def kv(label, value, value_color="#0f172a", value_size=11.5):
        return Paragraph(
            f"<font color='#94a3b8' size='8'><b>{label.upper()}</b></font><br/>"
            f"<font color='{value_color}' size='{value_size}'><b>{value}</b></font>",
            kv_style,
        )

    elements = []

    # =====================================================
    # Header banner
    # =====================================================
    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=32 * mm, height=12.5 * mm)
    else:
        logo_cell = ""

    brand_text = Paragraph(
        "<font color='#ffffff' size='16'><b>Krish Naik Academy</b></font><br/>"
        "<font color='#fbbf24' size='8.5'>Operations Management Portal</font>",
        ParagraphStyle("Brand", parent=styles["Normal"], leading=16),
    )

    invoice_no_text = invoice.invoice_number or "DRAFT — PENDING"
    doc_title = Paragraph(
        "<font color='#fbbf24' size='20'><b>INVOICE</b></font><br/>"
        f"<font color='#ffffff' size='9.5'>#{invoice_no_text}</font>",
        ParagraphStyle("DocTitle", parent=styles["Normal"], alignment=2, leading=23),
    )

    header_left = Table([[logo_cell, brand_text]], colWidths=[36 * mm, 82 * mm])
    header_left.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    header = Table([[header_left, doc_title]], colWidths=[118 * mm, 60 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 16 * mm),
        ("RIGHTPADDING", (1, 0), (1, 0), 12 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD, spaceBefore=0, spaceAfter=18))

    # =====================================================
    # Bill To  /  Invoice Details
    # =====================================================
    status = str(invoice.payment_status or "Pending").upper()

    if status == "PAID":
        badge_bg, badge_fg = GREEN_BG, GREEN
    elif status == "PENDING":
        badge_bg, badge_fg = AMBER_BG, AMBER_TEXT
    else:
        badge_bg, badge_fg = RED_BG, RED

    badge_style = ParagraphStyle(
        "Badge", parent=styles["Normal"], textColor=badge_fg, fontSize=9,
        fontName="Helvetica-Bold", alignment=1, leading=11,
    )
    status_badge = Table([[Paragraph(f"● {status}", badge_style)]], colWidths=[34 * mm])
    status_badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), badge_bg),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))

    bill_to_cell = [
        Paragraph("BILL TO", section_label_style),
        Paragraph(f"<b>{invoice.mentor_name}</b>", ParagraphStyle("MentorName", parent=styles["Normal"], textColor=NAVY, fontSize=13, leading=16)),
    ]
    if invoice.mentor_email:
        bill_to_cell.append(Paragraph(invoice.mentor_email, plain_style))

    details_cell = [
        Paragraph("INVOICE DETAILS", section_label_style),
        kv("Date Issued", datetime.now().strftime("%d %b %Y"), value_size=10.5),
        kv("Batch", invoice.batch_name, value_size=10.5),
        kv("Billing Month", invoice.month, value_size=10.5),
        status_badge,
    ]

    info_table = Table([[bill_to_cell, details_cell]], colWidths=[89 * mm, 89 * mm])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # =====================================================
    # Line items
    # =====================================================
    rate_val = float(invoice.hourly_rate or 0)
    amount_val = float(invoice.total_amount or 0)

    item_header_style = ParagraphStyle("ItemHeader", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")
    item_desc_style = ParagraphStyle("ItemDesc", parent=styles["Normal"], textColor=NAVY, fontSize=10.5, fontName="Helvetica-Bold", leading=14)
    item_value_style = ParagraphStyle("ItemValue", parent=styles["Normal"], textColor=SLATE, fontSize=10.5, fontName="DejaVuSans", alignment=2)

    items_data = [
        [
            Paragraph("DESCRIPTION", item_header_style),
            Paragraph("SESSIONS", item_header_style),
            Paragraph("HOURS", item_header_style),
            Paragraph("RATE", item_header_style),
            Paragraph("AMOUNT", ParagraphStyle("ItemHeaderR", parent=item_header_style, alignment=2)),
        ],
        [
            Paragraph(f"Mentoring Services — {invoice.batch_name} ({invoice.month})", item_desc_style),
            Paragraph(str(invoice.total_sessions), item_value_style),
            Paragraph(f"{invoice.total_hours} hrs", item_value_style),
            Paragraph(f"₹ {rate_val:,.2f}", item_value_style),
            Paragraph(f"₹ {amount_val:,.2f}", ParagraphStyle("ItemAmount", parent=item_value_style, fontName="DejaVuSans-Bold", textColor=NAVY)),
        ],
    ]

    items_table = Table(items_data, colWidths=[56 * mm, 26 * mm, 22 * mm, 30 * mm, 44 * mm])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("LINEBELOW", (0, 1), (-1, 1), 0.75, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (0, -1), 10),
        ("RIGHTPADDING", (-1, 0), (-1, -1), 10),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 14))

    # =====================================================
    # Total payable
    # =====================================================
    total_table = Table(
        [[
            Paragraph("<font color='#0f172a' size='12'><b>TOTAL PAYABLE</b></font>", ParagraphStyle("TotalLabel", parent=styles["Normal"])),
            Paragraph(
                f"₹ {amount_val:,.2f}",
                ParagraphStyle("TotalValue", parent=styles["Normal"], alignment=2, fontName="DejaVuSans-Bold", fontSize=16, textColor=NAVY),
            ),
        ]],
        colWidths=[89 * mm, 89 * mm],
    )
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD_LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 20))

    # =====================================================
    # Note
    # =====================================================
    note_table = Table(
        [[Paragraph(
            "<b>Thank you for your mentorship contribution this cycle.</b><br/>"
            "Payment is processed as per the standard Krish Naik Academy billing cycle. "
            "For any billing queries, please reach out to the operations team.",
            note_style,
        )]],
        colWidths=[178 * mm],
    )
    note_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(note_table)
    elements.append(Spacer(1, 26))

    # =====================================================
    # Footer
    # =====================================================
    elements.append(HRFlowable(width="100%", thickness=0.75, color=BORDER, spaceAfter=10))
    elements.append(Paragraph(
        f"Krish Naik Academy &nbsp;·&nbsp; Generated on {datetime.now().strftime('%d %b %Y, %I:%M %p')} "
        "&nbsp;·&nbsp; This is a system-generated invoice and does not require a signature.",
        footer_style,
    ))

    doc.build(elements)

    return filename

# =====================================================
# Webinar Analytics PDF
# =====================================================

def _webinar_health_status(score):
    score = score or 0
    if score >= 85:
        return "Excellent", HexColor("#15803d"), HexColor("#dcfce7")
    if score >= 70:
        return "Good", HexColor("#1d4ed8"), HexColor("#dbeafe")
    if score >= 50:
        return "Needs Improvement", HexColor("#b45309"), HexColor("#fef3c7")
    return "Poor", HexColor("#b91c1c"), HexColor("#fee2e2")


def _webinar_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(
        105 * mm,
        10 * mm,
        f"Krish Naik Academy  ·  Webinar Analytics Report  ·  Page {doc_obj.page}",
    )
    canvas_obj.restoreState()


def generate_webinar_report(report):

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = f"pdfs/webinar_{report.session_id}.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=22 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "WbTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22,
    )
    subtitle_style = ParagraphStyle(
        "WbSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13,
    )
    section_style = ParagraphStyle(
        "WbSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "WbBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14,
    )
    kpi_label_style = ParagraphStyle(
        "WbKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5,
        fontName="Helvetica-Bold", alignment=1, leading=10,
    )
    kpi_value_style = ParagraphStyle(
        "WbKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1,
    )
    info_label_style = ParagraphStyle(
        "WbInfoLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5,
        fontName="Helvetica-Bold", leading=10,
    )
    info_value_style = ParagraphStyle(
        "WbInfoValue", parent=styles["Normal"], textColor=NAVY, fontSize=10.5, fontName="Helvetica-Bold", leading=14,
    )

    def g(field, default=0):
        val = getattr(report, field, default)
        return default if val is None else val

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows.append(labels)
            rows.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    elements = []

    # =====================================================
    # Header banner
    # =====================================================
    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Webinar Analytics Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y, %I:%M %p')}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    # =====================================================
    # Webinar identity + health badge
    # =====================================================
    health_score = g("webinar_health_score", 0)
    health_label, health_fg, health_bg = _webinar_health_status(health_score)

    badge_style = ParagraphStyle(
        "WbBadge", parent=styles["Normal"], textColor=health_fg, fontSize=9,
        fontName="Helvetica-Bold", alignment=1, leading=11,
    )
    health_badge = Table(
        [[Paragraph(f"● {health_label.upper()} — {health_score}/100", badge_style)]],
        colWidths=[70 * mm],
    )
    health_badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), health_bg),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))

    identity_cell = [
        Paragraph("WEBINAR", info_label_style),
        Paragraph(g("webinar_title", "—"), ParagraphStyle("WbTitleNavy", parent=styles["Normal"], textColor=NAVY, fontSize=15, fontName="Helvetica-Bold", leading=18)),
        Paragraph(
            f"{g('mentor_name', '—')} &nbsp;·&nbsp; {g('session_date', '—')} {g('session_time', '')}",
            body_style,
        ),
    ]

    identity_table = Table([[identity_cell, health_badge]], colWidths=[108 * mm, 70 * mm])
    identity_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(identity_table)
    elements.append(Spacer(1, 14))

    # =====================================================
    # Webinar Information
    # =====================================================
    elements.append(bullet("Webinar Information"))
    info_rows = [
        ("Mentor Email", g("mentor_email", "—")), ("Meeting ID", g("meeting_id", "—")),
        ("Duration", f"{g('duration')} mins"), ("Platform", g("platform", "—")),
        ("Status", g("webinar_status", "—")),
    ]
    info_pairs_table_rows = []
    for i in range(0, len(info_rows), 2):
        row = info_rows[i:i + 2]
        cells = []
        for label, value in row:
            cells.append([Paragraph(label.upper(), info_label_style), Paragraph(str(value), info_value_style)])
        while len(cells) < 2:
            cells.append([Paragraph("", info_label_style), Paragraph("", info_value_style)])
        info_pairs_table_rows.append(cells)

    info_table = Table(
        [[cells[0], cells[1]] for cells in info_pairs_table_rows],
        colWidths=[89 * mm, 89 * mm],
    )
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))

    # =====================================================
    # Registration & Attendance
    # =====================================================
    elements.append(bullet("Registration & Attendance"))
    elements.append(kpi_grid([
        ("Registered", g("registered_learners")),
        ("Attended", g("attended_learners")),
        ("Attendance Rate", f"{g('attendance_rate')}%"),
        ("No Shows", g("no_show_learners")),
        ("No Show Rate", f"{g('no_show_rate')}%"),
        ("Peak Concurrent", g("peak_concurrent_users")),
        ("Avg Watch Time", f"{g('average_watch_time')} min"),
        ("Late Joiners", g("late_joiners")),
    ]))
    elements.append(Spacer(1, 10))

    # =====================================================
    # Poll Reports
    # =====================================================
    elements.append(bullet("Poll Reports"))
    elements.append(kpi_grid([
        ("Polls Conducted", g("polls_conducted")),
        ("Responses", g("poll_responses")),
        ("Response Rate", f"{g('poll_response_rate')}%"),
        ("Average Rating", f"{g('poll_average_rating')}/5"),
    ]))

    remarks = g("remarks", "")
    if remarks:
        elements.append(Spacer(1, 10))
        elements.append(bullet("Remarks"))
        elements.append(Paragraph(str(remarks), body_style))

    doc.build(elements, onFirstPage=_webinar_footer, onLaterPages=_webinar_footer)

    return filename


# =====================================================
# NPS Analytics Report PDF
# =====================================================

NAVY = HexColor("#0f172a")
YELLOW = HexColor("#facc15")
SLATE = HexColor("#334155")
GREEN = HexColor("#16a34a")
AMBER = HexColor("#f59e0b")
RED = HexColor("#dc2626")


def _segment_color(score):
    if score >= 9:
        return GREEN
    if score >= 7:
        return AMBER
    return RED


_SEGMENT_BG = {
    "Promoter": colors.HexColor("#dcfce7"),
    "Passive": colors.HexColor("#fef3c7"),
    "Detractor": colors.HexColor("#fee2e2"),
}

BORDER = colors.HexColor("#e2e8f0")
BG_ALT = colors.HexColor("#f8fafc")
GOLD_LIGHT = HexColor("#fbbf24")


def _footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(
        105 * mm,
        10 * mm,
        f"Krish Naik Academy  ·  NPS Analytics Report  ·  Page {doc_obj.page}",
    )
    canvas_obj.restoreState()


def generate_nps_report(records, insights):

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/nps_report.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=22 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14,
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=body_style, leftIndent=12, bulletIndent=0, spaceAfter=6,
    )
    kpi_label_style = ParagraphStyle(
        "KpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5,
        fontName="Helvetica-Bold", alignment=1, leading=10,
    )
    kpi_value_style = ParagraphStyle(
        "KpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=16, fontName="Helvetica-Bold", alignment=1,
    )
    kpi_value_hero_style = ParagraphStyle(
        "KpiValueHero", parent=kpi_value_style, textColor=colors.HexColor("#b45309"), fontSize=18,
    )

    elements = []

    # =====================================================
    # Header banner
    # =====================================================
    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"NPS Analytics Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    overall = insights["overall"]

    # ---- KPI summary ----
    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;Executive Summary", section_style))

    kpi_labels = ["TOTAL RESPONSES", "AVG SCORE (0-10)", "NPS SCORE", "PROMOTERS", "PASSIVES", "DETRACTORS"]
    kpi_values = [
        str(overall["total"]), str(overall["avg_nps_score"]), str(overall["nps_score"]),
        str(overall["promoters"]), str(overall["passives"]), str(overall["detractors"]),
    ]

    kpi_data = [
        [Paragraph(lbl, kpi_label_style) for lbl in kpi_labels],
        [
            Paragraph(kpi_values[0], kpi_value_style),
            Paragraph(kpi_values[1], kpi_value_style),
            Paragraph(kpi_values[2], kpi_value_hero_style),
            Paragraph(kpi_values[3], kpi_value_style),
            Paragraph(kpi_values[4], kpi_value_style),
            Paragraph(kpi_values[5], kpi_value_style),
        ],
    ]
    kpi_table = Table(kpi_data, colWidths=[29.67 * mm] * 6)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#fef3c7")),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEAFTER", (0, 0), (-2, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;Average Ratings", section_style))

    rating_data = [["Category", "Score / 5"]] + [
        [r["label"], f"{r['value']:.2f}"] for r in insights["rating_breakdown"]
    ]
    rating_table = Table(rating_data, colWidths=[89 * mm, 89 * mm])
    rating_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elements.append(rating_table)

    # ---- Segment breakdowns needing attention ----
    def breakdown_section(title, rows):
        elements.append(Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style))

        if not rows:
            elements.append(Paragraph("Not enough data yet.", body_style))
            return

        data = [["Name", "Responses", "NPS Score", "Avg Rating"]] + [
            [r["name"], str(r["responses"]), str(r["nps_score"]), f"{r['avg_rating']:.2f}"]
            for r in rows[:5]
        ]
        table = Table(data, colWidths=[70 * mm, 36 * mm, 36 * mm, 36 * mm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ]))
        elements.append(table)

    breakdown_section("Mentors Needing Attention (lowest NPS first)", insights["by_mentor"])
    breakdown_section("Courses Needing Attention (lowest NPS first)", insights["by_course"])
    breakdown_section("Batches Needing Attention (lowest NPS first)", insights["by_batch"])

    # ---- Learner concerns ----
    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;Recurring Themes in Learner Feedback", section_style))

    if insights["concern_keywords"]:
        concern_text = ", ".join(
            f"{k['word']} ({k['count']})" for k in insights["concern_keywords"]
        )
        elements.append(Paragraph(f"<b>Constructive feedback themes:</b> {concern_text}", body_style))
    else:
        elements.append(Paragraph("No recurring themes detected yet in constructive feedback.", body_style))

    elements.append(Spacer(1, 6))

    if insights["praise_keywords"]:
        praise_text = ", ".join(
            f"{k['word']} ({k['count']})" for k in insights["praise_keywords"]
        )
        elements.append(Paragraph(f"<b>What learners praise most:</b> {praise_text}", body_style))

    # ---- Automated insights summary ----
    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;Automated Insights Summary", section_style))

    summary_data = [[row["label"], row["value"]] for row in insights["automated_insights_table"]]
    summary_table = Table(summary_data, colWidths=[89 * mm, 89 * mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BG_ALT),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 4))

    # ---- Business recommendations ----
    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;Business Recommendations", section_style))

    for rec in insights["recommendations"]:
        elements.append(Paragraph(f"&bull;&nbsp; <b>{rec['title']}.</b> {rec['text']}", bullet_style))

    # ---- Full response table ----
    elements.append(Paragraph("<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;All Responses", section_style))

    table_header = ["Learner", "Course", "Batch", "Mentor", "Score", "Segment"]
    table_rows = [table_header]
    segments = []

    for r in records:
        score = r.nps_score
        if score >= 9:
            segment = "Promoter"
        elif score >= 7:
            segment = "Passive"
        else:
            segment = "Detractor"

        segments.append(segment)
        table_rows.append([
            r.learner_name, r.course_name, r.batch_name, r.mentor_name, str(score), segment,
        ])

    response_table = Table(
        table_rows,
        colWidths=[38 * mm, 34 * mm, 30 * mm, 34 * mm, 16 * mm, 26 * mm],
        repeatRows=1,
    )

    row_styles = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
        ("ALIGN", (4, 1), (4, -1), "CENTER"),
    ]

    for i, (r, segment) in enumerate(zip(records, segments), start=1):
        row_styles.append(("TEXTCOLOR", (5, i), (5, i), _segment_color(r.nps_score)))
        row_styles.append(("FONTNAME", (5, i), (5, i), "Helvetica-Bold"))
        row_styles.append(("BACKGROUND", (5, i), (5, i), _SEGMENT_BG[segment]))
        row_styles.append(("ALIGN", (5, i), (5, i), "CENTER"))

    response_table.setStyle(TableStyle(row_styles))
    elements.append(response_table)

    doc.build(elements, onFirstPage=_footer, onLaterPages=_footer)

    return filename


# =====================================================
# Analytics Dashboard Report PDF
# =====================================================

def _analytics_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(
        105 * mm,
        10 * mm,
        f"Krish Naik Academy  ·  Analytics Report  ·  Page {doc_obj.page}",
    )
    canvas_obj.restoreState()


def generate_analytics_report(data, filter_desc="All data"):
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/analytics_report.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=22 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "AnTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22,
    )
    subtitle_style = ParagraphStyle(
        "AnSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13,
    )
    section_style = ParagraphStyle(
        "AnSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8,
    )
    section_note_style = ParagraphStyle(
        "AnSectionNote", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=8.5, spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "AnBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14,
    )
    kpi_label_style = ParagraphStyle(
        "AnKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5,
        fontName="Helvetica-Bold", alignment=1, leading=10,
    )
    kpi_value_style = ParagraphStyle(
        "AnKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1,
    )

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows.append(labels)
            rows.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    def data_table(headers, rows, col_widths, empty_message="No data yet."):
        if not rows:
            return Paragraph(empty_message, body_style)

        header_cells = [Paragraph(h, ParagraphStyle("AnTH", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")) for h in headers]
        table_data = [header_cells] + rows
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    elements = []

    # ---- Header ----
    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Analytics Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)],
         [Paragraph(f"Scope: {filter_desc}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    def pct(v):
        return "—" if v is None else f"{round(v)}%"

    def num1(v):
        return "—" if v is None else round(v, 1)

    es = data["executive_summary"]
    elements.append(bullet("Executive Operations Summary"))
    elements.append(kpi_grid([
        ("Total Sessions", es["total_sessions"]),
        ("Completed", es["completed_sessions"]),
        ("Cancelled", es["cancelled_sessions"]),
        ("Upcoming", es["upcoming_sessions"]),
        ("Total Mentors", es["total_mentors"]),
        ("Active Mentors", es["active_mentors"]),
        ("Total Batches", es["total_batches"]),
        ("Active Batches", es["active_batches"]),
        ("Total Session Hours", f"{es['total_session_hours']}h"),
        ("Avg Attendance", pct(es["avg_attendance"])),
        ("Avg Session Rating", f"{num1(es['avg_session_rating'])} / 5" if es["avg_session_rating"] is not None else "—"),
        ("Mentor SLA", pct(es["mentor_sla"])),
    ]))
    elements.append(Spacer(1, 10))

    ss = data["session_summary"]
    elements.append(bullet("Session Analytics"))
    elements.append(kpi_grid([
        ("Total Sessions", ss["total_sessions"]),
        ("Completed", ss["completed_sessions"]),
        ("Cancelled", ss["cancelled_sessions"]),
        ("Rescheduled", ss["rescheduled_sessions"]),
        ("Upcoming", ss["upcoming_sessions"]),
        ("Total Hours", f"{ss['total_hours']}h"),
        ("Avg Duration", f"{num1(ss['avg_duration_hours'])}h" if ss["avg_duration_hours"] is not None else "—"),
        ("Avg Attendance", pct(ss["avg_attendance"])),
    ]))
    if data["session_issues"]:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph("<b>Session Issues</b>", body_style))
        for issue in data["session_issues"]:
            elements.append(Paragraph(f"&#8226; {issue['value']} {issue['label']}", body_style))
    elements.append(Spacer(1, 10))

    ms = data["mentor_summary"]
    elements.append(bullet("Mentor Analytics"))
    elements.append(kpi_grid([
        ("Total Mentors", ms["total_mentors"]),
        ("Active Mentors", ms["active_mentors"]),
        ("Sessions Conducted", ms["sessions_conducted"]),
        ("Total Mentor Hours", f"{ms['total_mentor_hours']}h"),
        ("Avg Rating", f"{num1(ms['avg_rating'])} / 5" if ms["avg_rating"] is not None else "—"),
        ("Avg Attendance", pct(ms["avg_attendance"])),
        ("Mentor SLA", pct(ms["avg_sla"])),
    ]))
    elements.append(Spacer(1, 8))
    mp_rows = [
        [m["name"], str(m["sessions"]), f"{m['hours']}h", pct(m["attendance"]), num1(m["teaching"]), num1(m["doubt"]), num1(m["overall"]), pct(m["sla"])]
        for m in data["mentor_stats"]
    ]
    elements.append(data_table(
        ["Mentor", "Sessions", "Hours", "Attendance", "Teaching", "Doubt", "Overall", "SLA"],
        mp_rows,
        [32 * mm, 20 * mm, 18 * mm, 24 * mm, 20 * mm, 18 * mm, 20 * mm, 20 * mm],
        "No mentor data matches this scope.",
    ))
    elements.append(Spacer(1, 10))

    bs = data["batch_summary"]
    elements.append(bullet("Batch Analytics"))
    elements.append(kpi_grid([
        ("Total Batches", bs["total_batches"]),
        ("Active Batches", bs["active_batches"]),
        ("Completed", bs["completed_batches"]),
        ("Total Sessions", bs["total_sessions"]),
        ("Avg Attendance", pct(bs["avg_attendance"])),
        ("Avg Rating", f"{num1(bs['avg_rating'])} / 5" if bs["avg_rating"] is not None else "—"),
        ("Completion Rate", pct(bs["avg_completion"])),
    ]))
    elements.append(Spacer(1, 8))
    bp_rows = [
        [b["batch_name"], f"{b['completed_count']} / {b['sessions']}", pct(b["attendance"]), num1(b["rating"]), pct(b["completion"]), b["health"]]
        for b in data["batch_stats"]
    ]
    elements.append(data_table(
        ["Batch", "Sessions", "Attendance", "Rating", "Completion", "Health"],
        bp_rows,
        [42 * mm, 26 * mm, 26 * mm, 20 * mm, 26 * mm, 32 * mm],
        "No batches match this scope.",
    ))
    elements.append(Spacer(1, 10))

    fs = data["feedback_summary"]
    elements.append(bullet("Session Feedback Analytics"))
    elements.append(kpi_grid([
        ("Responses", fs["responses"]),
        ("Avg Overall Rating", f"{num1(fs['avg_overall_rating'])} / 5" if fs["avg_overall_rating"] is not None else "—"),
        ("Teaching Method", num1(fs["avg_teaching"])),
        ("Doubt Handling", num1(fs["avg_doubt"])),
        ("Overall Experience", num1(fs["avg_overall_experience"])),
        ("Positive Feedback", f"{round(fs['positive_pct'])}%"),
    ]))
    if data["recent_negative_feedback"]:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Recent Negative Feedback</b>", body_style))
        nf_rows = [
            [n["date"], n["batch_name"], n["mentor_name"], str(n["rating"]), n["feedback"]]
            for n in data["recent_negative_feedback"]
        ]
        elements.append(data_table(
            ["Date", "Batch", "Mentor", "Rating", "Feedback"],
            nf_rows,
            [22 * mm, 26 * mm, 24 * mm, 16 * mm, 78 * mm],
            "No recent negative feedback.",
        ))
    elements.append(Spacer(1, 10))

    at = data["attendance_summary"]
    elements.append(bullet("Attendance Analytics"))
    elements.append(kpi_grid([
        ("Total Registrations", at["total_registrations"]),
        ("Total Attendees", at["total_attendees"]),
        ("Avg Attendance", pct(at["avg_attendance"])),
        ("Avg Session Duration", f"{num1(at['avg_duration_hours'])}h" if at["avg_duration_hours"] is not None else "—"),
        ("No-Show Rate", pct(at["no_show_rate"])),
    ], per_row=5))
    if data["low_attendance_sessions"]:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Low Attendance Sessions</b>", body_style))
        la_rows = [[s["topic"], f"{s['attendance']}%"] for s in data["low_attendance_sessions"]]
        elements.append(data_table(["Session", "Attendance"], la_rows, [130 * mm, 48 * mm], "No low-attendance sessions."))

    doc.build(elements, onFirstPage=_analytics_footer, onLaterPages=_analytics_footer)

    return filename


def _mentor_360_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(
        105 * mm,
        10 * mm,
        f"Krish Naik Academy  ·  Mentor Business Performance Report  ·  Page {doc_obj.page}",
    )
    canvas_obj.restoreState()


def _mentor_360_issues(row):
    """Rule-based (not AI-generated) plain-language reasons a mentor is at-risk,
    for the PDF's At-Risk Mentors section."""
    issues = []
    rc = row.get("resource_compliance")
    if rc and rc["score"] is not None and rc["score"] < 75:
        issues.append(f"Resource compliance {rc['score']}%")
    delivery = row.get("delivery_performance")
    if delivery and delivery["cancellation_percent"] > 5:
        issues.append(f"Cancellation rate {delivery['cancellation_percent']}%")
    learner = row.get("learner_experience")
    if learner and learner["avg_instructor_rating"] < 4:
        issues.append(f"Instructor rating {learner['avg_instructor_rating']}/5")
    attendance = row.get("attendance_engagement")
    if attendance and attendance["avg_attendance_percent"] < 70:
        issues.append(f"Attendance {attendance['avg_attendance_percent']}%")
    return "; ".join(issues) if issues else "Below overall score threshold"


def generate_mentor_performance_report(data, filter_desc="All data"):
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/mentor_360_report.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=0,
        bottomMargin=22 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "MpTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22,
    )
    subtitle_style = ParagraphStyle(
        "MpSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13,
    )
    section_style = ParagraphStyle(
        "MpSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "MpBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14,
    )
    kpi_label_style = ParagraphStyle(
        "MpKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5,
        fontName="Helvetica-Bold", alignment=1, leading=10,
    )
    kpi_value_style = ParagraphStyle(
        "MpKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1,
    )

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows.append(labels)
            rows.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    def data_table(headers, rows, col_widths, empty_message="No data yet."):
        if not rows:
            return Paragraph(empty_message, body_style)

        header_cells = [Paragraph(h, ParagraphStyle("MpTH", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")) for h in headers]
        table_data = [header_cells] + rows
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    elements = []

    # ---- Header ----
    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Mentor Business Performance Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)],
         [Paragraph(f"Scope: {filter_desc}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    scorecard = data["scorecard"]
    es = data["executive_summary"]

    elements.append(bullet("Executive Summary"))
    elements.append(kpi_grid([
        ("Total Mentors", es["total_mentors"]),
        ("Average Score", es["average_score"]),
        ("Excellent", es["excellent"]),
        ("Strong Performer", es["strong_performer"]),
        ("Needs Attention", es["needs_attention"]),
        ("At Risk", es["at_risk"]),
        ("Critical", es["critical"]),
    ], per_row=4))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Mentor Performance Scorecard"))
    sc_rows = [
        [
            m["mentor_name"],
            str(m["overall_score"]),
            str(m["delivery_performance"]["score"]) if m["delivery_performance"] else "N/A",
            str(m["learner_experience"]["score"]) if m["learner_experience"] else "N/A",
            str(m["session_quality"]["score"]) if m["session_quality"] else "N/A",
            m["risk"],
        ]
        for m in scorecard
    ]
    elements.append(data_table(
        ["Mentor", "Score", "Delivery", "Learner", "Quality", "Risk"],
        sc_rows,
        [46 * mm, 24 * mm, 27 * mm, 27 * mm, 27 * mm, 27 * mm],
        "No mentors match this scope.",
    ))
    elements.append(Spacer(1, 10))

    at_risk = [m for m in scorecard if m["risk"] in ("High", "Critical")]
    elements.append(bullet("At-Risk Mentors"))
    ar_rows = [
        [
            m["mentor_name"],
            m["risk"],
            str(m["overall_score"]),
            _mentor_360_issues(m),
            "Performance Review",
        ]
        for m in at_risk
    ]
    elements.append(data_table(
        ["Mentor", "Risk", "Score", "Main Issues", "Recommended Action"],
        ar_rows,
        [32 * mm, 18 * mm, 18 * mm, 78 * mm, 32 * mm],
        "No at-risk mentors in this scope.",
    ))

    doc.build(elements, onFirstPage=_mentor_360_footer, onLaterPages=_mentor_360_footer)

    return filename


def _webinar_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(105 * mm, 10 * mm, f"Krish Naik Academy  ·  Webinar Operations Report  ·  Page {doc_obj.page}")
    canvas_obj.restoreState()


def generate_webinar_report_pdf(data, filter_desc="All data"):
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/webinar_operations_report.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(filename, pagesize=A4, topMargin=0, bottomMargin=22 * mm, leftMargin=16 * mm, rightMargin=16 * mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("WbTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22)
    subtitle_style = ParagraphStyle("WbSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13)
    section_style = ParagraphStyle("WbSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("WbBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14)
    kpi_label_style = ParagraphStyle("WbKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5, fontName="Helvetica-Bold", alignment=1, leading=10)
    kpi_value_style = ParagraphStyle("WbKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1)

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows.append(labels)
            rows.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    def data_table(headers, rows, col_widths, empty_message="No data yet."):
        if not rows:
            return Paragraph(empty_message, body_style)
        header_cells = [Paragraph(h, ParagraphStyle("WbTH", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")) for h in headers]
        table_data = [header_cells] + rows
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    elements = []

    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Webinar Operations Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)],
         [Paragraph(f"Scope: {filter_desc}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    s = data["summary"]
    elements.append(bullet("Executive Summary"))
    elements.append(kpi_grid([
        ("Total Webinars", s["total_webinars"]),
        ("Completed", s["completed_webinars"]),
        ("Registrations", s["total_registrations"]),
        ("Attendees", s["total_attendees"]),
        ("Avg Attendance", f"{s['average_attendance_percentage']}%" if s["average_attendance_percentage"] is not None else "N/A"),
        ("Avg Rating", f"{s['average_rating']}/5" if s["average_rating"] is not None else "N/A"),
        ("Qualified Leads", s["total_leads"]),
        ("Converted", s["converted_leads"]),
        ("Conversion Rate", f"{s['conversion_rate']}%" if s["conversion_rate"] is not None else "N/A"),
        ("Mentor Payout", f"Rs {s['total_mentor_payout']}"),
    ]))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Webinar Performance"))
    w_rows = [
        [w["Webinar"] or "—", w["Mentor"] or "—", str(w["Registered"]), str(w["Attended"]), f"{w['Attendance %']}%", str(w["Rating"] or "—"), str(w["Qualified Leads"]), w["Payout Status"]]
        for w in data["webinar_rows"]
    ]
    elements.append(data_table(
        ["Webinar", "Mentor", "Reg.", "Att.", "Att %", "Rating", "Leads", "Payout"],
        w_rows,
        [42 * mm, 30 * mm, 16 * mm, 16 * mm, 18 * mm, 18 * mm, 16 * mm, 22 * mm],
        "No webinars match this scope.",
    ))
    elements.append(Spacer(1, 10))

    if data["insights"]["cards"]:
        elements.append(bullet("Business Insights"))
        for card in data["insights"]["cards"]:
            elements.append(Paragraph(f"<b>{card['title']}:</b> {card['message']}", body_style))
            elements.append(Spacer(1, 4))
        elements.append(Spacer(1, 6))

    elements.append(bullet("At-Risk / Follow-up Leads"))
    lead_rows = [
        [l["Name"], l["Email"], l["Webinar"] or "—", l["Lead Status"]]
        for l in data["lead_rows"] if l["Lead Status"] in ("Interested", "Qualified", "Follow-up Required")
    ][:20]
    elements.append(data_table(
        ["Name", "Email", "Webinar", "Lead Status"],
        lead_rows,
        [40 * mm, 55 * mm, 45 * mm, 38 * mm],
        "No pending leads in this scope.",
    ))

    doc.build(elements, onFirstPage=_webinar_footer, onLaterPages=_webinar_footer)

    return filename


# =====================================================
# Session Reports — filtered list PDF (same template as the
# Webinar Operations Report above)
# =====================================================

def _session_reports_list_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(105 * mm, 10 * mm, f"Krish Naik Academy  ·  Session Reports  ·  Page {doc_obj.page}")
    canvas_obj.restoreState()


def generate_session_reports_list_pdf(rows, summary, filter_desc="All data"):
    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/session_reports.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(filename, pagesize=A4, topMargin=0, bottomMargin=22 * mm, leftMargin=16 * mm, rightMargin=16 * mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("SrTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22)
    subtitle_style = ParagraphStyle("SrSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13)
    section_style = ParagraphStyle("SrSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("SrBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14)
    kpi_label_style = ParagraphStyle("SrKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5, fontName="Helvetica-Bold", alignment=1, leading=10)
    kpi_value_style = ParagraphStyle("SrKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1)

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows_ = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows_.append(labels)
            rows_.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows_, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows_), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    def data_table(headers, data_rows, col_widths, empty_message="No data yet."):
        if not data_rows:
            return Paragraph(empty_message, body_style)
        header_cells = [Paragraph(h, ParagraphStyle("SrTH", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")) for h in headers]
        table_data = [header_cells] + data_rows
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    elements = []

    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Session Reports &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)],
         [Paragraph(f"Scope: {filter_desc}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    elements.append(bullet("Executive Summary"))
    elements.append(kpi_grid([
        ("Total Sessions", summary.get("total_sessions", 0)),
        ("Live", summary.get("live_sessions", 0)),
        ("Completed", summary.get("completed_sessions", 0)),
        ("Cancelled", summary.get("cancelled_sessions", 0)),
        ("Upcoming", summary.get("upcoming_sessions", 0)),
        ("Learners Attended", summary.get("total_learners_attended", 0)),
        ("Avg Attendance", f"{summary.get('average_attendance_percentage', 0)}%"),
        ("Avg Duration", f"{summary.get('average_session_duration', 0)} min"),
        ("Avg Rating", f"{summary['average_rating']}/5" if summary.get("average_rating") else "N/A"),
    ]))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Session Reports"))
    body_rows = [
        [
            f"#{r['id']} {r['topic'] or ''}"[:40],
            r["mentor_name"] or "—",
            r["batch_name"] or "—",
            r["session_date"] or "—",
            r["status"] or "—",
            str(r["learner_count"]),
            f"{r['attendance_percentage']}%",
            f"{r['rating']}/5" if r.get("rating") else "—",
        ]
        for r in rows
    ]
    elements.append(data_table(
        ["Session", "Mentor", "Batch", "Date", "Status", "Learners", "Att %", "Rating"],
        body_rows,
        [42 * mm, 30 * mm, 28 * mm, 22 * mm, 20 * mm, 18 * mm, 14 * mm, 16 * mm],
        "No session reports match this scope.",
    ))

    doc.build(elements, onFirstPage=_session_reports_list_footer, onLaterPages=_session_reports_list_footer)

    return filename


# =====================================================
# Session Report PDF
# =====================================================

def _session_report_footer(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(16 * mm, 14 * mm, 194 * mm, 14 * mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawCentredString(105 * mm, 10 * mm, f"Krish Naik Academy  ·  Session Report  ·  Page {doc_obj.page}")
    canvas_obj.restoreState()


def generate_session_report_pdf(bundle, attendance, feedback):
    """bundle is the dict returned by session_reports.session_detail_bundle();
    attendance/feedback are the dicts from attendance_bundle()/feedback_bundle()."""

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    session_id = bundle["session_info"]["id"]
    filename = f"pdfs/session_report_{session_id}.pdf"

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    doc = SimpleDocTemplate(filename, pagesize=A4, topMargin=0, bottomMargin=22 * mm, leftMargin=16 * mm, rightMargin=16 * mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("SrTitleWhite", parent=styles["Normal"], textColor=colors.white, fontSize=18, fontName="Helvetica-Bold", leading=22)
    subtitle_style = ParagraphStyle("SrSubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=10, leading=13)
    section_style = ParagraphStyle("SrSection", parent=styles["Heading2"], textColor=NAVY, fontSize=13, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("SrBody", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14)
    kpi_label_style = ParagraphStyle("SrKpiLabel", parent=styles["Normal"], textColor=colors.HexColor("#94a3b8"), fontSize=7.5, fontName="Helvetica-Bold", alignment=1, leading=10)
    kpi_value_style = ParagraphStyle("SrKpiValue", parent=styles["Normal"], textColor=NAVY, fontSize=14, fontName="Helvetica-Bold", alignment=1)

    def bullet(title):
        return Paragraph(f"<font color='#f59e0b'>&#9679;</font>&nbsp;&nbsp;{title}", section_style)

    def kpi_grid(pairs, per_row=4):
        rows = []
        for i in range(0, len(pairs), per_row):
            chunk = pairs[i:i + per_row]
            labels = [Paragraph(lbl.upper(), kpi_label_style) for lbl, _ in chunk]
            values = [Paragraph(str(val), kpi_value_style) for _, val in chunk]
            while len(labels) < per_row:
                labels.append("")
                values.append("")
            rows.append(labels)
            rows.append(values)

        col_w = (178 / per_row) * mm
        table = Table(rows, colWidths=[col_w] * per_row)
        style = [
            ("BACKGROUND", (0, 0), (-1, -1), BG_ALT),
            ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]
        for r in range(0, len(rows), 2):
            style.append(("TOPPADDING", (0, r), (-1, r), 10))
            style.append(("BOTTOMPADDING", (0, r), (-1, r), 2))
            style.append(("TOPPADDING", (0, r + 1), (-1, r + 1), 2))
            style.append(("BOTTOMPADDING", (0, r + 1), (-1, r + 1), 12))
            if r > 0:
                style.append(("LINEABOVE", (0, r), (-1, r), 0.5, BORDER))
        table.setStyle(TableStyle(style))
        return table

    def data_table(headers, rows, col_widths, empty_message="No data yet."):
        if not rows:
            return Paragraph(empty_message, body_style)
        header_cells = [Paragraph(h, ParagraphStyle("SrTH", parent=styles["Normal"], textColor=colors.white, fontSize=9, fontName="Helvetica-Bold")) for h in headers]
        table_data = [header_cells] + rows
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return table

    def field(label, value):
        return Paragraph(f"<b>{label}:</b> {value if value not in (None, '') else '—'}", body_style)

    elements = []

    if os.path.exists(LOGO_PATH):
        logo_cell = Image(LOGO_PATH, width=30 * mm, height=11.5 * mm)
    else:
        logo_cell = ""

    info = bundle["session_info"]

    header_text = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"Session Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)],
         [Paragraph(f"Session #{info['id']}: {info['topic'] or '—'}", subtitle_style)]],
        colWidths=[130 * mm],
    )
    header_text.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))

    header = Table([[logo_cell, header_text]], colWidths=[38 * mm, 140 * mm])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 6 * mm),
        ("RIGHTPADDING", (0, 0), (0, 0), 2 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(header)
    elements.append(HRFlowable(width="100%", thickness=3, color=GOLD_LIGHT, spaceBefore=0, spaceAfter=18))

    # Session information
    elements.append(bullet("Session Information"))
    elements.append(field("Date / Time", f"{info['session_date'] or '—'} {info['session_time'] or ''}"))
    elements.append(field("Course / Batch", f"{info['course_name'] or '—'} / {info['batch_name'] or '—'}"))
    elements.append(field("Mentor", f"{info['mentor_name'] or '—'} ({info['mentor_email'] or '—'})"))
    elements.append(field("Session Type", info["session_type"]))
    elements.append(field("Status", info["status"]))
    elements.append(Spacer(1, 8))

    # Performance KPIs
    perf = bundle["performance"]
    elements.append(bullet("Session Performance"))
    elements.append(kpi_grid([
        ("Scheduled Duration", f"{perf['scheduled_duration'] or '—'} min"),
        ("Actual Duration", f"{perf['actual_duration'] or '—'} min"),
        ("Attendance %", f"{perf['attendance_percentage']}%"),
        ("SLA Status", perf["sla_status"]),
        ("Completion %", f"{perf['completion_percentage']}%" if perf["completion_percentage"] is not None else "N/A"),
        ("Recording", "Available" if perf["recording_available"] else "Not Available"),
        ("Report Status", bundle["report"]["report_status"]),
        ("Mentor Feedback", "Submitted" if perf["mentor_feedback_submitted"] else "Pending"),
    ]))
    elements.append(Spacer(1, 10))

    # Mentor information
    mentor = bundle["mentor_info"]
    elements.append(bullet("Mentor Information"))
    elements.append(field("Name", mentor["mentor_name"]))
    elements.append(field("Email", mentor["mentor_email"]))
    elements.append(field("Expertise", mentor["expertise"]))
    elements.append(field("Session Count", mentor["session_count"]))
    elements.append(field("Average Feedback Score", mentor["average_feedback_score"]))
    elements.append(Spacer(1, 8))

    # Attendance summary + table
    elements.append(bullet("Attendance Summary"))
    elements.append(kpi_grid([
        ("Total Learners", attendance["total_learners"]),
        ("Present", attendance["present"]),
        ("Absent", attendance["absent"]),
        ("Late", attendance["late"]),
    ]))
    elements.append(Spacer(1, 8))

    learner_rows = [
        [l["learner_name"] or "—", l["learner_email"] or "—", l["join_time"] or "—", l["leave_time"] or "—", l["attendance_status"]]
        for l in attendance["learners"][:40]
    ]
    elements.append(data_table(
        ["Learner", "Email", "Join Time", "Leave Time", "Status"],
        learner_rows,
        [40 * mm, 55 * mm, 26 * mm, 26 * mm, 25 * mm],
        "No individual attendance records captured for this session yet.",
    ))
    elements.append(Spacer(1, 10))

    # Recording
    elements.append(bullet("Recording"))
    elements.append(field("Platform", info.get("platform")))
    elements.append(field("Recording Link", bundle["content"]["recording_link"]))
    elements.append(Spacer(1, 8))

    # Feedback
    elements.append(bullet("Feedback"))
    elements.append(field("Average Rating", feedback["average_rating"]))
    elements.append(field("NPS (approx., matched by batch + mentor)", feedback["nps"]["average_score"]))
    elements.append(field("Mentor Feedback", feedback["mentor_feedback"]))
    elements.append(field("Operations Feedback", feedback["operations_feedback"]))
    elements.append(Spacer(1, 8))

    # Session notes / report
    report = bundle["report"]
    elements.append(bullet("Session Notes"))
    elements.append(field("Summary", report["summary"]))
    elements.append(field("Topics Covered", report["topics_covered"]))
    elements.append(field("Issues Faced", report["issues_faced"]))
    elements.append(field("Technical Issues", report["technical_issues"]))
    elements.append(field("Action Items", report["action_items"]))
    elements.append(field("Follow-up Required", "Yes" if report["follow_up_required"] else "No"))
    elements.append(field("Follow-up Date", report["follow_up_date"]))

    doc.build(elements, onFirstPage=_session_report_footer, onLaterPages=_session_report_footer)

    return filename

