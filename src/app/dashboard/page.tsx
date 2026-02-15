'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserClubsForUser } from '@/lib/firestore';
import { Club } from '@/types';
import {
  Zap, Plus, Users, CreditCard, BarChart3, Settings,
  LogOut, Bell, ChevronRight, Home, Calendar, FileText,
  TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign,
  UserPlus, Menu, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, userData, isSuperAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserClubsForUser(user.uid)
        .then((data) => {
          setClubs(data);
          if (data.length > 0) setSelectedClub(data[0]);
        })
        .catch((err) => {
          console.error('Failed to load user clubs:', err);
          setClubs([]);
          setSelectedClub(null);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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
    { id: 'events', name: 'Eventos', icon: Calendar },
    { id: 'documents', name: 'Documentos', icon: FileText },
    { id: 'reports', name: 'Reportes', icon: BarChart3 },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ];

  const mockStats = {
    totalMembers: 156,
    activeMembers: 142,
    totalRevenue: 4250000,
    pendingPayments: 18,
    overduePayments: 5,
    collectionRate: 94,
  };

  const mockRecentPayments = [
    { id: '1', memberName: 'Carlos Mendoza', amount: 35000, status: 'paid', date: 'Hoy' },
    { id: '2', memberName: 'María José Soto', amount: 35000, status: 'paid', date: 'Hoy' },
    { id: '3', memberName: 'Roberto Fuentes', amount: 35000, status: 'pending', date: 'Ayer' },
    { id: '4', memberName: 'Ana Martínez', amount: 45000, status: 'paid', date: 'Ayer' },
    { id: '5', memberName: 'Diego Ramírez', amount: 35000, status: 'overdue', date: 'Hace 3 días' },
  ];

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
  };

  const statusColors: Record<string, string> = {
    paid: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    overdue: 'text-red-600 bg-red-50',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Pagado',
    pending: 'Pendiente',
    overdue: 'Vencido',
  };

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
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">{selectedClub.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedClub.name}</p>
                  <p className="text-xs text-gray-500">{selectedClub.memberCount} socios</p>
                </div>
              </div>
            ) : (
              isSuperAdmin ? (
                <Link href="/dashboard/crear-club" className="flex items-center gap-2 p-2 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
                  <Plus className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">Crear Club</span>
                </Link>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id
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
                <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Usuario'}</p>
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
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Socios Activos', value: mockStats.activeMembers.toString(), icon: Users, color: 'blue', change: '+12 este mes' },
                  { label: 'Recaudado (Mes)', value: formatCLP(mockStats.totalRevenue), icon: DollarSign, color: 'green', change: '+8% vs mes anterior' },
                  { label: 'Tasa de Cobro', value: `${mockStats.collectionRate}%`, icon: TrendingUp, color: 'purple', change: '+5% vs mes anterior' },
                  { label: 'Pagos Pendientes', value: mockStats.pendingPayments.toString(), icon: Clock, color: 'orange', change: `${mockStats.overduePayments} vencidos` },
                ].map((stat) => (
                  <div key={stat.label} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{stat.label}</span>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        stat.color === 'blue' ? 'bg-blue-50' :
                        stat.color === 'green' ? 'bg-green-50' :
                        stat.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'
                      }`}>
                        <stat.icon className={`w-5 h-5 ${
                          stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'green' ? 'text-green-600' :
                          stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                        }`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Charts and Recent */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart Placeholder */}
                <div className="lg:col-span-2 card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-900">Ingresos Mensuales</h3>
                    <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                      <option>Últimos 12 meses</option>
                      <option>Últimos 6 meses</option>
                      <option>Este año</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 h-48">
                    {[35, 45, 42, 55, 60, 52, 68, 72, 65, 78, 82, 90].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-gray-400">
                          {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Últimos Pagos</h3>
                    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Ver todos</button>
                  </div>
                  <div className="space-y-3">
                    {mockRecentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-600">{payment.memberName.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{payment.memberName}</p>
                            <p className="text-xs text-gray-400">{payment.date}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-medium text-gray-900">{formatCLP(payment.amount)}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[payment.status]}`}>
                            {statusLabels[payment.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Agregar Socio', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Crear Cobro', icon: CreditCard, color: 'bg-green-50 text-green-600' },
                  { label: 'Nuevo Evento', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Enviar Recordatorio', icon: Bell, color: 'bg-orange-50 text-orange-600' },
                ].map((action) => (
                  <button key={action.label} className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-200">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Socios</h3>
                <button className="btn-primary text-sm !py-2 !px-4">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar Socio
                </button>
              </div>
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-500">Configura tu club para empezar</p>
                <p className="text-sm mt-1">Crea tu club y agrega tus primeros socios</p>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Pagos</h3>
                <button className="btn-primary text-sm !py-2 !px-4">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Crear Cobro
                </button>
              </div>
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-500">Sistema de Pagos</p>
                <p className="text-sm mt-1">Crea cobros masivos y automáticos para tus socios</p>
              </div>
            </div>
          )}

          {['events', 'documents', 'reports', 'settings'].includes(activeTab) && (
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
