'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserClubsForUser,
  getAllClubs,
  getDashboardStats,
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  getPayments,
  createPayment,
  updatePayment,
  cancelPayment,
  createBulkPayments,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCourts,
  addCourt,
  updateCourt,
  deleteCourt,
  getBookings,
  addBooking,
  updateBooking,
  deleteBooking,
  updateClub,
  getMatches,
  createMatchWithPayments,
  createBulkMatches,
  updateMatch,
  deleteMatch,
  getDivisions,
} from '@/lib/firestore';
import { Club, Member, Payment, DashboardStats, PaymentStatus, PaymentMethod, UserRole, Event, Court, Booking, Match, PlayerCategory, Division } from '@/types';
import { Timestamp } from 'firebase/firestore';
import {
  Zap, Plus, Users, CreditCard, BarChart3, Settings,
  LogOut, Bell, Home, Calendar, FileText,
  TrendingUp, Clock, DollarSign,
  UserPlus, Menu, X, Search, Edit2, Trash2,
  CheckCircle, AlertCircle, XCircle, RefreshCw,
  ChevronDown, MapPin, LayoutGrid, Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SettingsTab from '@/components/SettingsTab';
import SuperAdminSettings from '@/components/SuperAdminSettings';

// ── helpers ──────────────────────────────────────────────────────────────────

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: 'text-green-600 bg-green-50',
  pending: 'text-yellow-600 bg-yellow-50',
  overdue: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-500 bg-gray-100',
  refunded: 'text-blue-600 bg-blue-50',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  admin: 'Admin',
  member: 'Socio',
  parent: 'Apoderado',
};

function tsToRelative(ts: unknown): string {
  if (!ts) return '-';
  const d = ts instanceof Timestamp ? ts.toDate() : null;
  if (!d) return '-';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return d.toLocaleDateString('es-CL');
}

// ── Member Modal ──────────────────────────────────────────────────────────────

interface MemberModalProps {
  clubId: string;
  member: Member | null;
  divisions: Division[];
  onClose: () => void;
  onSaved: () => void;
}

function MemberModal({ clubId, member, divisions, onClose, onSaved }: MemberModalProps) {
  const [form, setForm] = useState({
    firstName: member?.firstName ?? '',
    lastName: member?.lastName ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    rut: member?.rut ?? '',
    role: (member?.role ?? 'member') as UserRole,
    category: member?.category ?? '',
    divisionId: member?.divisionId ?? '',
    notes: member?.notes ?? '',
    isActive: member?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (member) {
        await updateMember(clubId, member.id, form);
        toast.success('Socio actualizado');
      } else {
        await addMember(clubId, { ...form, clubId, balance: 0 });
        toast.success('Socio agregado');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Error al guardar el socio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{member ? 'Editar Socio' : 'Agregar Socio'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input className="input-field" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} placeholder="12.345.678-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="member">Socio</option>
                <option value="parent">Apoderado</option>
                <option value="admin">Admin</option>
                <option value="owner">Propietario</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={form.category !== ''} onChange={e => setForm({ ...form, category: e.target.checked ? 'adulto' : '' })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Es jugador</span>
              </label>
              {form.category !== '' && (
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="infantil">Infantil</option>
                  <option value="juvenil">Juvenil</option>
                  <option value="adulto">Adulto</option>
                </select>
              )}
            </div>
          </div>
          {form.category !== '' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">División</label>
              <select className="input-field" value={form.divisionId} onChange={e => setForm({ ...form, divisionId: e.target.value })}>
                <option value="">Sin división</option>
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm text-gray-700">Socio activo</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

interface PaymentModalProps {
  clubId: string;
  members: Member[];
  payment: Payment | null;
  onClose: () => void;
  onSaved: () => void;
}

function PaymentModal({ clubId, members, payment, onClose, onSaved }: PaymentModalProps) {
  const [form, setForm] = useState({
    memberId: payment?.memberId ?? '',
    memberName: payment?.memberName ?? '',
    concept: payment?.concept ?? '',
    description: payment?.description ?? '',
    amount: payment?.amount?.toString() ?? '',
    currency: payment?.currency ?? 'CLP',
    method: (payment?.method ?? 'transfer') as PaymentMethod,
    status: (payment?.status ?? 'pending') as PaymentStatus,
    dueDate: payment?.dueDate instanceof Timestamp
      ? payment.dueDate.toDate().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    isRecurring: payment?.isRecurring ?? false,
    paymentType: payment?.isRecurring ? 'monthly' : 'exceptional',
    bulkAll: false,
  });
  const [saving, setSaving] = useState(false);

  const paymentTypePresets = {
    monthly: {
      concept: 'Cuota mensual',
      description: 'Pago mensual de membresía',
    },
    exceptional: {
      concept: '',
      description: '',
    },
  };

  const handleMemberChange = (memberId: string) => {
    const m = members.find(x => x.id === memberId);
    setForm(f => ({ ...f, memberId, memberName: m ? `${m.firstName} ${m.lastName}` : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concept || !form.amount) { toast.error('Completa los campos requeridos'); return; }
    setSaving(true);
    try {
      const dueDate = Timestamp.fromDate(new Date(form.dueDate));
      if (payment) {
        await updatePayment(clubId, payment.id, {
          concept: form.concept,
          description: form.description,
          amount: Number(form.amount),
          method: form.method,
          status: form.status,
          dueDate,
        });
        toast.success('Cobro actualizado');
      } else if (form.bulkAll) {
        const activeMembers = members.filter(m => m.isActive);
        if (activeMembers.length === 0) {
          toast.error('No hay socios activos en este club para generar cobros masivos');
          setSaving(false);
          return;
        }
        await createBulkPayments(clubId, activeMembers, {
          concept: form.concept,
          description: form.description,
          amount: Number(form.amount),
          currency: form.currency,
          method: form.method,
          status: 'pending',
          dueDate,
          isRecurring: form.isRecurring,
        });
        toast.success(`${activeMembers.length} cobros creados`);
      } else {
        if (!form.memberId) { toast.error('Selecciona un socio'); setSaving(false); return; }
        await createPayment(clubId, {
          clubId,
          memberId: form.memberId,
          memberName: form.memberName,
          concept: form.concept,
          description: form.description,
          amount: Number(form.amount),
          currency: form.currency,
          method: form.method,
          status: 'pending',
          dueDate,
          isRecurring: form.isRecurring,
        });
        toast.success('Cobro creado');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar el cobro:', error);
      toast.error(`Error al guardar el cobro: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{payment ? 'Editar Cobro' : 'Crear Cobro'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!payment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cobro</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ 
                    ...f, 
                    paymentType: 'monthly', 
                    isRecurring: true,
                    concept: paymentTypePresets.monthly.concept,
                    description: paymentTypePresets.monthly.description,
                  }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    form.paymentType === 'monthly'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold">📅 Mensual</div>
                  <div className="text-xs mt-1">Cuota recurrente</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ 
                    ...f, 
                    paymentType: 'exceptional', 
                    isRecurring: false,
                    concept: '',
                    description: '',
                  }))}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    form.paymentType === 'exceptional'
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold">⚡ Excepcional</div>
                  <div className="text-xs mt-1">Partido, evento, etc.</div>
                </button>
              </div>
            </div>
          )}
          
          {!payment && (
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-primary-50 rounded-xl">
              <input type="checkbox" checked={form.bulkAll} onChange={e => setForm(f => ({ ...f, bulkAll: e.target.checked, memberId: '', memberName: '' }))} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Cobro masivo (todos los socios activos)</span>
            </label>
          )}
          {!form.bulkAll && !payment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Socio *</label>
              <select className="input-field" value={form.memberId} onChange={e => handleMemberChange(e.target.value)} required={!form.bulkAll}>
                <option value="">Seleccionar socio...</option>
                {members.filter(m => m.isActive).map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto * 
              {form.paymentType === 'exceptional' && <span className="text-xs text-gray-500 ml-2">(Ej: Partido amistoso, Torneo, etc.)</span>}
            </label>
            <input className="input-field" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} placeholder={form.paymentType === 'monthly' ? 'Cuota mensual Enero' : 'Ej: Partido amistoso'} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (CLP) *</label>
              <input type="number" min="0" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento *</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
              <select className="input-field" value={form.method} onChange={e => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="webpay">WebPay</option>
                <option value="mercadopago">MercadoPago</option>
                <option value="flow">Flow</option>
              </select>
            </div>
            {payment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PaymentStatus })}>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : payment ? 'Actualizar' : form.bulkAll ? 'Crear cobros masivos' : 'Crear cobro'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Modal ──────────────────────────────────────────────────────────────

interface EventModalProps {
  clubId: string;
  divisions: Division[];
  event: Event | null;
  onClose: () => void;
  onSaved: () => void;
}

function EventModal({ clubId, divisions, event, onClose, onSaved }: EventModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    location: event?.location ?? '',
    divisionId: event?.divisionId ?? '',
    startDate: event?.startDate instanceof Timestamp
      ? event.startDate.toDate().toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endDate: event?.endDate instanceof Timestamp
      ? event.endDate.toDate().toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    isAllDay: event?.isAllDay ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const startDate = Timestamp.fromDate(new Date(form.startDate));
      const endDate = Timestamp.fromDate(new Date(form.endDate));

      if (event) {
        await updateEvent(clubId, event.id, {
          ...form,
          divisionId: form.divisionId || undefined,
          startDate,
          endDate,
        });
        toast.success('Evento actualizado');
      } else {
        await createEvent(clubId, {
          ...form,
          clubId,
          divisionId: form.divisionId || undefined,
          startDate,
          endDate,
          attendees: [],
          createdBy: user.uid,
        });
        toast.success('Evento creado');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar el evento:', error);
      toast.error(`Error al guardar el evento: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{event ? 'Editar Evento' : 'Crear Evento'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input-field !pl-10" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ej: Gimnasio Municipal" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">División (opcional)</label>
            <select className="input-field" value={form.divisionId} onChange={e => setForm({ ...form, divisionId: e.target.value })}>
              <option value="">Todas las divisiones</option>
              {divisions.map(div => (
                <option key={div.id} value={div.id}>{div.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
              <input type="datetime-local" className="input-field" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input type="datetime-local" className="input-field" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isAllDay} onChange={e => setForm({ ...form, isAllDay: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm text-gray-700">Todo el día</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : event ? 'Actualizar' : 'Crear Evento'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Court Modal ──────────────────────────────────────────────────────────────

interface CourtModalProps {
  clubId: string;
  court: Court | null;
  onClose: () => void;
  onSaved: () => void;
}

function CourtModal({ clubId, court, onClose, onSaved }: CourtModalProps) {
  const [form, setForm] = useState({
    name: court?.name ?? '',
    type: court?.type ?? 'Paddle',
    pricePerHour: court?.pricePerHour?.toString() ?? '15000',
    description: court?.description ?? '',
    isActive: court?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (court) {
        await updateCourt(clubId, court.id, {
          ...form,
          pricePerHour: Number(form.pricePerHour),
        });
        toast.success('Cancha actualizada');
      } else {
        await addCourt(clubId, {
          ...form,
          clubId,
          pricePerHour: Number(form.pricePerHour),
        });
        toast.success('Cancha agregada');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{court ? 'Editar Cancha' : 'Nueva Cancha'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cancha 1 (Vidrio)" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="Paddle">Paddle</option>
              <option value="Tenis">Tenis</option>
              <option value="Basketball">Basketball</option>
              <option value="Futbol">Fútbol</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Hora (CLP) *</label>
            <input type="number" className="input-field" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
            <span className="text-sm text-gray-700">Disponible para arriendo</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : court ? 'Actualizar' : 'Agregar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Booking Modal ────────────────────────────────────────────────────────────

interface BookingModalProps {
  clubId: string;
  courts: Court[];
  members: Member[];
  booking: Booking | null;
  onClose: () => void;
  onSaved: () => void;
}

function BookingModal({ clubId, courts, members, booking, onClose, onSaved }: BookingModalProps) {
  const [form, setForm] = useState({
    courtId: booking?.courtId ?? (courts.length > 0 ? courts[0].id : ''),
    memberId: booking?.memberId ?? '',
    memberName: booking?.memberName ?? '',
    startTime: booking?.startTime instanceof Timestamp
      ? booking.startTime.toDate().toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    duration: '60', // minutes
    status: booking?.status ?? 'confirmed',
  });
  const [saving, setSaving] = useState(false);

  const activeCourts = courts.filter(c => c.isActive || c.id === booking?.courtId);

  const calculateEndDate = (start: string, duration: string) => {
    const d = new Date(start);
    d.setMinutes(d.getMinutes() + Number(duration));
    return d;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courtId) { toast.error('Selecciona una cancha'); return; }
    setSaving(true);
    try {
      const court = courts.find(c => c.id === form.courtId);
      const member = members.find(m => m.id === form.memberId);

      const startDate = new Date(form.startTime);
      const endDate = calculateEndDate(form.startTime, form.duration);

      const hours = Number(form.duration) / 60;
      const totalPrice = hours * (court?.pricePerHour ?? 0);

      const bookingData: any = {
        courtId: form.courtId,
        courtName: court?.name ?? 'Cancha',
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        totalPrice,
        status: form.status as any,
      };

      // Only add memberId and memberName if they exist
      if (form.memberId) {
        bookingData.memberId = form.memberId;
        bookingData.memberName = `${member?.firstName} ${member?.lastName}`;
      } else if (form.memberName) {
        bookingData.memberName = form.memberName;
      }

      if (booking) {
        await updateBooking(clubId, booking.id, bookingData);
        toast.success('Arriendo actualizado');
      } else {
        await addBooking(clubId, {
          ...bookingData,
          clubId,
        });
        toast.success('Arriendo agendado');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{booking ? 'Editar Arriendo' : 'Nuevo Arriendo'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cancha *</label>
            <select className="input-field" value={form.courtId} onChange={e => setForm({ ...form, courtId: e.target.value })} required>
              <option value="">Seleccionar cancha...</option>
              {activeCourts.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({formatCLP(c.pricePerHour)}/hr)</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Socio (Opcional)</label>
              <select className="input-field" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value, memberName: '' })}>
                <option value="">No socio / Externo</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
            {!form.memberId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Cliente *</label>
                <input className="input-field" value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} required={!form.memberId} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
              <input type="datetime-local" className="input-field" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <select className="input-field" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente de pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : booking ? 'Actualizar' : 'Agendar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Match Modal ──────────────────────────────────────────────────────────────

interface MatchModalProps {
  clubId: string;
  userId: string;
  members: Member[];
  divisions: Division[];
  match: Match | null;
  onClose: () => void;
  onSaved: () => void;
}

function MatchModal({ clubId, userId, members, divisions, match, onClose, onSaved }: MatchModalProps) {
  const [form, setForm] = useState({
    title: match?.title ?? '',
    description: match?.description ?? '',
    category: (match?.category ?? 'adulto') as PlayerCategory,
    divisionId: match?.divisionId ?? '',
    opponent: match?.opponent ?? '',
    location: match?.location ?? '',
    date: match?.date instanceof Timestamp
      ? match.date.toDate().toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    cost: match?.cost?.toString() ?? '5000',
    status: (match?.status ?? 'scheduled') as 'scheduled' | 'completed' | 'cancelled',
  });
  const [saving, setSaving] = useState(false);
  const [additionalMembers, setAdditionalMembers] = useState<string[]>([]);

  const eligibleMembers = members.filter(m => 
    m.isActive && 
    m.category && 
    (form.category === 'mixto' || m.category === form.category) &&
    (!form.divisionId || m.divisionId === form.divisionId)
  );

  const otherMembers = members.filter(m =>
    m.isActive &&
    m.category &&
    (form.category === 'mixto' || m.category === form.category) &&
    form.divisionId &&
    m.divisionId !== form.divisionId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const matchDate = Timestamp.fromDate(new Date(form.date));
      
      if (match) {
        await updateMatch(clubId, match.id, {
          title: form.title,
          description: form.description,
          category: form.category,
          divisionId: form.divisionId || undefined,
          opponent: form.opponent,
          location: form.location,
          date: matchDate,
          cost: Number(form.cost),
          status: form.status,
        });
        toast.success('Partido actualizado');
      } else {
        // Filter members: division members + additional selected members
        const selectedMembers = members.filter(m => 
          (m.isActive && m.category && 
           (form.category === 'mixto' || m.category === form.category) &&
           (!form.divisionId || m.divisionId === form.divisionId)) ||
          additionalMembers.includes(m.id)
        );
        
        await createMatchWithPayments(clubId, userId, {
          clubId,
          title: form.title,
          description: form.description,
          category: form.category,
          divisionId: form.divisionId || undefined,
          opponent: form.opponent,
          location: form.location,
          date: matchDate,
          cost: Number(form.cost),
          status: 'scheduled',
        }, selectedMembers);
        toast.success(`Partido creado con ${selectedMembers.length} cobros generados`);
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{match ? 'Editar Partido' : 'Crear Partido'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Amistoso vs Club X" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as PlayerCategory })} required>
                <option value="infantil">Infantil</option>
                <option value="juvenil">Juvenil</option>
                <option value="adulto">Adulto</option>
                <option value="mixto">Mixto (todas)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">División</label>
              <select className="input-field" value={form.divisionId} onChange={e => setForm({ ...form, divisionId: e.target.value })}>
                <option value="">Todas las divisiones</option>
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo por jugador (CLP) *</label>
            <input type="number" min="0" className="input-field" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rival</label>
              <input className="input-field" value={form.opponent} onChange={e => setForm({ ...form, opponent: e.target.value })} placeholder="Ej: Club Deportivo X" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
              <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ej: Cancha Municipal" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
              <input type="datetime-local" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            {match && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="scheduled">Programado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>
          {!match && (
            <>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{eligibleMembers.length + additionalMembers.length}</strong> jugadores recibirán un cobro de <strong>${Number(form.cost).toLocaleString('es-CL')}</strong>
                  {form.divisionId && divisions.find(d => d.id === form.divisionId) && (
                    <span className="block mt-1">
                      División: <strong>{divisions.find(d => d.id === form.divisionId)?.name}</strong> ({eligibleMembers.length} jugadores)
                    </span>
                  )}
                </p>
              </div>
              
              {form.divisionId && otherMembers.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agregar jugadores de otras divisiones (opcional)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {otherMembers.map(m => (
                      <label key={m.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={additionalMembers.includes(m.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setAdditionalMembers([...additionalMembers, m.id]);
                            } else {
                              setAdditionalMembers(additionalMembers.filter(id => id !== m.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm text-gray-700">
                          {m.firstName} {m.lastName}
                          {m.divisionId && divisions.find(d => d.id === m.divisionId) && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({divisions.find(d => d.id === m.divisionId)?.name})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Guardando...' : match ? 'Actualizar' : 'Crear Partido'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk Match Modal ─────────────────────────────────────────────────────────

interface BulkMatchModalProps {
  clubId: string;
  userId: string;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}

function BulkMatchModal({ clubId, userId, members, onClose, onSaved }: BulkMatchModalProps) {
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const lines = bulkText.trim().split('\n').filter(l => l.trim());
      const matches: Array<Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'paymentIds' | 'participants' | 'participantNames'>> = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 4) continue;

        const [title, category, dateStr, costStr, opponent = '', location = ''] = parts;
        
        matches.push({
          clubId,
          title,
          category: category.toLowerCase() as PlayerCategory,
          date: Timestamp.fromDate(new Date(dateStr)),
          cost: Number(costStr),
          opponent,
          location,
          description: '',
          status: 'scheduled',
        });
      }

      if (matches.length === 0) {
        toast.error('No se encontraron partidos válidos');
        return;
      }

      const matchIds = await createBulkMatches(clubId, userId, matches, members);
      toast.success(`${matchIds.length} partidos creados con cobros automáticos`);
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Carga Masiva de Partidos</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-blue-900">Formato CSV (un partido por línea):</p>
            <code className="block text-xs text-blue-700 bg-blue-100 p-2 rounded">
              Título, Categoría, Fecha, Costo, Rival, Lugar
            </code>
            <p className="text-xs text-blue-600">
              <strong>Ejemplo:</strong><br/>
              Amistoso vs Club X, adulto, 2026-03-15 18:00, 5000, Club X, Cancha Municipal<br/>
              Torneo Infantil, infantil, 2026-03-20 10:00, 3000, Club Y, Estadio Central
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partidos (CSV)</label>
            <textarea 
              className="input-field font-mono text-sm" 
              rows={10} 
              value={bulkText} 
              onChange={e => setBulkText(e.target.value)}
              placeholder="Amistoso vs Club X, adulto, 2026-03-15 18:00, 5000, Club X, Cancha Municipal"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">{saving ? 'Creando...' : 'Crear Partidos'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Overview state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberModal, setMemberModal] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });

  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [paymentView, setPaymentView] = useState<'list' | 'kanban'>('list');
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventModal, setEventModal] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });

  // Rentals state
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [courtModal, setCourtModal] = useState<{ open: boolean; court: Court | null }>({ open: false, court: null });
  const [bookingModal, setBookingModal] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });

  // Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchModal, setMatchModal] = useState<{ open: boolean; match: Match | null }>({ open: false, match: null });
  const [bulkMatchModal, setBulkMatchModal] = useState(false);
  const [matchSearch, setMatchSearch] = useState('');

  // Divisions state
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchClubs = async () => {
        try {
          const loadClubs = isSuperAdmin ? getAllClubs() : getUserClubsForUser(user.uid);
          const data = await loadClubs;

          const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setClubs(sorted);

          if (sorted.length > 0) {
            // Pick first club if none selected or if selected one not in new list
            if (!selectedClub || !sorted.find(c => c.id === selectedClub.id)) {
              setSelectedClub(sorted[0]);
            }
          } else {
            setSelectedClub(null);
          }
        } catch (error: any) {
          console.error('Error loading clubs:', error);
          toast.error(`Error al cargar clubes: ${error.message || 'Error desconocido'}`);
          setClubs([]);
          setSelectedClub(null);
        }
      };

      fetchClubs();
    }
  }, [user, isSuperAdmin]);

  const loadStats = useCallback(async () => {
    if (!selectedClub) return;
    setStatsLoading(true);
    try {
      const s = await getDashboardStats(selectedClub.id);
      setStats(s);
    } catch { toast.error('Error al cargar estadísticas'); }
    finally { setStatsLoading(false); }
  }, [selectedClub]);

  const loadMembers = useCallback(async () => {
    if (!selectedClub) return;
    setMembersLoading(true);
    try {
      const m = await getMembers(selectedClub.id);
      setMembers(m);
    } catch { toast.error('Error al cargar socios'); }
    finally { setMembersLoading(false); }
  }, [selectedClub]);

  const loadPayments = useCallback(async () => {
    if (!selectedClub) return;
    setPaymentsLoading(true);
    try {
      const p = await getPayments(selectedClub.id);
      setPayments(p);
    } catch { toast.error('Error al cargar pagos'); }
    finally { setPaymentsLoading(false); }
  }, [selectedClub]);

  const loadEvents = useCallback(async () => {
    if (!selectedClub) return;
    setEventsLoading(true);
    try {
      const e = await getEvents(selectedClub.id);
      setEvents(e);
    } catch { toast.error('Error al cargar eventos'); }
    finally { setEventsLoading(false); }
  }, [selectedClub]);

  const loadCourts = useCallback(async () => {
    if (!selectedClub) return;
    setCourtsLoading(true);
    try {
      const c = await getCourts(selectedClub.id);
      setCourts(c);
    } catch { toast.error('Error al cargar canchas'); }
    finally { setCourtsLoading(false); }
  }, [selectedClub]);

  const loadBookings = useCallback(async () => {
    if (!selectedClub) return;
    setBookingsLoading(true);
    try {
      const b = await getBookings(selectedClub.id);
      setBookings(b);
    } catch { toast.error('Error al cargar arriendos'); }
    finally { setBookingsLoading(false); }
  }, [selectedClub]);

  const loadMatches = useCallback(async () => {
    if (!selectedClub) return;
    setMatchesLoading(true);
    try {
      const m = await getMatches(selectedClub.id);
      setMatches(m);
    } catch { toast.error('Error al cargar partidos'); }
    finally { setMatchesLoading(false); }
  }, [selectedClub]);

  const loadDivisions = useCallback(async () => {
    if (!selectedClub) return;
    try {
      const divs = await getDivisions(selectedClub.id);
      setDivisions(divs);
    } catch { toast.error('Error al cargar divisiones'); }
  }, [selectedClub]);

  useEffect(() => {
    if (!selectedClub) return;
    loadDivisions();
    if (activeTab === 'overview') loadStats();
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'payments') { loadPayments(); loadMembers(); }
    if (activeTab === 'matches') { loadMatches(); loadMembers(); }
    if (activeTab === 'events') loadEvents();
    if (activeTab === 'rentals') { loadCourts(); loadBookings(); loadMembers(); }
  }, [activeTab, selectedClub, loadStats, loadMembers, loadPayments, loadMatches, loadEvents, loadCourts, loadBookings, loadDivisions]);

  const handleSignOut = async () => { await signOut(); router.push('/'); };

  const handleDeleteMember = async (m: Member) => {
    if (!selectedClub) return;
    if (!confirm(`¿Eliminar a ${m.firstName} ${m.lastName}?`)) return;
    try {
      await deleteMember(selectedClub.id, m.id);
      toast.success('Socio eliminado');
      loadMembers();
    } catch { toast.error('Error al eliminar socio'); }
  };

  const handleDeleteEvent = async (ev: Event) => {
    if (!selectedClub) return;
    if (!confirm(`¿Eliminar el evento "${ev.title}"?`)) return;
    try {
      await deleteEvent(selectedClub.id, ev.id);
      toast.success('Evento eliminado');
      loadEvents();
    } catch { toast.error('Error al eliminar evento'); }
  };

  const handleDeleteCourt = async (court: Court) => {
    if (!selectedClub) return;
    if (!confirm(`¿Eliminar la cancha "${court.name}"? Se perderán los arriendos asociados.`)) return;
    try {
      await deleteCourt(selectedClub.id, court.id);
      toast.success('Cancha eliminada');
      loadCourts();
    } catch { toast.error('Error al eliminar cancha'); }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!selectedClub) return;
    if (!confirm(`¿Eliminar este arriendo?`)) return;
    try {
      await deleteBooking(selectedClub.id, booking.id);
      toast.success('Arriendo eliminado');
      loadBookings();
    } catch { toast.error('Error al eliminar arriendo'); }
  };

  const handleCancelPayment = async (p: Payment) => {
    if (!selectedClub) return;
    if (!confirm('¿Cancelar este cobro?')) return;
    try {
      await cancelPayment(selectedClub.id, p.id);
      toast.success('Cobro cancelado');
      loadPayments();
    } catch { toast.error('Error al cancelar cobro'); }
  };

  const handleMarkPaid = async (p: Payment) => {
    if (!selectedClub) return;
    try {
      await updatePayment(selectedClub.id, p.id, {
        status: 'paid',
        paidAt: Timestamp.now(),
      });
      toast.success('Marcado como pagado');
      loadPayments();
    } catch { toast.error('Error al actualizar pago'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { id: 'overview', name: 'Resumen', icon: Home },
    { id: 'members', name: 'Socios', icon: Users },
    { id: 'payments', name: 'Pagos', icon: CreditCard },
    { id: 'matches', name: 'Partidos', icon: Trophy },
    { id: 'events', name: 'Eventos', icon: Calendar },
    { id: 'rentals', name: 'Arriendos', icon: LayoutGrid },
    { id: 'documents', name: 'Documentos', icon: FileText },
    { id: 'reports', name: 'Reportes', icon: BarChart3 },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ];

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email} ${m.rut ?? ''}`.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredPayments = payments.filter(p => {
    const matchesSearch = `${p.memberName} ${p.concept}`.toLowerCase().includes(paymentSearch.toLowerCase());
    const matchesStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEvents = events.filter(e =>
    `${e.title} ${e.description} ${e.location ?? ''}`.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">PCD<span className="text-primary-600">Club</span></span>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Club Selector */}
          <div className="px-4 py-3 border-b border-gray-100">
            {selectedClub ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">{selectedClub.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedClub.name}</p>
                    <p className="text-xs text-gray-500">{selectedClub.memberCount} socios</p>
                  </div>
                </div>
              </div>
            ) : (
              isSuperAdmin ? (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2 p-2 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors w-full"
                >
                  <Plus className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">Ir a Configuración</span>
                </button>
              ) : (
                <div className="p-2 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700">Sin club asignado</p>
                  <p className="text-xs text-gray-500">Pide a un SuperAdmin que te asigne un club</p>
                </div>
              )
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'Usuario'}
                  {isSuperAdmin && <span className="ml-1 text-xs bg-accent-500 text-white px-1.5 py-0.5 rounded">SuperAdmin</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button onClick={handleSignOut} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find(n => n.id === activeTab)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {statsLoading ? (
                <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : !selectedClub ? (
                <div className="card p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500 mb-1">Sin club seleccionado</p>
                  {isSuperAdmin && <Link href="/dashboard/crear-club" className="btn-primary inline-flex mt-4"><Plus className="w-4 h-4 mr-2" />Crear Club</Link>}
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {([
                      { label: 'Socios Activos', value: stats?.activeMembers?.toString() ?? '—', icon: Users, color: 'blue', sub: `${stats?.totalMembers ?? 0} totales` },
                      { label: 'Recaudado Total', value: stats ? formatCLP(stats.totalRevenue) : '—', icon: DollarSign, color: 'green', sub: `${stats?.collectionRate ?? 0}% tasa de cobro` },
                      { label: 'Tasa de Cobro', value: stats ? `${stats.collectionRate}%` : '—', icon: TrendingUp, color: 'purple', sub: 'pagos completados' },
                      { label: 'Pagos Pendientes', value: stats?.pendingPayments?.toString() ?? '—', icon: Clock, color: 'orange', sub: `${stats?.overduePayments ?? 0} vencidos` },
                    ]).map((s) => (
                      <div key={s.label} className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500">{s.label}</span>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === 'blue' ? 'bg-blue-50' : s.color === 'green' ? 'bg-green-50' : s.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
                            <s.icon className={`w-5 h-5 ${s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-green-600' : s.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts and Recent */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-gray-900">Ingresos Mensuales</h3>
                        <button onClick={loadStats} className="p-1.5 text-gray-400 hover:text-gray-600" title="Actualizar"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                      {(() => {
                        const chartData = stats?.monthlyRevenue ?? [];
                        const chartMax = Math.max(...chartData.map(d => d.amount), 1);
                        return (
                          <div className="flex items-end gap-1.5 h-48">
                            {chartData.map((d, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                                  style={{ height: `${Math.max((d.amount / chartMax) * 100, d.amount > 0 ? 4 : 0)}%` }} />
                                <span className="text-[10px] text-gray-400">{d.month}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Últimos Pagos</h3>
                        <button onClick={() => setActiveTab('payments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Ver todos</button>
                      </div>
                      {(stats?.recentPayments ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sin pagos registrados</p>
                      ) : (
                        <div className="space-y-3">
                          {(stats?.recentPayments ?? []).map((rp) => (
                            <div key={rp.id} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-[10px] font-medium text-gray-600">{rp.memberName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{rp.memberName}</p>
                                  <p className="text-xs text-gray-400">{tsToRelative(rp.createdAt)}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-sm font-medium text-gray-900">{formatCLP(rp.amount)}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[rp.status] ?? ''}`}>{STATUS_LABELS[rp.status] ?? rp.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {([
                      { label: 'Agregar Socio', icon: UserPlus, color: 'bg-blue-50 text-blue-600', action: () => { setActiveTab('members'); setTimeout(() => setMemberModal({ open: true, member: null }), 100); } },
                      { label: 'Crear Cobro', icon: CreditCard, color: 'bg-green-50 text-green-600', action: () => { setActiveTab('payments'); setTimeout(() => setPaymentModal({ open: true, payment: null }), 100); } },
                      { label: 'Ver Socios', icon: Users, color: 'bg-purple-50 text-purple-600', action: () => setActiveTab('members') },
                      { label: 'Ver Pagos', icon: BarChart3, color: 'bg-orange-50 text-orange-600', action: () => setActiveTab('payments') },
                    ]).map((a) => (
                      <button key={a.label} onClick={a.action} className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}><a.icon className="w-5 h-5" /></div>
                        <span className="text-sm font-medium text-gray-700">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4 animate-fade-in">
              {memberModal.open && selectedClub && (
                <MemberModal clubId={selectedClub.id} member={memberModal.member} divisions={divisions}
                  onClose={() => setMemberModal({ open: false, member: null })} onSaved={loadMembers} />
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Socios</h3>
                <button onClick={() => setMemberModal({ open: true, member: null })} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Agregar Socio
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field !pl-10" placeholder="Buscar por nombre, email o RUT..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
              </div>
              {membersLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : filteredMembers.length === 0 ? (
                <div className="card p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">{members.length === 0 ? 'Sin socios aún' : 'Sin resultados'}</p>
                  <p className="text-sm text-gray-400 mt-1">{members.length === 0 ? 'Agrega tu primer socio para comenzar' : 'Intenta con otra búsqueda'}</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Nombre</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Email</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">RUT</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredMembers.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-primary-600">{m.firstName[0]}{m.lastName[0]}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-gray-900">{m.firstName} {m.lastName}</span>
                                  <div className="flex items-center gap-1.5">
                                    {m.category && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                        <Trophy className="w-3 h-3 inline mr-0.5" />
                                        {m.category.charAt(0).toUpperCase() + m.category.slice(1)}
                                      </span>
                                    )}
                                    {m.divisionId && divisions.find(d => d.id === m.divisionId) && (
                                      <span 
                                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                        style={{ 
                                          backgroundColor: divisions.find(d => d.id === m.divisionId)?.color + '20',
                                          color: divisions.find(d => d.id === m.divisionId)?.color 
                                        }}
                                      >
                                        {divisions.find(d => d.id === m.divisionId)?.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{m.email}</td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.rut || '—'}</td>
                            <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ROLE_LABELS[m.role] ?? m.role}</span></td>
                            <td className="px-4 py-3 text-center">
                              {m.isActive
                                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3.5 h-3.5" />Activo</span>
                                : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400"><XCircle className="w-3.5 h-3.5" />Inactivo</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setMemberModal({ open: true, member: m })} className="p-1.5 text-gray-400 hover:text-primary-600" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteMember(m)} className="p-1.5 text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{filteredMembers.length} de {members.length} socios</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4 animate-fade-in">
              {paymentModal.open && selectedClub && (
                <PaymentModal clubId={selectedClub.id} members={members} payment={paymentModal.payment}
                  onClose={() => setPaymentModal({ open: false, payment: null })} onSaved={loadPayments} />
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Pagos</h3>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button onClick={() => setPaymentView('list')} className={`p-1.5 rounded-md text-sm font-medium transition-colors ${paymentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Vista de lista">
                      <Menu className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPaymentView('kanban')} className={`p-1.5 rounded-md text-sm font-medium transition-colors ${paymentView === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Vista de tarjetas">
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => setPaymentModal({ open: true, payment: null })} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Crear Cobro
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input-field !pl-10" placeholder="Buscar por socio o concepto..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} />
                </div>
                <select className="input-field !w-auto" value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value as PaymentStatus | 'all')}>
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : filteredPayments.length === 0 ? (
                <div className="card p-12 text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">{payments.length === 0 ? 'Sin cobros aún' : 'Sin resultados'}</p>
                  <p className="text-sm text-gray-400 mt-1">{payments.length === 0 ? 'Crea tu primer cobro para comenzar' : 'Intenta con otra búsqueda o filtro'}</p>
                </div>
              ) : paymentView === 'list' ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Socio</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Concepto</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Monto</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Vencimiento</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredPayments.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{p.memberName}</td>
                            <td className="px-4 py-3 text-gray-500">{p.concept}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCLP(p.amount)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? ''}`}>{STATUS_LABELS[p.status] ?? p.status}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.dueDate instanceof Timestamp ? p.dueDate.toDate().toLocaleDateString('es-CL') : '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {p.status === 'pending' && (
                                  <button onClick={() => handleMarkPaid(p)} className="p-1.5 text-gray-400 hover:text-green-600" title="Marcar pagado"><CheckCircle className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => setPaymentModal({ open: true, payment: p })} className="p-1.5 text-gray-400 hover:text-primary-600" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                {p.status !== 'cancelled' && p.status !== 'paid' && (
                                  <button onClick={() => handleCancelPayment(p)} className="p-1.5 text-gray-400 hover:text-red-500" title="Cancelar"><XCircle className="w-4 h-4" /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">{filteredPayments.length} de {payments.length} cobros</div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {(['pending', 'paid', 'overdue'] as PaymentStatus[]).map((status) => {
                    const colPayments = filteredPayments.filter(p => p.status === status);
                    const bgColors: Record<PaymentStatus, string> = { 
                      pending: 'bg-yellow-50', 
                      paid: 'bg-green-50', 
                      overdue: 'bg-red-50',
                      cancelled: 'bg-gray-50',
                      refunded: 'bg-blue-50'
                    };
                    const borderColors: Record<PaymentStatus, string> = { 
                      pending: 'border-yellow-200', 
                      paid: 'border-green-200', 
                      overdue: 'border-red-200',
                      cancelled: 'border-gray-200',
                      refunded: 'border-blue-200'
                    };
                    return (
                      <div key={status} className={`flex-none w-80 flex flex-col gap-3 p-3 rounded-2xl border ${bgColors[status]} ${borderColors[status]} snap-start`}>
                        <div className="flex items-center justify-between px-1">
                          <h4 className="font-semibold text-gray-900">{STATUS_LABELS[status]}</h4>
                          <span className="text-xs font-medium bg-white px-2 py-1 rounded-full shadow-sm text-gray-600">{colPayments.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {colPayments.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium text-gray-900">{p.memberName}</h5>
                                  <p className="text-xs text-gray-500">{p.concept}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => setPaymentModal({ open: true, payment: p })} className="p-1 text-gray-400 hover:text-primary-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              <div className="flex items-end justify-between mt-4">
                                <div>
                                  <p className="text-lg font-bold text-gray-900">{formatCLP(p.amount)}</p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {p.dueDate instanceof Timestamp ? p.dueDate.toDate().toLocaleDateString('es-CL') : '—'}
                                  </p>
                                </div>
                                {p.status === 'pending' && (
                                  <button onClick={() => handleMarkPaid(p)} className="btn-primary text-xs !py-1.5 !px-3 shadow-sm">
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {colPayments.length === 0 && (
                            <div className="text-center py-8 text-sm text-gray-400">
                              Sin cobros en este estado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4 animate-fade-in">
              {eventModal.open && selectedClub && (
                <EventModal clubId={selectedClub.id} divisions={divisions} event={eventModal.event}
                  onClose={() => setEventModal({ open: false, event: null })} onSaved={loadEvents} />
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Eventos</h3>
                <button onClick={() => setEventModal({ open: true, event: null })} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Crear Evento
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field !pl-10" placeholder="Buscar eventos por título, descripción o lugar..." value={eventSearch} onChange={e => setEventSearch(e.target.value)} />
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : filteredEvents.length === 0 ? (
                <div className="card p-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">{events.length === 0 ? 'Sin eventos programados' : 'Sin resultados'}</p>
                  <p className="text-sm text-gray-400 mt-1">{events.length === 0 ? 'Crea un evento para reunir a tus socios' : 'Intenta con otra búsqueda'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map(ev => (
                    <div key={ev.id} className="card group hover:shadow-md transition-all">
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="bg-primary-50 p-2.5 rounded-xl group-hover:bg-primary-100 transition-colors">
                            <Calendar className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEventModal({ open: true, event: ev })} className="p-1.5 text-gray-400 hover:text-primary-600 focus:outline-none"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteEvent(ev)} className="p-1.5 text-gray-400 hover:text-red-500 focus:outline-none"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{ev.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{ev.description || 'Sin descripción'}</p>
                        <div className="space-y-2 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-primary-500" />
                            <span>{ev.startDate.toDate().toLocaleDateString('es-CL')} • {ev.startDate.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5 text-accent-500" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rentals' && (
            <div className="space-y-6 animate-fade-in">
              {courtModal.open && selectedClub && (
                <CourtModal clubId={selectedClub.id} court={courtModal.court}
                  onClose={() => setCourtModal({ open: false, court: null })} onSaved={loadCourts} />
              )}
              {bookingModal.open && selectedClub && (
                <BookingModal clubId={selectedClub.id} courts={courts} members={members} booking={bookingModal.booking}
                  onClose={() => setBookingModal({ open: false, booking: null })} onSaved={loadBookings} />
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Arriendo de Canchas</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setCourtModal({ open: true, court: null })} className="btn-secondary text-sm !py-2 !px-4 flex items-center justify-center gap-2 flex-1 sm:flex-none">
                    <Trophy className="w-4 h-4" /> Configurar Cancha
                  </button>
                  <button onClick={() => setBookingModal({ open: true, booking: null })} className="btn-primary text-sm !py-2 !px-4 flex items-center justify-center gap-2 flex-1 sm:flex-none">
                    <Plus className="w-4 h-4" /> Nueva Reserva
                  </button>
                </div>
              </div>

              {/* Courts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {courts.map(court => (
                  <div key={court.id} className={`card p-4 border-l-4 ${court.isActive ? 'border-l-primary-500' : 'border-l-gray-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">{court.type}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setCourtModal({ open: true, court })} className="p-1 text-gray-400 hover:text-primary-600 focus:outline-none"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteCourt(court)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900">{court.name}</h4>
                    <p className="text-xl font-black text-primary-700 mt-1">{formatCLP(court.pricePerHour)}<span className="text-xs font-normal text-gray-500"> / hr</span></p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${court.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {court.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                ))}
                {courts.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-gray-50/50">
                    <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No hay canchas configuradas aún</p>
                    <button onClick={() => setCourtModal({ open: true, court: null })} className="text-primary-600 font-medium text-sm mt-2 hover:underline">Configurar mi primera cancha</button>
                  </div>
                )}
              </div>

              {/* Agenda / Bookings */}
              <div className="card">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" /> Agenda de Reservas
                  </h4>
                </div>
                {bookingsLoading ? (
                  <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
                ) : bookings.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No hay reservas agendadas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50 text-left">
                          <th className="px-4 py-3 font-medium text-gray-500">Cancha</th>
                          <th className="px-4 py-3 font-medium text-gray-500">Cliente / Socio</th>
                          <th className="px-4 py-3 font-medium text-gray-500">Fecha y Hora</th>
                          <th className="px-4 py-3 font-medium text-gray-500 text-right">Monto</th>
                          <th className="px-4 py-3 font-medium text-gray-500 text-center">Estado</th>
                          <th className="px-4 py-3 font-medium text-gray-500 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bookings.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis()).map(booking => (
                          <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{booking.courtName}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{booking.memberName}</span>
                                {booking.memberId && <span className="text-[10px] text-primary-600 uppercase font-bold tracking-tight">Socio</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col text-xs">
                                <span className="font-medium text-gray-700">{booking.startTime.toDate().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                <span className="text-gray-500">{booking.startTime.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} - {booking.endTime.toDate().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">{formatCLP(booking.totalPrice)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {booking.status === 'confirmed' ? 'Confirmada' :
                                  booking.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setBookingModal({ open: true, booking })} className="p-1.5 text-gray-400 hover:text-primary-600 focus:outline-none"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteBooking(booking)} className="p-1.5 text-gray-400 hover:text-red-500 focus:outline-none"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-6 animate-fade-in">
              {matchModal.open && selectedClub && user && (
                <MatchModal clubId={selectedClub.id} userId={user.uid} members={members} divisions={divisions} match={matchModal.match}
                  onClose={() => setMatchModal({ open: false, match: null })} onSaved={loadMatches} />
              )}
              {bulkMatchModal && selectedClub && user && (
                <BulkMatchModal clubId={selectedClub.id} userId={user.uid} members={members}
                  onClose={() => setBulkMatchModal(false)} onSaved={loadMatches} />
              )}
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Partidos</h3>
                <div className="flex gap-2">
                  <button onClick={() => setBulkMatchModal(true)} className="btn-secondary text-sm !py-2 !px-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Carga Masiva
                  </button>
                  <button onClick={() => setMatchModal({ open: true, match: null })} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear Partido
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field !pl-10" placeholder="Buscar partidos..." value={matchSearch} onChange={e => setMatchSearch(e.target.value)} />
              </div>

              {matchesLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : matches.length === 0 ? (
                <div className="card p-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">Sin partidos programados</p>
                  <p className="text-sm text-gray-400 mt-1">Crea un partido para generar cobros automáticos por categoría</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.filter(m => 
                    m.title.toLowerCase().includes(matchSearch.toLowerCase()) ||
                    m.opponent?.toLowerCase().includes(matchSearch.toLowerCase()) ||
                    m.category.toLowerCase().includes(matchSearch.toLowerCase())
                  ).map(match => {
                    const matchDate = match.date instanceof Timestamp ? match.date.toDate() : new Date();
                    const categoryColors: Record<PlayerCategory, string> = {
                      infantil: 'bg-blue-100 text-blue-700',
                      juvenil: 'bg-green-100 text-green-700',
                      adulto: 'bg-purple-100 text-purple-700',
                      mixto: 'bg-pink-100 text-pink-700',
                    };
                    
                    return (
                      <div key={match.id} className="card group hover:shadow-md transition-all">
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{match.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[match.category]}`}>
                                {match.category.charAt(0).toUpperCase() + match.category.slice(1)}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setMatchModal({ open: true, match })} className="p-1.5 text-gray-400 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={async () => {
                                if (!selectedClub || !confirm('¿Eliminar este partido y sus cobros asociados?')) return;
                                try {
                                  await deleteMatch(selectedClub.id, match.id);
                                  toast.success('Partido eliminado');
                                  loadMatches();
                                } catch { toast.error('Error al eliminar'); }
                              }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          
                          {match.opponent && (
                            <p className="text-sm text-gray-600 mb-2">🏆 vs {match.opponent}</p>
                          )}
                          
                          <div className="space-y-1 text-sm text-gray-500">
                            <p>📅 {matchDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            {match.location && <p>📍 {match.location}</p>}
                            <p>💰 {formatCLP(match.cost)} por jugador</p>
                            <p>👥 {match.participants.length} participantes</p>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              match.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                              match.status === 'completed' ? 'bg-green-50 text-green-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {match.status === 'scheduled' ? 'Programado' :
                               match.status === 'completed' ? 'Completado' : 'Cancelado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <>
              {isSuperAdmin && (
                <div className="mb-6">
                  <SuperAdminSettings />
                </div>
              )}
              {selectedClub && (
                <SettingsTab club={selectedClub} onUpdate={() => {}} />
              )}
            </>
          )}

          {['documents', 'reports'].includes(activeTab) && (
            <div className="card p-6 animate-fade-in">
              <div className="text-center py-12 text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-500">
                  {navigation.find(n => n.id === activeTab)?.name}
                </p>
                <p className="text-sm mt-1">Esta sección estará disponible próximamente</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
