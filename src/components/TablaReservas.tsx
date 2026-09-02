'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, Calendar, Clock, Plus, X, Trash2, CheckCircle2, UserX, AlertCircle } from 'lucide-react';

interface Reserva {
  id: string;
  fecha_hora_inicio: string;
  estado: string;
  origen_reserva: string;
  precio_total: number;
  clientes: { nombre: string; apellido: string; telefono: string; email: string } | null;
  profesionales: { nombre: string; apellido: string } | null;
  servicios: { nombre: string; duracion_minutos: number } | null;
}

interface Cliente { id: string; nombre: string; apellido: string; }
interface Profesional { id: string; nombre: string; apellido: string; }
interface Servicio { id: string; nombre: string; precio_base: number; }

export default function TablaReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Datos auxiliares
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Formulario nueva reserva
  const [clienteId, setClienteId] = useState('');
  const [profesionalId, setProfesionalId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [precio, setPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerReservas();
    cargarDatosFormulario();
  }, []);

  const obtenerReservas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        id,
        fecha_hora_inicio,
        estado,
        origen_reserva,
        precio_total,
        clientes (nombre, apellido, telefono, email),
        profesionales (nombre, apellido),
        servicios (nombre, duracion_minutos)
      `)
      .order('fecha_hora_inicio', { ascending: false });

    if (!error) setReservas((data as unknown as Reserva[]) || []);
    setCargando(false);
  };

  const cargarDatosFormulario = async () => {
    const { data: c } = await supabase.from('clientes').select('id, nombre, apellido');
    const { data: p } = await supabase.from('profesionales').select('id, nombre, apellido');
    const { data: s } = await supabase.from('servicios').select('id, nombre, precio_base');

    if (c) setClientes(c);
    if (p) setProfesionales(p);
    if (s) setServicios(s);
  };

  const cambiarEstadoReserva = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else {
      obtenerReservas();
    }
  };

  const eliminarReserva = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;

    const { error } = await supabase.from('reservas').delete().eq('id', id);

    if (error) {
      alert('Error al eliminar la reserva: ' + error.message);
    } else {
      obtenerReservas();
    }
  };

  const guardarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase.from('reservas').insert([
      {
        cliente_id: clienteId || null,
        profesional_id: profesionalId || null,
        servicio_id: servicioId || null,
        fecha_hora_inicio: new Date(fechaHora).toISOString(),
        estado: 'Confirmado',
        origen_reserva: 'Manual',
        precio_total: parseFloat(precio) || 0,
      },
    ]);

    if (error) {
      alert('Error al crear la reserva: ' + error.message);
    } else {
      setMostrarModal(false);
      obtenerReservas();
      setClienteId('');
      setProfesionalId('');
      setServicioId('');
      setFechaHora('');
      setPrecio('');
    }
    setGuardando(false);
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Confirmado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Reservado': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Asiste': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'No Asiste': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AgendaPro Business</h1>
          <p className="text-sm text-gray-500">Gestión de Reservas y Panel de Control</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={obtenerReservas}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Actualizar
          </button>
          <button 
            onClick={() => setMostrarModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* Tabla de Citas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-gray-500">Cargando la agenda...</div>
        ) : reservas.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-gray-400" />
            <p className="font-medium text-lg text-gray-800">No hay reservas registradas aún</p>
            <p className="text-sm text-gray-400">Haz clic en <b>"+ Nueva Reserva"</b> para crear tu primera cita.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Servicio & Profesional</th>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Origen</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">
                        {reserva.clientes ? `${reserva.clientes.nombre} ${reserva.clientes.apellido}` : 'Cliente General'}
                      </div>
                      {reserva.clientes?.telefono && (
                        <a 
                          href={`https://wa.me/${reserva.clientes.telefono.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-green-600 hover:underline mt-1"
                        >
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{reserva.servicios?.nombre || 'Servicio General'}</div>
                      <div className="text-xs text-gray-500">
                        Atiende: <span className="font-medium">{reserva.profesionales ? `${reserva.profesionales.nombre} ${reserva.profesionales.apellido}` : 'Por asignar'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {new Date(reserva.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(reserva.fecha_hora_inicio).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        reserva.origen_reserva === 'Sitio' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {reserva.origen_reserva}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={reserva.estado}
                        onChange={(e) => cambiarEstadoReserva(reserva.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer outline-none ${getBadgeEstado(reserva.estado)}`}
                      >
                        <option value="Reservado">Reservado</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Asiste">Asiste</option>
                        <option value="No Asiste">No Asiste</option>
                      </select>
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      ${reserva.precio_total}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => eliminarReserva(reserva.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar reserva"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Reserva */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Agendar Nueva Cita</h2>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarReserva} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                <select 
                  value={clienteId} 
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                >
                  <option value="">-- Seleccionar Cliente (Opcional) --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Profesional</label>
                <select 
                  value={profesionalId} 
                  onChange={(e) => setProfesionalId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                >
                  <option value="">-- Seleccionar Profesional --</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Servicio</label>
                <select 
                  value={servicioId} 
                  onChange={(e) => setServicioId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                >
                  <option value="">-- Seleccionar Servicio --</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} (${s.precio_base})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  required
                  value={fechaHora} 
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio Total ($)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Ej: 25000"
                  value={precio} 
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={guardando}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}