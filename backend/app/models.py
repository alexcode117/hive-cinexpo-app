from pydantic import BaseModel


class PaymentRequest(BaseModel):
    username: str
    transaction_id: str


class TicketData(BaseModel):
    ticket_id: str
    username: str
    transaction_id: str
    amount: str
    currency: str
    memo: str
    qr_data: str
    used: bool = False  # Por defecto, los tickets no están usados


class TicketValidationRequest(BaseModel):
    ticket_id: str
    admin_username: str

