import os
import smtplib
import traceback
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_invoice_email(receiver_email, pdf_path, invoice_number):
    try:
        print("\n" + "=" * 70)
        print("EMAIL CONFIGURATION")
        print("EMAIL_ADDRESS :", repr(EMAIL_ADDRESS))
        print("EMAIL_PASSWORD:", "*" * len(EMAIL_PASSWORD) if EMAIL_PASSWORD else "None")
        print("SMTP_SERVER   :", SMTP_SERVER)
        print("SMTP_PORT     :", SMTP_PORT)
        print("RECEIVER      :", receiver_email)
        print("PDF EXISTS    :", os.path.exists(pdf_path))
        print("PDF PATH      :", pdf_path)
        print("=" * 70)

        msg = EmailMessage()
        msg["Subject"] = f"Invoice {invoice_number}"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email

        msg.set_content(f"""
Hello,

Please find your invoice attached.

Invoice Number: {invoice_number}

Thank you.

Regards,
Krish Naik Academy Team
""")

        with open(pdf_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="pdf",
                filename=os.path.basename(pdf_path),
            )

        print("Connecting to Gmail SMTP...")

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as smtp:
            smtp.set_debuglevel(1)

            smtp.ehlo()

            print("Starting TLS...")
            smtp.starttls()

            smtp.ehlo()

            print("Logging in...")
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

            print("Sending email...")
            smtp.send_message(msg)

        print("✅ Email sent successfully")

        return True

    except Exception as e:
        print("\n" + "=" * 70)
        print("❌ EMAIL SENDING FAILED")
        print("ERROR:", str(e))
        traceback.print_exc()
        print("=" * 70 + "\n")

        return False


def send_email(receiver_email, subject, body):
    """Generic plain-text sender, reusing the same SMTP config as send_invoice_email().
    Returns (success: bool, error_message: str | None) instead of raising, so callers
    can log the outcome without their own business logic failing on an SMTP error."""
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = receiver_email
        msg.set_content(body)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)

        return True, None

    except Exception as e:
        print("send_email failed:", e)
        return False, str(e)