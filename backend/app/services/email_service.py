import os
import requests
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


def send_confirmation_email(to_email: str, code: str) -> None:
    """Envía el código de confirmación usando la API HTTP de SendGrid o simula el envío en consola."""

    api_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDGRID_SENDER_EMAIL")

    # MOCK MODE (Desarrollo local sin credenciales)
    if not api_key or not sender_email:
        logger.warning("SENDGRID_API_KEY/SENDGRID_SENDER_EMAIL no configurados. Simulando envío de email en consola...")
        print(f"\n{'='*50}")
        print(f"📧 EMAIL SIMULADO (MODO DESARROLLO)")
        print(f"Para: {to_email}")
        print(f"Asunto: Confirma tu cuenta en PartidoYa")
        print(f"Código de Confirmación: {code}")
        print(f"{'='*50}\n")
        return

    # MODO PRODUCCIÓN (SendGrid HTTP API)
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": sender_email, "name": "PartidoYa"},
            "subject": "Confirma tu cuenta en PartidoYa",
            "content": [
                {
                    "type": "text/html",
                    "value": (
                        '<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">'
                        '<h2 style="color: #7c3aed;">¡Bienvenido a PartidoYa! ⚽</h2>'
                        "<p>Tu código de confirmación es:</p>"
                        '<div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">'
                        f'<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #7c3aed;">{code}</span>'
                        "</div>"
                        '<p style="color: #6b7280; font-size: 14px;">Si no solicitaste este registro, podés ignorar este mensaje.</p>'
                        "</div>"
                    ),
                }
            ],
        }

        response = requests.post(SENDGRID_API_URL, json=payload, headers=headers, timeout=10)

        if response.status_code not in (200, 201, 202):
            logger.error(f"SendGrid respondió con status {response.status_code}: {response.text}")
        else:
            logger.info(f"Email de confirmación enviado exitosamente a {to_email}")

    except Exception as e:
        logger.error(f"Error al enviar email de confirmación a {to_email}: {e}")
        # NO relanzamos la excepción para no interrumpir el flujo de registro