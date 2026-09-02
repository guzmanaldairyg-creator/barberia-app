'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Trash2, Scissors, Clock, DollarSign, Tag } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  duracion_minutos: number;
  categoria: string;
}

export default function TablaServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nuevo servicio
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [categoria, setCategoria] = useState('Corte');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerServicios();
  }, []);

  const obtenerServicios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('servicios')
      .select('id, nombre, descripcion, precio_base, duracion_minutos, categoria')
      .order('nombre', { ascending: true });

    if (!error) setServicios(data || []);
    setCargando(false);
  };

  const eliminarServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio del catálogo?')) return;

    const { error } = await supabase.from('servicios').delete().eq('id', id);
    if (!error) obtenerServicios();
  };

  const guardarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase.from('servicios').insert([
      {
        nombre,
        descripcion,
        precio_base: parseFloat(precio) || 0,
        duracion_minutos: parseInt(duracion) || 30,
        categoria,
      },
    ]);

    if (error) {
      alert('Error al guardar servicio: ' + error.message);
    } else {
      setMostrarModal(false);
      obtenerServicios();
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setDuracion('30');
      setCategoria('Corte');
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catálogo de Servicios</h2>
          <p className="text-sm text-gray-500">Configura las prestaciones, precios y tiempos de atención</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </button>
      </div>

      {/* Lista de Servicios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center text-gray-500">Cargando catálogo...</div>
        ) : servicios.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Scissors className="w-12 h-12 mx-auto text-gray-400" />
            <p className="font-medium text-lg text-gray-800">No hay servicios registrados</p>
            <p className="text-sm text-gray-400">Haz clic en <b>"+ Nuevo Servicio"</b> para crear la primera prestación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Duración</th>
                  <th className="p-4">Precio Base</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {servicios.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{s.nombre}</div>
                      {s.descripcion && <div className="text-xs text-gray-500 mt-0.5">{s.descripcion}</div>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        <Tag className="w-3 h-3 text-gray-500" /> {s.categoria || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" /> {s.duracion_minutos} min
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      ${s.precio_base}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => eliminarServicio(s.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Servicio"
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

      {/* Modal para Crear Servicio */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Registrar Servicio</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarServicio} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Corte Degradado + Barba"
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Incluye lavado y peinado"
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Precio Base ($)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Ej: 12000"
                    value={precio} 
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duración (Minutos)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="30"
                    value={duracion} 
                    onChange={(e) => setDuracion(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm text-gray-800"
                >
                  <option value="Corte">Corte</option>
                  <option value="Barba">Barba</option>
                  <option value="Combo">Combo</option>
                  <option value="Tratamiento">Tratamiento</option>
                </select>
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
                  {guardando ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}