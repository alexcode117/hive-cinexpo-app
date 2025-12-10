import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

function QRScanner({ onScanSuccess, onClose, showScanner }) {
  const html5QrCodeRef = useRef(null)
  const [error, setError] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const stopScanning = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.clear()
          }
          setIsScanning(false)
        })
        .catch((err) => {
          console.error('Error al detener el escáner:', err)
          setIsScanning(false)
        })
    }
  }

  useEffect(() => {
    if (!showScanner) {
      return
    }

    let isMounted = true

    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader')
        html5QrCodeRef.current = html5QrCode

        // Configuración del escáner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        }

        // Iniciar el escáner
        await html5QrCode.start(
          { facingMode: 'environment' }, // Cámara trasera en móviles
          config,
          (decodedText) => {
            // QR escaneado exitosamente
            if (isMounted) {
              onScanSuccess(decodedText)
              stopScanning()
            }
          },
          (errorMessage) => {
            // Ignorar errores de escaneo (solo mostrar si es crítico)
            // console.log('Error de escaneo:', errorMessage)
          }
        )

        if (isMounted) {
          setIsScanning(true)
        }
      } catch (err) {
        if (isMounted) {
          setError(`Error al iniciar la cámara: ${err.message}`)
          console.error('Error:', err)
        }
      }
    }

    startScanning()

    // Limpiar al desmontar o cuando showScanner cambie
    return () => {
      isMounted = false
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner])

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  if (!showScanner) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-slate-900 p-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-800 p-2 text-2xl text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
          aria-label="Cerrar escáner"
        >
          ×
        </button>

        <h3 className="mb-4 text-xl font-semibold text-amber-200">Escanear Código QR</h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 border border-red-500 p-3 text-sm text-red-200">
            {error}
            <p className="mt-2 text-xs">Asegúrate de permitir el acceso a la cámara</p>
          </div>
        )}

        <div
          id="qr-reader"
          className="mb-4 rounded-lg overflow-hidden bg-slate-800"
          style={{ width: '100%', minHeight: '300px' }}
        />

        <p className="text-center text-sm text-slate-400 mb-4">
          Apunta la cámara hacia el código QR del ticket
        </p>

        <button
          onClick={handleClose}
          className="w-full rounded-md bg-slate-700 px-4 py-2 font-semibold text-white transition-all hover:bg-slate-600"
        >
          Cancelar Escaneo
        </button>
      </div>
    </div>
  )
}

export default QRScanner
