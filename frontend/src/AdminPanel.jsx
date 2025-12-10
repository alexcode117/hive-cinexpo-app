import { useState } from 'react'
import { Link } from 'react-router-dom'
import { validateTicket, getTicketInfo } from './api'
import QRScanner from './QRScanner'

function AdminPanel() {
  const [adminUsername, setAdminUsername] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [ticketInfo, setTicketInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  const handleScanQR = () => {
    setShowScanner(true)
  }

  const handleScanSuccess = (scannedText) => {
    // El QR puede contener JSON con el ticket_id o solo el ticket_id
    try {
      const parsed = JSON.parse(scannedText)
      if (parsed.ticket_id) {
        setTicketId(parsed.ticket_id)
        checkTicket(parsed.ticket_id)
      } else {
        setTicketId(scannedText)
        checkTicket(scannedText)
      }
    } catch {
      // Si no es JSON, asumimos que es el ticket_id directamente
      setTicketId(scannedText)
      checkTicket(scannedText)
    }
    setShowScanner(false)
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
  }

  const checkTicket = async (id) => {
    if (!id) {
      setError('Por favor ingresa un ID de ticket')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setTicketInfo(null)

    try {
      const ticket = await getTicketInfo(id)
      setTicketInfo(ticket)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!ticketId) {
      setError('Por favor ingresa un ID de ticket')
      return
    }

    if (!adminUsername.trim()) {
      setError('Por favor ingresa tu usuario de administrador')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await validateTicket(ticketId, adminUsername.trim())
      setMessage(result.message || 'Ticket validado exitosamente')
      setTicketInfo(result.ticket)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 py-12 text-slate-50">
      {showScanner && (
        <QRScanner onScanSuccess={handleScanSuccess} onClose={handleCloseScanner} />
      )}

      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-3xl font-bold text-amber-300">Panel de Administración</h2>
        
        {/* Formulario de validación */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h3 className="mb-4 text-xl font-semibold text-amber-200">Validar Ticket</h3>
          
          <div className="mb-4 flex gap-4">
            <button
              onClick={handleScanQR}
              className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-600"
            >
              📷 Escanear QR con Cámara
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-slate-300">ID del Ticket</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Ingresa o escanea el ID del ticket"
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-amber-300 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-slate-300">Usuario Administrador</label>
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="@admin"
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-amber-300 focus:outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => checkTicket(ticketId)}
              disabled={loading || !ticketId}
              className="flex-1 rounded-md bg-slate-700 px-4 py-2 font-semibold text-white transition-all hover:bg-slate-600 disabled:opacity-50"
            >
              Consultar Ticket
            </button>
            <button
              onClick={handleValidate}
              disabled={loading || !ticketId || !adminUsername}
              className="flex-1 rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Validando...' : 'Validar y Quemar'}
            </button>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 border border-red-500 p-4 text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-md bg-green-900/50 border border-green-500 p-4 text-green-200">
            {message}
          </div>
        )}

        {/* Información del ticket */}
        {ticketInfo && (
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h3 className="mb-4 text-xl font-semibold text-amber-200">Información del Ticket</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono text-slate-200">{ticketInfo.ticket_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Usuario:</span>
                <span className="text-slate-200">@{ticketInfo.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto:</span>
                <span className="text-slate-200">{ticketInfo.amount} {ticketInfo.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado:</span>
                <span className={`font-semibold ${ticketInfo.used ? 'text-red-400' : 'text-green-400'}`}>
                  {ticketInfo.used ? '❌ Usado' : '✅ Válido'}
                </span>
              </div>
              {ticketInfo.validated_at && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validado el:</span>
                    <span className="text-slate-200">
                      {new Date(ticketInfo.validated_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validado por:</span>
                    <span className="text-slate-200">@{ticketInfo.validated_by}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Emitido el:</span>
                <span className="text-slate-200">
                  {new Date(ticketInfo.issued_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/"
          className="mt-6 block text-center text-slate-300 underline underline-offset-4 hover:text-slate-100"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default AdminPanel

