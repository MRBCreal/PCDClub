import React, { useState, useEffect } from 'react';
import { Division } from '@/types';
import { Plus, Edit2, Trash2, Trophy, Save, X } from 'lucide-react';
import { getDivisions, createDivision, updateDivision, deleteDivision, createDefaultDivisions } from '@/lib/firestore';
import toast from 'react-hot-toast';

interface DivisionsManagerProps {
  clubId: string;
}

export default function DivisionsManager({ clubId }: DivisionsManagerProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', order: 0 });

  const loadDivisions = async () => {
    setLoading(true);
    try {
      const divs = await getDivisions(clubId);
      setDivisions(divs);
    } catch (error) {
      toast.error('Error al cargar divisiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDivisions();
  }, [clubId]);

  const handleCreateDefaults = async () => {
    if (!confirm('¿Crear divisiones por defecto? (Maxi Blanco, Maxi Azul, Segunda, Primera)')) return;
    try {
      await createDefaultDivisions(clubId);
      toast.success('Divisiones creadas');
      loadDivisions();
    } catch (error) {
      toast.error('Error al crear divisiones');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingId) {
        await updateDivision(clubId, editingId, {
          name: form.name,
          description: form.description,
          color: form.color,
          order: form.order,
        });
        toast.success('División actualizada');
      } else {
        await createDivision(clubId, {
          clubId,
          name: form.name,
          description: form.description,
          color: form.color,
          order: divisions.length + 1,
          isActive: true,
        });
        toast.success('División creada');
      }
      setForm({ name: '', description: '', color: '#3B82F6', order: 0 });
      setEditingId(null);
      loadDivisions();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (division: Division) => {
    setEditingId(division.id);
    setForm({
      name: division.name,
      description: division.description || '',
      color: division.color || '#3B82F6',
      order: division.order,
    });
  };

  const handleDelete = async (divisionId: string) => {
    if (!confirm('¿Eliminar esta división? Los socios asignados quedarán sin división.')) return;
    try {
      await deleteDivision(clubId, divisionId);
      toast.success('División eliminada');
      loadDivisions();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', description: '', color: '#3B82F6', order: 0 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-600" />
            Divisiones del Club
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Organiza a tus jugadores en divisiones para gestionar eventos y pagos
          </p>
        </div>
        {divisions.length === 0 && (
          <button onClick={handleCreateDefaults} className="btn-secondary text-sm">
            Crear Divisiones por Defecto
          </button>
        )}
      </div>

      {/* Form */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input
              className="input-field"
              placeholder="Nombre de la división *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <input
              type="color"
              className="input-field h-10"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex-1 text-sm">
              <Save className="w-4 h-4 mr-1" />
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
            {editingId && (
              <button onClick={handleCancel} className="btn-secondary text-sm">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {divisions.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Sin divisiones creadas</p>
          <p className="text-sm text-gray-400 mt-1">Crea divisiones para organizar a tus jugadores</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divisions.map(division => (
            <div key={division.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: division.color }}
                  />
                  <h5 className="font-semibold text-gray-900">{division.name}</h5>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(division)}
                    className="p-1.5 text-gray-400 hover:text-primary-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(division.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {division.description && (
                <p className="text-sm text-gray-500">{division.description}</p>
              )}
              <div className="mt-2 text-xs text-gray-400">Orden: {division.order}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
