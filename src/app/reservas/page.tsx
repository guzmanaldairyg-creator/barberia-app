'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Scissors, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
}

interface Disponibilidad {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface Bloqueo {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export default function SitioReservasCliente() {
  const [paso, setPaso] = useState<number>(1);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  const [reservaExitosa, setReservaExitosa] = useState(false);

  useEffect(() => {
    cargarDatosPublicos();
  }, []);

  const cargarDatosPublicos = async () => {
    try {
      setCargando(true);
      
      // Cargar servicios obligatoriamente
      const { data: servData, error: servError } = await supabase.from('servicios').select('*');
      if (servError) console.error('Error cargando servicios:', servError.message);
      if (servData) setServicios(servData);

      // Cargar disponibilidad (si falla o está vacía no bloquea la app)
      const { data: dispData } = await supabase
        .from('disponibilidad_barbero')
        .select('*')
        .order('fecha', { ascending: true });
      if (dispData) setDisponibilidades(dispData);

      // Cargar bloqueos (opcional)
      const { data: blokData } = await supabase.from('bloqueos_agenda').select('*');
      if (blokData) setBloqueos(blokData);

    } catch (err) {
      console.error('Error general cargando datos:', err);
    } finally {
      // Siempre apagamos el indicador de carga para que no quede pegado
      setCargando(false);
    }
  };

  const generarHorasDisponiblesDelDia = (fechaStr: string) => {
    const dispDia = disponibilidades.find(d => d.fecha === fechaStr);
    if (!dispDia) return [];

    const bloques = [];
    let [hInicio, mInicio] = dispDia.hora_inicio.split(':').map(Number);
    let [hFin, mFin] = dispDia.hora_fin.split(':').map(Number);

    let currentMinutes = hInicio * 60 + mInicio;
    const endMinutes = hFin * 60 + mFin;

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const estaBloqueada = bloqueos.some(b => {
        const inicioIso = b.fecha_inicio.replace('Z', '').split('+')[0];
        const targetIso = `${fechaStr}T${horaStr}:00`;
        return inicioIso === targetIso;
      });

      if (!estaBloqueada) {
        bloques.push(horaStr);
      }
      currentMinutes += 30;
    }
    return bloques;
  };

  const confirmarReservaFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      alert('Por favor completa todos los pasos.');
      return;
    }

    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .insert([{ nombre, apellido, telefono, email }])
      .select()
      .single();

    if (clienteError || !clienteData) {
      alert('Error al registrar cliente: ' + (clienteError?.message || 'Desconocido'));
      return;
    }

    const fechaHoraInicioIso = `${fechaSeleccionada}T${horaSeleccionada}:00`;

    const { error: reservaError } = await supabase.from('reservas').insert([{
      cliente_id: clienteData.id,
      servicio_id: servicioSeleccionado.id,
      fecha_hora_inicio: fechaHoraInicioIso,
      estado: 'Confirmada',
      origen: 'sitio',
      monto_total: servicioSeleccionado.precio
    }]);

    if (!reservaError) {
      setReservaExitosa(true);
    } else {
      alert('Error al guardar la reserva: ' + reservaError.message);
    }
  };

  if (reservaExitosa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">¡Reserva Exitosa, {nombre}!</h2>
          <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2 text-xs border">
            <p>✂️ <strong>Servicio:</strong> {servicioSeleccionado?.nombre}</p>
            <p>📅 <strong>Fecha y hora:</strong> {fechaSeleccionada} a las {horaSeleccionada}</p>
            <p>💲 <strong>Total:</strong> ${servicioSeleccionado?.precio?.toLocaleString('es-CL')}</p>
          </div>
          <button 
            onClick={() => { setReservaExitosa(false); setPaso(1); setFechaSeleccionada(''); setHoraSeleccionada(''); }}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-xs"
          >
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 pb-12">
      <div className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-sm font-extrabold flex items-center gap-2">
          <Scissors className="w-4 h-4 text-indigo-400" /> Web de Reservas - Clientes
        </h1>
        <a href="/admin" className="text-xs text-indigo-300 hover:underline font-bold">🔒 Ir a mi Panel Admin</a>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {paso === 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 border-b pb-3 flex justify-between items-center">
              <span>1. Elige tu Servicio</span>
              <span className="text-xs text-indigo-600 font-bold">Paso 1 de 3</span>
            </h2>

            {cargando ? (
              <p className="text-xs text-gray-400 text-center py-6">Cargando servicios...</p>
            ) : servicios.length === 0 ? (
              <p className="text-xs text-red-500 text-center py-6">No hay servicios registrados en la base de datos.</p>
            ) : (
              <div className="space-y-2">
                {servicios.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => { setServicioSeleccionado(s); setPaso(2); }}
                    className="p-4 border rounded-xl cursor-pointer flex justify-between items-center hover:bg-indigo-50/50 hover:border-indigo-600 shadow-sm transition-all"
                  >
                    <div>
                      <p className="font-extrabold text-gray-900 text-sm">{s.nombre}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {s.duracion_minutos} min
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-indigo-600 text-sm block">${s.precio?.toLocaleString('es-CL')}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setServicioSeleccionado(s); setPaso(2); }}
                        className="mt-1 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-lg"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {paso === 2 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900">2. Selecciona Fecha y Hora</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Servicio: <span className="font-bold text-indigo-600">{servicioSeleccionado?.nombre}</span></p>
              </div>
              <button onClick={() => setPaso(1)} className="text-xs font-bold text-indigo-600 hover:underline">Atrás</button>
            </div>

            {disponibilidades.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                No hay días habilitados actualmente por el administrador.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {disponibilidades.map((d) => {
                  const horasLibres = generarHorasDisponiblesDelDia(d.fecha);
                  const agotado = horasLibres.length === 0;

                  return (
                    <div 
                      key={d.id}
                      onClick={() => { if (!agotado) { setFechaSeleccionada(d.fecha); setHoraSeleccionada(''); } }}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                        agotado ? 'opacity-40 bg-gray-50 cursor-not-allowed' :
                        fechaSeleccionada === d.fecha ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-bold">{d.fecha}</span>
                      <span className={`text-[10px] mt-1 ${fechaSeleccionada === d.fecha ? 'text-indigo-100' : 'text-gray-500'}`}>
                        {agotado ? 'Agotado' : `${horasLibres.length} libres`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {fechaSeleccionada && (
              <div className="space-y-2 pt-3 border-t">
                <p className="text-xs font-bold text-gray-700">Horas disponibles para el {fechaSeleccionada}:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {generarHorasDisponiblesDelDia(fechaSeleccionada).map((horaStr) => (
                    <button
                      key={horaStr}
                      type="button"
                      onClick={() => setHoraSeleccionada(horaStr)}
                      className={`py-2 px-2 border rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                        horaSeleccionada === horaStr ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> {horaStr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              disabled={!fechaSeleccionada || !horaSeleccionada}
              onClick={() => setPaso(3)}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mt-4 transition-all ${
                fechaSeleccionada && horaSeleccionada ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {paso === 3 && (
          <form onSubmit={confirmarReservaFinal} className="bg-white rounded-2xl p-5 shadow-sm border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-sm font-extrabold text-gray-900">3. Tus Datos de Contacto</h2>
              <button type="button" onClick={() => setPaso(2)} className="text-xs font-bold text-indigo-600 hover:underline">Atrás</button>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-900 text-xs space-y-1">
              <p>✂️ Servicio: <span className="font-bold">{servicioSeleccionado?.nombre}</span> (${servicioSeleccionado?.precio?.toLocaleString('es-CL')})</p>
              <p>📅 Cita: <span className="font-bold">{fechaSeleccionada} a las {horaSeleccionada} hrs</span></p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nombre *</label>
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full border rounded-xl p-2.5 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Apellido *</label>
                  <input type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Tu apellido" className="w-full border rounded-xl p-2.5 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">WhatsApp / Teléfono *</label>
                <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+569..." className="w-full border rounded-xl p-2.5 font-semibold" />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Correo Electrónico *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@email.com" className="w-full border rounded-xl p-2.5 font-semibold" />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 mt-4"
            >
              <ShieldCheck className="w-4 h-4" /> Confirmar Cita
            </button>
          </form>
        )}
      </div>
    </div>
  );
}