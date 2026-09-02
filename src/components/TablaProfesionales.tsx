'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, UserX, Plus, X, Trash2, Mail, Phone, User } from 'lucide-react';

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  acepta_reservas_online: boolean;
}

export default function TablaProfesionales() {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nuevo profesional
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aceptaOnline, setAceptaOnline] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerProfesionales();
  }, []);

  const obtenerProfesionales = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('profesionales')
      .select('id, nombre, apellido, email, telefono, acepta_reservas_online')
      .order('nombre', { ascending: true });

    if (!error) setProfesionales(data || []);
    setCargando(false);
  };

  const cambiarEstadoOnline = async (id: string, nuevoEstado: boolean) => {
    const { error } = await supabase
      .from('profesionales')
      .update({ acepta_reservas_online: nuevoEstado })
      .eq('id', id);

    if (!error) obtenerProfesionales();
  };

  const eliminarProfesional = async (id: string) => {
    if (!confirm('¿Eliminar este barbero? Se desvinculará de las reservas asociadas.')) return;

    const { error } = await supabase.from('profesionales').delete().eq('id', id);
    if (!error) obtenerProfesionales();
  };

  const guardarProfesional = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase.from('profesionales').insert([
      {
        nombre,
        apellido,
        email,
        telefono,
        acepta_reservas_online: aceptaOnline,
      },
    ]);

    if (error) {
      alert('Error al registrar barbero: ' + error.message);
    } else {
      setMostrarModal(false);
      obtenerProfesionales();
      setNombre('');
      setApellido('');
      setEmail('');
      setTelefono('');
      setAceptaOnline(true);
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Equipo de Barberos</h2>
          <p className="text-sm text-gray-500">Gestión del personal y disponibilidad de agenda</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Agregar Barbero
        </button>
      </div>

      {/* Lista de Barberos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-gray-500">Cargando equipo...</div>
        ) : profesionales.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <User className="w-12 h-12 mx-auto text-gray-400" />
            <p className="font-medium text-lg text-gray-800">No hay barberos registrados</p>
            <p className="text-sm text-gray-400">Haz clic en <b>"+ Agregar Barbero"</b> para registrar al primer miembro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="p-4">Barbero</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">Reserva Online</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {profesionales.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">
                      {p.nombre} {p.apellido}
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {p.email || 'Sin email'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {p.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => cambiarEstadoOnline(p.id, !p.acepta_reservas_online)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          p.acepta_reservas_online
                            ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {p.acepta_reservas_online ? (
                          <><UserCheck className="w-3.5 h-3.5" /> Activo Online</>
                        ) : (
                          <><UserX className="w-3.5 h-3.5" /> Inactivo</>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => eliminarProfesional(p.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Barbero"
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

      {/* Modal para Crear Profesional */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Registrar Barbero</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarProfesional} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: Carlos"
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej: Silva"
                    value={apellido} 
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="barbero@agendapro.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  placeholder="+56 9 1234 5678"
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="online"
                  checked={aceptaOnline} 
                  onChange={(e) => setAceptaOnline(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="online" className="text-sm text-gray-700 font-medium">
                  Disponible para reservas online
                </label>
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
                  {guardando ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}