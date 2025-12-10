import base64, io, json
import qrcode

def generate_qr(ticket_data: dict) -> str:
    """Genera QR code en base64"""
    payload = json.dumps(ticket_data, separators=(",", ":"))
    qr = qrcode.make(payload)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("ascii")
    return f"data:image/png;base64,{encoded}"

