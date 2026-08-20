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
)

# =====================================================
# Invoice PDF
# =====================================================

def generate_invoice(invoice):
    print("=" * 50)
    print("✅ NEW generate_invoice() FUNCTION IS RUNNING")
    print(__file__)
    print("=" * 50)

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = f"pdfs/invoice_{invoice.id}.pdf"

    c = canvas.Canvas(filename, pagesize=A4)
    # =====================================
    # Logo Path
    # =====================================

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo.png")

    # =====================================
    # Professional Header
    # =====================================

    HEADER_HEIGHT = 82

    # Blue Header Background
    c.setFillColor(HexColor("#1E3A8A"))
    c.rect(0, 760, 595, HEADER_HEIGHT, fill=1, stroke=0)

    # -------------------------------------
    # Company Logo
    # -------------------------------------

    if os.path.exists(LOGO_PATH):
        logo = ImageReader(LOGO_PATH)

        c.drawImage(
            logo,
            30,                 # X Position
            770,                # Y Position
            width=100,          # Logo Width
            height=50,          # Logo Height
            preserveAspectRatio=True,
            mask="auto",
        )

    # -------------------------------------
    # Company Name
    # -------------------------------------

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 24)

    # Centered in the header
    c.drawCentredString(
        325,
        800,
        "Krish Naik Academy"
    )

    # -------------------------------------
    # Invoice Title
    # -------------------------------------

    c.setFillColor(HexColor("#111827"))
    c.setFont("Helvetica-Bold", 26)

    c.drawCentredString(
        297,
        735,
        "MENTOR PAYMENT INVOICE"
    )

    # -------------------------------------
    # Divider
    # -------------------------------------

    c.setStrokeColor(HexColor("#D1D5DB"))
    c.setLineWidth(1)
    c.line(30, 720, 565, 720)
       # =====================================================
    # Invoice Information Card
    # =====================================================

    c.setFillColor(HexColor("#F3F4F6"))
    c.roundRect(
        40,
        560,
        515,
        130,
        8,
        fill=1,
        stroke=0,
    )

    c.setFillColor(HexColor("#111827"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(55, 670, "Invoice Information")

    c.setFont("Helvetica", 12)

    # ----------------------------
    # Left Column
    # ----------------------------

    c.drawString(55, 645, "Invoice No")
    c.drawString(180, 645, f": {invoice.invoice_number}")

    c.drawString(55, 620, "Month")
    c.drawString(180, 620, f": {invoice.month}")

    c.drawString(55, 595, "Payment Status")

    # Payment Status Badge
    status = str(invoice.payment_status).upper()

    if status == "PAID":
        badge_color = HexColor("#16A34A")
    elif status == "PENDING":
        badge_color = HexColor("#F59E0B")
    else:
        badge_color = HexColor("#DC2626")
    c.setFillColor(badge_color)
    c.roundRect(
        180,
        586,
        80,
        18,
        4,
        fill=1,
        stroke=0,
    )

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(
        220,
        592,
        status,
    )

    # Reset font/color
    c.setFillColor(HexColor("#111827"))
    c.setFont("Helvetica", 12)

    # ----------------------------
    # Right Column
    # ----------------------------

    c.drawString(300, 645, "Mentor")
    c.drawString(410, 645, f": {invoice.mentor_name}")

    c.drawString(300, 620, "Batch")
    c.drawString(410, 620, f": {invoice.batch_name}")

    # =====================================================
    # Payment Summary Card
    # =====================================================

    # Card
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#D1D5DB"))

    c.roundRect(
    40,
    300,
    515,
    220,
    10,
    fill=1,
    stroke=1,
 )

   # -----------------------------------------------------
   # Header
   # -----------------------------------------------------

    c.setFillColor(HexColor("#1E3A8A"))
    c.roundRect(
    40,
    490,
    515,
    30,
    10,
    fill=1,
    stroke=0,
 )

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(55, 500, "Payment Summary")

  # -----------------------------------------------------
  # Table Layout
  # -----------------------------------------------------

    label_x = 60
    colon_x = 220
    value_x = 525

    rows = [
    ("Total Sessions", str(invoice.total_sessions)),
    ("Total Hours", f"{invoice.total_hours} Hours"),
    ("Hourly Rate", f"₹ {float(invoice.hourly_rate):,.2f}"),
 ]

    y = 455

    for label, value in rows:

        c.setFillColor(HexColor("#374151"))
        c.setFont("Helvetica", 12)
        c.drawString(label_x, y, label)

        c.drawString(colon_x, y, ":")

        c.setFillColor(HexColor("#111827"))
        c.setFont("Helvetica-Bold", 12)
        c.drawRightString(value_x, y, value)

        c.setStrokeColor(HexColor("#E5E7EB"))
        c.line(55, y - 12, 540, y - 12)

        y -= 38

     # -----------------------------------------------------
    # Total Payable Box
    # -----------------------------------------------------

    c.setFillColor(HexColor("#F97316"))

    c.roundRect(
        55,
        320,
        485,
        48,
        8,
        fill=1,
        stroke=0,
    )

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(70, 338, "TOTAL PAYABLE")

    c.setFont("Helvetica-Bold", 18)

    c.drawRightString(
        525,
        338,
        f"₹ {float(invoice.total_amount):,.2f}",
    )

    # =====================================================
    # Footer
    # =====================================================

    c.setFillColor(HexColor("#6B7280"))
    c.setFont("Helvetica-Oblique", 10)

    c.drawCentredString(
        297,
        25,
        "Generated by Krish Naik Academy",
    )

    c.save()

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


def generate_nps_report(records, insights):

    if not os.path.exists("pdfs"):
        os.makedirs("pdfs")

    filename = "pdfs/nps_report.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleWhite", parent=styles["Title"], textColor=colors.white, fontSize=20,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleWhite", parent=styles["Normal"], textColor=YELLOW, fontSize=11,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"], textColor=NAVY, spaceBefore=14, spaceAfter=8,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"], textColor=SLATE, fontSize=10, leading=14,
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=body_style, leftIndent=12, bulletIndent=0, spaceAfter=6,
    )

    elements = []

    # ---- Header banner ----
    header = Table(
        [[Paragraph("Krish Naik Academy", title_style)],
         [Paragraph(f"NPS Analytics Report &nbsp;&bull;&nbsp; Generated {datetime.now().strftime('%d %b %Y')}", subtitle_style)]],
        colWidths=[178 * mm],
    )
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 16))

    overall = insights["overall"]

    # ---- KPI summary ----
    elements.append(Paragraph("Executive Summary", section_style))

    kpi_data = [
        ["Total Responses", "Avg Score (0-10)", "NPS Score", "Promoters", "Passives", "Detractors"],
        [
            str(overall["total"]),
            str(overall["avg_nps_score"]),
            str(overall["nps_score"]),
            str(overall["promoters"]),
            str(overall["passives"]),
            str(overall["detractors"]),
        ],
    ]
    kpi_table = Table(kpi_data, colWidths=[29.67 * mm] * 6)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), SLATE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 14),
        ("TEXTCOLOR", (0, 1), (-1, 1), NAVY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 10))

    rating_data = [["Average Rating", "Score / 5"]] + [
        [r["label"], f"{r['value']:.2f}"] for r in insights["rating_breakdown"]
    ]
    rating_table = Table(rating_data, colWidths=[89 * mm, 89 * mm])
    rating_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(rating_table)

    # ---- Segment breakdowns needing attention ----
    def breakdown_section(title, rows):
        elements.append(Paragraph(title, section_style))

        if not rows:
            elements.append(Paragraph("Not enough data yet.", body_style))
            return

        data = [["Name", "Responses", "NPS Score", "Avg Rating"]] + [
            [r["name"], str(r["responses"]), str(r["nps_score"]), f"{r['avg_rating']:.2f}"]
            for r in rows[:5]
        ]
        table = Table(data, colWidths=[70 * mm, 36 * mm, 36 * mm, 36 * mm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)

    breakdown_section("Mentors Needing Attention (lowest NPS first)", insights["by_mentor"])
    breakdown_section("Courses Needing Attention (lowest NPS first)", insights["by_course"])
    breakdown_section("Batches Needing Attention (lowest NPS first)", insights["by_batch"])

    # ---- Learner concerns ----
    elements.append(Paragraph("Recurring Themes in Learner Feedback", section_style))

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
    elements.append(Paragraph("Automated Insights Summary", section_style))

    summary_data = [[row["label"], row["value"]] for row in insights["automated_insights_table"]]
    summary_table = Table(summary_data, colWidths=[89 * mm, 89 * mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 4))

    # ---- Business recommendations ----
    elements.append(Paragraph("Business Recommendations", section_style))

    for rec in insights["recommendations"]:
        elements.append(Paragraph(f"&bull;&nbsp; <b>{rec['title']}.</b> {rec['text']}", bullet_style))

    # ---- Full response table ----
    elements.append(Paragraph("All Responses", section_style))

    table_header = ["Learner", "Course", "Batch", "Mentor", "Score", "Segment"]
    table_rows = [table_header]

    for r in records:
        score = r.nps_score
        if score >= 9:
            segment = "Promoter"
        elif score >= 7:
            segment = "Passive"
        else:
            segment = "Detractor"

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
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]

    for i, r in enumerate(records, start=1):
        row_styles.append(("TEXTCOLOR", (5, i), (5, i), _segment_color(r.nps_score)))
        row_styles.append(("FONTNAME", (5, i), (5, i), "Helvetica-Bold"))

    response_table.setStyle(TableStyle(row_styles))
    elements.append(response_table)

    doc.build(elements)

    return filename

