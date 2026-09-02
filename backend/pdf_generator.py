from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
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

def generate_webinar_report(report):

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = f"pdfs/webinar_{report.session_id}.pdf"

    c = canvas.Canvas(filename, pagesize=A4)

    # =====================================
    # Company Logo
    # =====================================

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    print("WEBINAR LOGO:", LOGO_PATH)
    print("Logo exists:", os.path.exists(LOGO_PATH))

    if os.path.exists(LOGO_PATH):
        logo = ImageReader(LOGO_PATH)

        c.drawImage(
            logo,
            40,
            760,
            width=70,
            height=70,
            preserveAspectRatio=True,
            mask="auto",
        )

    # =====================================
    # Company Header
    # =====================================

    c.setFont("Helvetica-Bold", 22)
    c.drawString(130, 805, "Krish Naik Academy")

    c.setFont("Helvetica", 13)
    c.drawString(130, 783, "Operations Management Portal")

    c.setFont("Helvetica-Bold", 18)
    c.drawString(145, 745, "WEBINAR ANALYTICS REPORT")

    c.setStrokeColor(HexColor("#2563eb"))
    c.setLineWidth(2)
    c.line(40, 730, 550, 730)

    y = 690

    # ============================
    # Webinar Information
    # ============================

    c.setFont("Helvetica", 12)

    c.drawString(50, y, f"Title : {report.webinar_title}")
    y -= 20

    c.drawString(50, y, f"Mentor : {report.mentor_name}")
    y -= 20

    c.drawString(50, y, f"Course : {report.course_name}")
    y -= 20

    c.drawString(50, y, f"Batch : {report.batch_name}")
    y -= 20

    c.drawString(50, y, f"Project : {report.project_name}")

    y -= 35
    
    # ============================
    # Attendance
    # ============================

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Attendance")

    y -= 25

    c.setFont("Helvetica", 12)

    c.drawString(
        60,
        y,
        f"Registered Learners : {report.registered_learners}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Attended Learners : {report.attended_learners}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Attendance Rate : {report.attendance_rate}%",
    )

    y -= 35

    # ============================
    # Engagement
    # ============================

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Learner Engagement")

    y -= 25

    c.setFont("Helvetica", 12)

    c.drawString(
        60,
        y,
        f"Chat Messages : {report.total_chat_messages}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Questions Asked : {report.questions_asked}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Raised Hands : {report.raised_hands}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Engagement Score : {report.engagement_score}",
    )

    y -= 35

    # ============================
    # Poll Analytics
    # ============================

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Poll Analytics")

    y -= 25

    c.setFont("Helvetica", 12)

    c.drawString(
        60,
        y,
        f"Polls Conducted : {report.polls_conducted}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Responses : {report.poll_responses}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Average Rating : {report.poll_average_rating}",
    )

    y -= 35

    # ============================
    # Feedback
    # ============================

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Feedback")

    y -= 25

    c.setFont("Helvetica", 12)

    c.drawString(
        60,
        y,
        f"Session Rating : {report.session_rating}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Mentor Rating : {report.mentor_rating}",
    )
    y -= 20

    c.drawString(
        60,
        y,
        f"Learner Satisfaction : {report.learner_satisfaction}",
    )

    y -= 50

    c.setFont("Helvetica-Oblique", 10)
    c.drawString(
        50,
        y,
        "Generated by Operations Management Portal",
    )

    c.save()

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

    es = data["executive_summary"]
    elements.append(bullet("Executive Operations Summary"))
    elements.append(kpi_grid([
        ("Sessions", es["total_sessions"]),
        ("Batches", es["total_batches"]),
        ("Mentors", es["total_mentors"]),
        ("Learners", es["total_learners"]),
        ("Completion Rate", f"{es['completion_rate']}%"),
        ("Health Score", f"{es['health_score']}%"),
    ]))
    elements.append(Spacer(1, 10))

    ss = data["session_summary"]
    elements.append(bullet("Session Analytics"))
    elements.append(kpi_grid([
        ("Total Sessions", ss["total_sessions"]),
        ("Completed", ss["completed_sessions"]),
        ("Scheduled", ss["scheduled_sessions"]),
        ("Cancelled", ss["cancelled_sessions"]),
    ]))
    elements.append(Spacer(1, 10))

    ms = data["mentor_summary"]
    elements.append(bullet("Mentor Analytics"))
    elements.append(kpi_grid([
        ("Total Mentors", ms["total_mentors"]),
        ("Active", ms["active_mentors"]),
        ("Inactive", ms["inactive_mentors"]),
        ("Avg Hourly Rate", f"Rs {ms['average_hourly_rate']}"),
    ]))
    elements.append(Spacer(1, 10))

    bs = data["batch_summary"]
    elements.append(bullet("Batch Analytics"))
    elements.append(kpi_grid([
        ("Total Batches", bs["total_batches"]),
        ("Completed", bs["completed_batches"]),
        ("Ongoing", bs["ongoing_batches"]),
        ("Delayed", bs["delayed_batches"]),
        ("Avg Attendance", f"{bs['average_attendance']}%"),
        ("Avg Completion", f"{bs['average_completion']}%"),
        ("Avg Health", bs["average_health"]),
    ]))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Batch Performance"))
    bp_rows = [
        [b["batch_name"], b["mentor_name"], str(b.get("strength") or 0), f"{b.get('attendance_percentage') or 0}%", f"{b.get('completion_percentage') or 0}%", str(b.get("health_score") or 0), b.get("status") or "—"]
        for b in data["batch_performance"]
    ]
    elements.append(data_table(
        ["Batch", "Mentor", "Strength", "Attendance", "Completion", "Health", "Status"],
        bp_rows,
        [40 * mm, 32 * mm, 20 * mm, 24 * mm, 24 * mm, 18 * mm, 20 * mm],
        "No batches match this scope.",
    ))
    elements.append(Spacer(1, 10))

    ls = data["learner_summary"]
    elements.append(bullet("Learner Analytics"))
    elements.append(kpi_grid([
        ("Total Learners", ls["total_learners"]),
        ("Active", ls["active_learners"]),
        ("Inactive", ls["inactive_learners"]),
        ("Dropouts", ls["dropout_count"]),
        ("Avg Completion", f"{ls['average_completion']}%"),
    ], per_row=5))
    elements.append(Spacer(1, 10))

    os_ = data["operations_summary"]
    elements.append(bullet("Operations Analytics"))
    elements.append(kpi_grid([
        ("Projects", os_["total_projects"]),
        ("Total Sessions", os_["total_sessions"]),
        ("Completed", os_["completed_sessions"]),
        ("Cancelled", os_["cancelled_sessions"]),
        ("SLA", f"{os_['average_sla']}%"),
        ("Completion", f"{os_['average_completion']}%"),
        ("Mentor Utilization", f"{os_['average_mentor_utilization']}%"),
        ("Resource Utilization", f"{os_['average_resource_utilization']}%"),
        ("Productivity", f"{os_['average_productivity']}%"),
    ], per_row=3))
    elements.append(Spacer(1, 10))

    elements.append(bullet("At-Risk Batches"))
    ar_rows = [
        [b["batch_name"], b["mentor_name"], f"{b.get('attendance') or 0}%", f"{b.get('completion') or 0}%", str(b.get("health") or 0), b.get("status") or "—"]
        for b in data["at_risk_batches"]
    ]
    elements.append(data_table(
        ["Batch", "Mentor", "Attendance", "Completion", "Health", "Status"],
        ar_rows,
        [38 * mm, 34 * mm, 26 * mm, 26 * mm, 22 * mm, 32 * mm],
        "No at-risk batches in this scope.",
    ))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Top Mentors Leaderboard"))
    tm_rows = [
        [m["mentor_name"], str(m["sessions"]), f"Rs {m['hourly_rate']}", f"Rs {m['revenue']}"]
        for m in data["top_mentors"][:15]
    ]
    elements.append(data_table(
        ["Mentor", "Sessions", "Hourly Rate", "Revenue"],
        tm_rows,
        [60 * mm, 40 * mm, 39 * mm, 39 * mm],
        "No mentors match this scope.",
    ))
    elements.append(Spacer(1, 10))

    elements.append(bullet("Top Batches Leaderboard"))
    tb_rows = [
        [b["batch_name"], b.get("course_name") or "—", b.get("mentor_name") or "—", str(b.get("strength") or 0), str(b["sessions"])]
        for b in data["top_batches"][:15]
    ]
    elements.append(data_table(
        ["Batch", "Course", "Mentor", "Strength", "Sessions"],
        tb_rows,
        [38 * mm, 38 * mm, 38 * mm, 32 * mm, 32 * mm],
        "No batches match this scope.",
    ))
    elements.append(Spacer(1, 10))

    ps = data.get("placement_summary")
    if ps:
        elements.append(bullet("Placement Analytics"))
        elements.append(Paragraph("Sample/illustrative data — not yet linked to real placement records or this report's filters.", section_note_style))
        elements.append(kpi_grid([
            ("Eligible Students", ps["eligible_students"]),
            ("Placed Students", ps["placed_students"]),
            ("Placement Rate", f"{ps['placement_rate']}%"),
            ("Interviews Scheduled", ps["interview_scheduled"]),
            ("Offers Received", ps["offers_received"]),
            ("Companies Hiring", ps["companies_hiring"]),
            ("Average CTC", f"{ps['average_ctc']} LPA"),
            ("Highest CTC", f"{ps['highest_ctc']} LPA"),
        ]))

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

