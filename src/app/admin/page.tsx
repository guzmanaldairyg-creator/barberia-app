'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock, Scissors, Plus, Trash2, CalendarDays, UserCheck, ChevronLeft, ChevronRight, Lock, X, Check, Menu } from 'lucide-react';

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
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
}

interface Reserva {
  id: string;
  fecha_hora_inicio: string;
  estado: string;
  monto_total: number;
  clientes?: {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
  };
  servicios?: {
    nombre: string;
    duracion_minutos: number;
  };
}

export default function PanelAdminMovil() {
  const [tabActiva, setTabActiva] = useState<'calendario' | 'citas' | 'servicios' | 'disponibilidad'>('calendario');

  // Estados generales
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [nombreServicio, setNombreServicio] = useState('');
  const [duracion, setDuracion] = useState(30);
  const [precio, setPrecio] = useState(10000);

  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Calendario e Interacción Diaria
  const [fechaActualCalendario, setFechaActualCalendario] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Estados del formulario móvil para el día seleccionado
  const [horaInicioDisp, setHoraInicioDisp] = useState('10:00');
  const [horaFinDisp, setHoraFinDisp] = useState('20:00');
  
  const [horaInicioBloqueo, setHoraInicioBloqueo] = useState('14:00');
  const [horaFinBloqueo, setHoraFinBloqueo] = useState('15:00');
  const [motivoBloqueo, setMotivoBloqueo] = useState('Almuerzo / Pausa');

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const cargarDatosAdmin = async () => {
    setCargando(true);
    const { data: servData } = await supabase.from('servicios').select('*');
    if (servData) setServicios(servData);

    const { data: dispData } = await supabase.from('disponibilidad_barbero').select('*').order('fecha', { ascending: true });
    if (dispData) setDisponibilidades(dispData);

    const { data: bloqData } = await supabase.from('bloqueos_agenda').select('*').order('fecha', { ascending: true });
    if (bloqData) setBloqueos(bloqData);

    const { data: resData } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha_hora_inicio,
        estado,
        monto_total,
        clientes (nombre, apellido, telefono, email),
        servicios (nombre, duracion_minutos)
      `)
      .order('fecha_hora_inicio', { ascending: true });
    
    if (resData) setReservas(resData as unknown as Reserva[]);
    setCargando(false);
  };

  const crearServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('servicios').insert([{ nombre: nombreServicio, duracion_minutos: duracion, precio }]);
    if (!error) {
      setNombreServicio('');
      cargarDatosAdmin();
      alert('¡Servicio creado!');
    } else {
      alert('Error: ' + error.message);
    }
  };

  const eliminarServicio = async (id: string) => {
    if (confirm('¿Eliminar servicio?')) {
      await supabase.from('servicios').delete().eq('id', id);
      cargarDatosAdmin();
    }
  };

  const guardarDisponibilidadDia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaSeleccionado) return;

    const existente = disponibilidades.find(d => d.fecha === diaSeleccionado);
    if (existente) {
      await supabase.from('disponibilidad_barbero').update({ hora_inicio: horaInicioDisp, hora_fin: horaFinDisp }).eq('id', existente.id);
    } else {
      await supabase.from('disponibilidad_barbero').insert([{ fecha: diaSeleccionado, hora_inicio: horaInicioDisp, hora_fin: horaFinDisp }]);
    }
    cargarDatosAdmin();
    alert(`¡Horario guardado para el ${diaSeleccionado}!`);
  };

  const eliminarDisponibilidadDia = async (fechaStr: string) => {
    if (confirm(`¿Cerrar el día ${fechaStr}?`)) {
      await supabase.from('disponibilidad_barbero').delete().eq('fecha', fechaStr);
      cargarDatosAdmin();
    }
  };

  const agregarBloqueoHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaSeleccionado) return;

    const { error } = await supabase.from('bloqueos_agenda').insert([{
      fecha: diaSeleccionado,
      hora_inicio: horaInicioBloqueo,
      hora_fin: horaFinBloqueo,
      motivo: motivoBloqueo
    }]);

    if (!error) {
      cargarDatosAdmin();
      alert('¡Hora bloqueada con éxito!');
    } else {
      alert('Error: ' + error.message);
    }
  };

  const eliminarBloqueo = async (id: string) => {
    if (confirm('¿Quitar este bloqueo?')) {
      await supabase.from('bloqueos_agenda').delete().eq('id', id);
      cargarDatosAdmin();
    }
  };

  // Generar días del mes en formato móvil limpio
  const obtenerDiasMes = (year: number, month: number) => {
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasArray = [];
    
    let inicioDiaSemana = primerDia.getDay() - 1; 
    if (inicioDiaSemana === -1) inicioDiaSemana = 6;

    for (let i = 0; i < inicioDiaSemana; i++) {
      diasArray.push(null);
    }

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      diasArray.push(new Date(year, month, i));
    }

    return diasArray;
  };

  const cambiarMes = (direccion: number) => {
    const nuevoMes = new Date(fechaActualCalendario.getFullYear(), fechaActualCalendario.getMonth() + direccion, 1);
    setFechaActualCalendario(nuevoMes);
  };

  const anioCal = fechaActualCalendario.getFullYear();
  const mesCal = fechaActualCalendario.getMonth();
  const diasDelMes = obtenerDiasMes(anioCal, mesCal);
  const nombreMesStr = fechaActualCalendario.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const dispSeleccionada = disponibilidades.find(d => d.fecha === diaSeleccionado);
  const bloqueosSeleccionados = bloqueos.filter(b => b.fecha === diaSeleccionado);
  const citasSeleccionadas = reservas.filter(r => r.fecha_hora_inicio.startsWith(diaSeleccionado || ''));

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-24">
      {/* BARRA SUPERIOR MÓVIL */}
      <div className="bg-gray-900 border-b border-gray-800 p-3.5 sticky top-0 z-40 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Scissors className="w-4 h-4" />
          </div>
          <h1 className="text-xs font-black tracking-tight">Mi Barbería (Admin)</h1>
        </div>
        <a href="/reservas" target="_blank" className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl shadow">
          Ver Web ↗
        </a>
      </div>

      <div className="max-w-md mx-auto p-3 space-y-4">
        
        {/* MENÚ DE PESTAÑAS MÓVIL (GRID DE 2x2 PARA QUE LOS DEDOS PULSEN CÓMODAMENTE) */}
        <div className="grid grid-cols-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 gap-1.5">
          <button
            onClick={() => setTabActiva('calendario')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'calendario' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'}`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendario
          </button>
          <button
            onClick={() => setTabActiva('citas')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'citas' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'}`}
          >
            📋 Citas ({reservas.length})
          </button>
          <button
            onClick={() => setTabActiva('servicios')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'servicios' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'}`}
          >
            ✂️ Servicios
          </button>
          <button
            onClick={() => setTabActiva('disponibilidad')}
            className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${tabActiva === 'disponibilidad' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400'}`}
          >
            📅 Horarios
          </button>
        </div>

        {/* 1. SECCIÓN CALENDARIO MÓVIL */}
        {tabActiva === 'calendario' && (
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center bg-gray-950 p-3 rounded-xl border border-gray-800">
              <button onClick={() => cambiarMes(-1)} className="p-2 bg-gray-900 rounded-lg text-gray-300">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h2 className="text-xs font-black capitalize text-indigo-300">{nombreMesStr}</h2>
                <span className="text-[10px] text-gray-400">Toca un día para abrir o bloquear</span>
              </div>
              <button onClick={() => cambiarMes(1)} className="p-2 bg-gray-900 rounded-lg text-gray-300">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400">
              <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>

            {/* Cuadrícula de días adaptada a móvil */}
            <div className="grid grid-cols-7 gap-1.5">
              {diasDelMes.map((dia, index) => {
                if (!dia) {
                  return <div key={`empty-${index}`} className="h-14 bg-transparent"></div>;
                }

                const anioStr = dia.getFullYear();
                const mesStr = String(dia.getMonth() + 1).padStart(2, '0');
                const diaStr = String(dia.getDate()).padStart(2, '0');
                const fechaFormateada = `${anioStr}-${mesStr}-${diaStr}`;

                const esAbierto = disponibilidades.some(d => d.fecha === fechaFormateada);
                const citasDelDia = reservas.filter(r => r.fecha_hora_inicio.startsWith(fechaFormateada));
                const bloqueosDelDia = bloqueos.filter(b => b.fecha === fechaFormateada);
                const esHoy = new Date().toISOString().split('T')[0] === fechaFormateada;

                return (
                  <div 
                    key={fechaFormateada} 
                    onClick={() => setDiaSeleccionado(fechaFormateada)}
                    className={`h-16 p-1 rounded-xl border flex flex-col justify-between items-center cursor-pointer active:scale-95 transition-transform ${
                      esHoy ? 'bg-indigo-950/40 border-indigo-500' : 'bg-gray-950 border-gray-800'
                    }`}
                  >
                    <span className={`text-[11px] font-black ${esHoy ? 'bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-300'}`}>
                      {dia.getDate()}
                    </span>

                    <div className="flex gap-1">
                      {esAbierto && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                      {bloqueosDelDia.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </div>

                    <span className="text-[9px] text-indigo-300 font-bold truncate max-w-full">
                      {citasDelDia.length > 0 ? `${citasDelDia.length}c` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL INFERIOR MÓVIL PARA EL DÍA SELECCIONADO */}
        {diaSeleccionado && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-gray-900 border-t sm:border border-gray-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
              
              <button 
                onClick={() => setDiaSeleccionado(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-950 p-2 rounded-xl border border-gray-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-gray-800 pb-3 pr-8">
                <h3 className="text-xs font-extrabold text-indigo-400">Gestionar Día Seleccionado</h3>
                <p className="text-sm font-black text-white mt-0.5">📅 {diaSeleccionado}</p>
              </div>

              {/* Habilitar / Cambiar Horario */}
              <form onSubmit={guardarDisponibilidadDia} className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Horario de Atención
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Apertura</label>
                    <input type="time" value={horaInicioDisp} onChange={(e) => setHoraInicioDisp(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Cierre</label>
                    <input type="time" value={horaFinDisp} onChange={(e) => setHoraFinDisp(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                    <Check className="w-3.5 h-3.5" /> {dispSeleccionada ? 'Actualizar Horario' : 'Abrir Día'}
                  </button>
                  {dispSeleccionada && (
                    <button type="button" onClick={() => eliminarDisponibilidadDia(diaSeleccionado)} className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-3 rounded-xl text-xs font-bold">
                      Cerrar
                    </button>
                  )}
                </div>
              </form>

              {/* Bloquear Horas */}
              <form onSubmit={agregarBloqueoHorario} className="bg-gray-950 p-3.5 rounded-2xl border border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Bloquear Horas (Almuerzo/Pausa)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Desde</label>
                    <input type="time" value={horaInicioBloqueo} onChange={(e) => setHoraInicioBloqueo(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Hasta</label>
                    <input type="time" value={horaFinBloqueo} onChange={(e) => setHoraFinBloqueo(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Motivo</label>
                  <input type="text" value={motivoBloqueo} onChange={(e) => setMotivoBloqueo(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                </div>
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                  <Lock className="w-3.5 h-3.5" /> Bloquear este rango
                </button>
              </form>

              {/* Listado de bloqueos y citas en el modal */}
              {bloqueosSeleccionados.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400">Bloqueos de este día:</span>
                  {bloqueosSeleccionados.map(b => (
                    <div key={b.id} className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                      <span className="text-amber-400 font-bold">🔒 {b.hora_inicio} - {b.hora_fin} ({b.motivo})</span>
                      <button onClick={() => eliminarBloqueo(b.id)} className="text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-gray-800">
                <span className="text-[11px] font-bold text-gray-400">Citas agendadas ({citasSeleccionadas.length}):</span>
                {citasSeleccionadas.length === 0 ? (
                  <p className="text-[11px] text-gray-500">No hay clientes agendados para este día.</p>
                ) : (
                  citasSeleccionadas.map(c => {
                    const horaCita = c.fecha_hora_inicio.split('T')[1]?.substring(0, 5) || '';
                    return (
                      <div key={c.id} className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-indigo-300">
                          <span>🕒 {horaCita} hrs - {c.clientes?.nombre} {c.clientes?.apellido}</span>
                          <span className="text-emerald-400">${c.monto_total?.toLocaleString('es-CL')}</span>
                        </div>
                        <p className="text-[11px] text-gray-400">✂️ {c.servicios?.nombre} | 📞 {c.clientes?.telefono}</p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        )}

        {/* 2. SECCIÓN LISTA DE CITAS */}
        {tabActiva === 'citas' && (
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-xs font-extrabold border-b border-gray-800 pb-2 text-indigo-300">Todas las Citas Registradas</h2>
            {reservas.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No hay reservas aún.</p>
            ) : (
              reservas.map(r => (
                <div key={r.id} className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-xs text-indigo-300">{r.clientes?.nombre} {r.clientes?.apellido}</p>
                      <p className="text-xs text-gray-300">✂️ {r.servicios?.nombre}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-400">${r.monto_total?.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-lg text-[11px] text-gray-400 flex justify-between items-center">
                    <span>📅 {r.fecha_hora_inicio.replace('T', ' - ')} hrs</span>
                    <a href={`tel:${r.clientes?.telefono}`} className="text-indigo-400 font-bold underline">Llamar</a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. SECCIÓN SERVICIOS */}
        {tabActiva === 'servicios' && (
          <div className="space-y-4">
            <form onSubmit={crearServicio} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3">
              <h2 className="text-xs font-extrabold border-b border-gray-800 pb-2 text-indigo-300">Crear Servicio</h2>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Nombre</label>
                <input type="text" required value={nombreServicio} onChange={(e) => setNombreServicio(e.target.value)} placeholder="Ej: Corte Degradé" className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">Duración (min)</label>
                  <input type="number" required value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">Precio ($)</label>
                  <input type="number" required value={precio} onChange={(e) => setPrecio(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow">
                <Plus className="w-4 h-4" /> Agregar Servicio
              </button>
            </form>

            <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-2">
              <h2 className="text-xs font-extrabold border-b border-gray-800 pb-2 text-indigo-300">Tus Servicios</h2>
              {servicios.map(s => (
                <div key={s.id} className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold">{s.nombre}</p>
                    <p className="text-[10px] text-gray-400">⏱️ {s.duracion_minutos}m | 💲 ${s.precio?.toLocaleString('es-CL')}</p>
                  </div>
                  <button onClick={() => eliminarServicio(s.id)} className="text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SECCIÓN HORARIOS GENERALES */}
        {tabActiva === 'disponibilidad' && (
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-xs font-extrabold border-b border-gray-800 pb-2 text-indigo-300">Días Abiertos en la Web</h2>
            {disponibilidades.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No hay días habilitados.</p>
            ) : (
              disponibilidades.map(d => (
                <div key={d.id} className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-indigo-300">📅 {d.fecha}</p>
                    <p className="text-[10px] text-gray-400">🕒 {d.hora_inicio} a {d.hora_fin}</p>
                  </div>
                  <button onClick={() => eliminarDisponibilidadDia(d.fecha)} className="text-red-400 p-1.5 bg-red-950/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}