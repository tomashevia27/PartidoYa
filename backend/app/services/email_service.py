import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_confirmation_email(to_email: str, code: str) -> None:
    """Envía el código de confirmación usando SMTP de Gmail o simula el envío en consola."""

    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    # MOCK MODE (Desarrollo local sin credenciales SMTP)
    if not smtp_username or not smtp_password:
        logger.warning("SMTP_USERNAME/SMTP_PASSWORD no configurados. Simulando envío de email en consola...")
        print(f"\n{'='*50}")
        print(f"📧 EMAIL SIMULADO (MODO DESARROLLO)")
        print(f"Para: {to_email}")
        print(f"Asunto: Confirma tu cuenta en PartidoYa")
        print(f"Código de Confirmación: {code}")
        print(f"{'='*50}\n")
        return

    # MODO PRODUCCIÓN (Gmail SMTP)
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Confirma tu cuenta en PartidoYa"
        msg["From"] = f"PartidoYa <{smtp_username}>"
        msg["To"] = to_email

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #7c3aed;">¡Bienvenido a PartidoYa! ⚽</h2>
            <p>Tu código de confirmación es:</p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #7c3aed;">{code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este registro, podés ignorar este mensaje.</p>
        </div>
        """

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_username, to_email, msg.as_string())

        logger.info(f"Email de confirmación enviado exitosamente a {to_email}")

    except Exception as e:
        logger.error(f"Error al enviar email de confirmación a {to_email}: {e}")
        # NO relanzamos la excepción para no interrumpir el flujo de registro