import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_otp_html_template(otp_code: str, recipient_email: str) -> str:
    """Returns a sleek, modern, branded HTML email template for Compli OTP verification."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Compli Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0F172A; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1E293B; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #334155;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                COMPLI<span style="color: #DC2626;">.</span>
              </div>
              <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase;">
                AI Contract Intelligence & Legal Governance
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0;">
                Two-Factor Security Verification
              </h2>
              <p style="font-size: 14px; line-height: 22px; color: #CBD5E1; margin: 0 0 24px 0;">
                A sign-in request was received for your Compli account (<strong style="color: #FFFFFF;">{recipient_email}</strong>). Use the one-time passcode below to complete your authentication:
              </p>

              <!-- OTP Code Display -->
              <div style="text-align: center; margin: 28px 0; background: linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(15,23,42,0.4) 100%); border: 1px solid #DC2626; border-radius: 12px; padding: 20px 10px;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #DC2626; margin: 0;">
                  {otp_code}
                </div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">
                  Valid for {settings.OTP_EXPIRY_MINUTES} minutes • Single-use code
                </div>
              </div>

              <p style="font-size: 13px; line-height: 20px; color: #94A3B8; margin: 0;">
                If you did not attempt to sign in, please ignore this email or update your password immediately to protect your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0F172A; border-top: 1px solid #334155; text-align: center; font-size: 11px; color: #64748B;">
              © 2026 Compli Governance AI System • Confidential & Secure
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Sends OTP email via SMTP with styled HTML template. Falls back gracefully to console logging."""
    logger.info(f"[AUTH OTP DISPATCH] -> To: {to_email} | OTP Code: {otp_code}")
    print(f"\n==========================================")
    print(f"[SECURITY] COMPLI AUTH OTP FOR {to_email}: [{otp_code}]")
    print(f"==========================================\n")

    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    from_email = settings.FROM_EMAIL or smtp_user or "security@compli.ai"

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your Compli Verification Code: {otp_code}"
            msg["From"] = from_email
            msg["To"] = to_email

            text_content = f"Your Compli verification code is: {otp_code}\nThis code is valid for {settings.OTP_EXPIRY_MINUTES} minutes.\nIf you did not request this, please ignore."
            html_content = get_otp_html_template(otp_code, to_email)

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())
            logger.info(f"Successfully sent OTP email to {to_email} via SMTP ({smtp_host}:{smtp_port})")
            return True
        except Exception as e:
            logger.error(f"SMTP dispatch failed: {e}. OTP was logged to console.")
            return False
    return True
