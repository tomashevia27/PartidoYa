import os
import requests
import logging

logger = logging.getLogger(__name__)

def send_confirmation_email(to_email: str, code: str) -> None:
    """Envía el código de confirmación usando la API de Resend o simula el envío en consola."""

    api_key = os.getenv("RESEND_API_KEY")
    
    # MOCK MODE (Desarrollo local sin API Key)
    if not api_key:
        logger.warning("RESEND_API_KEY no configurado. Simulando envío de email en consola...")
        print(f"\n{'='*50}")
        print(f"📧 EMAIL SIMULADO (MODO DESARROLLO)")
        print(f"Para: {to_email}")
        print(f"Asunto: Confirma tu cuenta en PartidosYa")
        print(f"Código de Confirmación: {code}")
        print(f"{'='*50}\n")
        return

    # MODO PRODUCCIÓN
    sender_email = os.getenv("RESEND_SENDER_EMAIL", "onboarding@partidoya.me")
    
    url = "https://api.resend.com/emails"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": f"PartidosYa <{sender_email}>",
        "to": [to_email],
        "subject": "Confirma tu cuenta en PartidosYa",
        "html": f"<p>Tu código de confirmación es: <strong>{code}</strong></p><p>Si no solicitaste este registro, podés ignorar este mensaje.</p>"
    }

    response = requests.post(url, json=payload, headers=headers)

    # Resend devuelve 200 en lugar de 201 al enviar correos
    if response.status_code != 200:
        raise RuntimeError(f"Error al enviar email con Resend: {response.text}")
    