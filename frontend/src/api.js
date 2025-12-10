// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Verifica un pago y genera un ticket
 */
export async function verifyPayment(username, transactionId) {
  const response = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      transaction_id: transactionId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al verificar el pago')
  }

  return response.json()
}

/**
 * Valida y quema un ticket (solo para administradores)
 */
export async function validateTicket(ticketId, adminUsername) {
  const response = await fetch(`${API_BASE_URL}/tickets/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticket_id: ticketId,
      admin_username: adminUsername,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al validar el ticket')
  }

  return response.json()
}

/**
 * Obtiene información de un ticket por su ID
 */
export async function getTicketInfo(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al obtener el ticket')
  }

  return response.json()
}

