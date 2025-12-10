from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from app.database import db
from app.blockchain import verify_transaction
from app.qr_generator import generate_qr
from app.config import EXPECTED_AMOUNT, EXPECTED_CURRENCY, ADMIN_USERS
from app.models import PaymentRequest, TicketData, TicketValidationRequest

app = FastAPI(title="Cinexpo API")

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/payments/verify")
def verify_payment(payload: PaymentRequest):
    """Verifica transacción y genera ticket QR"""
    
    # Verificar que la transacción no se haya usado antes
    if db.transaction_exists(payload.transaction_id):
        raise HTTPException(status_code=400, detail="Esta transacción ya fue procesada")
    
    # Verificar transacción en blockchain
    transfer = verify_transaction(payload.transaction_id, payload.username)
    
    # Crear ticket
    ticket_id = str(uuid4())
    ticket_data = {
        "ticket_id": ticket_id,
        "username": payload.username,
        "transaction_id": payload.transaction_id,
        "amount": str(EXPECTED_AMOUNT),
        "currency": EXPECTED_CURRENCY,
        "memo": transfer.get("memo", ""),
        "issued_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Generar QR
    qr_image = generate_qr(ticket_data)
    
    # Guardar en base de datos
    ticket_to_save = TicketData(
        ticket_id=ticket_id,
        username=payload.username,
        transaction_id=payload.transaction_id,
        amount=str(EXPECTED_AMOUNT),
        currency=EXPECTED_CURRENCY,
        memo=transfer.get("memo", ""),
        qr_data=qr_image
    )
    db.save_ticket(ticket_to_save)
    
    return {
        "ticket_id": ticket_id,
        "qr_image": qr_image,
        "ticket": ticket_data
    }


@app.post("/tickets/validate")
def validate_ticket(payload: TicketValidationRequest):
    """Valida y quema un ticket (solo para administradores)"""
    
    # Verificar que el usuario es administrador
    if payload.admin_username.lower() not in [admin.lower() for admin in ADMIN_USERS]:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    # Validar y quemar el ticket
    success = db.validate_ticket(payload.ticket_id, payload.admin_username)
    
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Ticket no encontrado o ya fue usado"
        )
    
    # Obtener el ticket actualizado
    ticket = db.get_ticket(payload.ticket_id)
    
    return {
        "message": "Ticket validado y quemado exitosamente",
        "ticket": ticket
    }


@app.get("/tickets/{ticket_id}")
def get_ticket_info(ticket_id: str):
    """Obtiene información de un ticket por su ID"""
    
    ticket = db.get_ticket(ticket_id)
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    return ticket
