import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config import settings


def send_email(to_email: str, subject: str, body: str):
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject} | Body: {body}")
        return

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        server.quit()
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")