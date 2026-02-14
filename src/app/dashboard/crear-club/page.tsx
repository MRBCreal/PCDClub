'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClub } from '@/lib/firestore';
import { ClubType } from '@/types';
import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const clubTypes: { value: ClubType; label: string }[] = [
  { value: 'deportivo', label: 'Club Deportivo' },
  { value: 'social', label: 'Club Social' },
  { value: 'educacional', label: 'Establecimiento Educacional' },
  { value: 'cultural', label: 'Club Cultural' },
  { value: 'otro', label: 'Otro' },
];

export default function CrearClubPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'deportivo' as ClubType,
    email: '',
    city: '',
    region: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await createClub({
        ...form,
        slug,
        ownerId: user.uid,
        isActive: true,
        settings: {
          currency: 'CLP',
          timezone: 'America/Santiago',
          paymentMethods: ['transfer', 'webpay'],
          autoReminders: true,
          reminderDaysBefore: [7, 3, 1],
          lateFeePct: 0,
          gracePeriodDays: 5,
          brandColor: '#2563eb',
          portalSlug: slug,
        },
      });
      toast.success('Club creado exitosamente');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error al crear el club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Crear Nuevo Club</h1>
              <p className="text-sm text-gray-500">Configura los datos básicos de tu club</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del Club *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ej: Club Deportivo Los Halcones" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Organización *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ClubType })} className="input-field">
                {clubTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Breve descripción de tu club..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Santiago" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Región</label>
                <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="input-field" placeholder="Metropolitana" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de Contacto *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="contacto@miclub.cl" required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Club'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
