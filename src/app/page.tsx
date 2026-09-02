import Link from 'next/link';
import { Scissors, Calendar, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
        
        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
          <Scissors className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Barbería de Yohan Guzmán</h1>
          <p className="text-xs text-gray-400">Selecciona a dónde deseas ingresar:</p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Este botón va a la web de clientes */}
          <Link 
            href="/reservas"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" /> Ir a la Web de Reservas (Clientes)
          </Link>

          {/* ESTE botón va a tu panel de administración */}
          <Link 
            href="/admin"
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-gray-700"
          >
            <ShieldCheck className="w-4 h-4" /> Ir al Panel de Administración
          </Link>
        </div>

      </div>
    </div>
  );
}