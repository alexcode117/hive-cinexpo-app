import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import cineImage from './assets/cine.jpg'
import AdminPanel from './AdminPanel'

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 px-6 text-center text-slate-50">
      <h1 className="text-4xl font-bold text-amber-300">Cinexpo</h1>
      <img src={cineImage} alt="cine" className="w-full max-w-xl rounded-md shadow-lg shadow-amber-200/10" />
      <p className="max-w-2xl text-lg text-slate-200">
        Disfruta la mejor experiencia de cine y asegura tu entrada al evento Cinexpo.
      </p>
      <div className="flex gap-4">
        <Link
          to="/pago"
          className="bg-amber-300 px-4 py-2 text-lg font-bold text-slate-900 transition-all duration-300 hover:bg-amber-400 rounded-md shadow"
        >
          Consigue tu ticket
        </Link>
        <Link
          to="/admin"
          className="bg-slate-700 px-4 py-2 text-lg font-bold text-slate-50 transition-all duration-300 hover:bg-slate-600 rounded-md shadow"
        >
          🔐 Admin
        </Link>
      </div>
    </div>
  )
}

function Payment() {
  const [username, setUsername] = useState('')

  const handleKeychainPay = () => {
    if (!window.hive_keychain) {
      alert('Instala y desbloquea Hive Keychain para continuar.')
      return
    }

    if (!username.trim()) {
      alert('Ingresa tu usuario de Hive para continuar.')
      return
    }

    const to = 'cinexpo'
    const amount = '0.500'
    const memo = 'Cinexpo ticket'
    const currency = 'HBD'

    window.hive_keychain.requestTransfer(
      username,
      to,
      amount,
      memo,
      currency,
      (response) => {
        console.log('Transferencia:', response)
        if (response?.success) {
          alert('Transferencia enviada. Revisa Keychain para confirmar.')
        } else {
          alert(`No se completó la transferencia: ${response?.error || 'ver Keychain'}`)
        }
      },
      false // enforceHiveSigner = false (usa Keychain)
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-50">
      <h2 className="text-3xl font-bold text-amber-300">Compra tu ticket</h2>
      <p className="max-w-xl text-slate-200">
        Antes de pagar, coloca tu usuario de Hive para abrir Keychain con tu cuenta.
      </p>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@tu_usuario"
        className="w-full max-w-xs rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-center text-slate-100 focus:border-amber-300 focus:outline-none"
      />
      <button
        onClick={handleKeychainPay}
        className="bg-emerald-400 px-4 py-2 text-lg font-bold text-slate-900 transition-all duration-300 hover:bg-emerald-500 rounded-md shadow"
      >
        Proceder al pago
      </button>
      <Link to="/" className="text-slate-300 underline underline-offset-4 hover:text-slate-100">
        Volver al inicio
      </Link>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pago" element={<Payment />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}

export default App
