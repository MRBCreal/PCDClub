'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CreditCard,
  Users,
  BarChart3,
  Bell,
  Shield,
  Calendar,
  FileText,
  Smartphone,
  ChevronRight,
  Check,
  Menu,
  X,
  Zap,
  Globe,
  Clock,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: CreditCard,
    title: 'Cobros Automáticos',
    description: 'Automatiza la cobranza de cuotas con recordatorios por email y WhatsApp. Reduce la morosidad desde el primer mes.',
  },
  {
    icon: Users,
    title: 'Gestión de Socios',
    description: 'Administra miembros, categorías, datos de contacto y apoderados en un solo lugar centralizado.',
  },
  {
    icon: BarChart3,
    title: 'Reportes en Tiempo Real',
    description: 'Dashboard analítico con KPIs, ingresos, morosidad y proyección de caja actualizados al instante.',
  },
  {
    icon: Bell,
    title: 'Notificaciones Multicanal',
    description: 'Envía avisos de pago, eventos y comunicados por email, SMS y WhatsApp automáticamente.',
  },
  {
    icon: Calendar,
    title: 'Reserva de Espacios',
    description: 'Agenda canchas, salas y clases con sistema de reservas online y confirmación automática.',
  },
  {
    icon: FileText,
    title: 'Documentos y Boletas',
    description: 'Genera boletas, certificados y documentación oficial del club de forma automatizada.',
  },
];

const plans = [
  {
    name: 'Starter',
    price: '19.990',
    period: '/mes',
    description: 'Ideal para clubes pequeños',
    members: 'Hasta 50 socios',
    features: [
      'Portal de pagos personalizado',
      'Gestión de socios',
      'Cobros automáticos',
      'Reportes básicos',
      'Soporte por email',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '39.990',
    period: '/mes',
    description: 'Para clubes en crecimiento',
    members: 'Hasta 200 socios',
    features: [
      'Todo lo de Starter',
      'Notificaciones WhatsApp',
      'Reserva de espacios',
      'Control de asistencia',
      'Reportes avanzados',
      'Boletas electrónicas',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '69.990',
    period: '/mes',
    description: 'Para organizaciones grandes',
    members: 'Socios ilimitados',
    features: [
      'Todo lo de Professional',
      'Multi-sede',
      'API personalizada',
      'Integraciones avanzadas',
      'Manager dedicado',
      'SLA garantizado',
      'Personalización completa',
    ],
    highlighted: false,
  },
];

const testimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Presidente, Club Deportivo Los Halcones',
    content: 'PCDClub transformó la gestión de nuestro club. Pasamos de perseguir pagos manualmente a tener todo automatizado. La morosidad bajó un 60% en el primer trimestre.',
    avatar: 'CM',
  },
  {
    name: 'María José Soto',
    role: 'Tesorera, Academia de Fútbol Estrella',
    content: 'La plataforma es súper intuitiva. Los apoderados pagan con un clic y nosotros tenemos visibilidad total de los ingresos. Excelente soporte técnico.',
    avatar: 'MS',
  },
  {
    name: 'Roberto Fuentes',
    role: 'Director, Club Social y Deportivo Unión',
    content: 'Llevábamos años con planillas Excel. Con PCDClub todo está centralizado, los socios están al día y podemos enfocarnos en lo que importa: el deporte.',
    avatar: 'RF',
  },
];

const stats = [
  { value: '500+', label: 'Clubes activos' },
  { value: '$2.5B', label: 'Recaudados (CLP)' },
  { value: '98%', label: 'Satisfacción' },
  { value: '45%', label: 'Menos morosidad' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PCD<span className="text-primary-600">Club</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Planes</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Testimonios</a>
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Iniciar Sesión</Link>
              <Link href="/registro" className="btn-primary text-sm !py-2 !px-4">
                Comenzar Gratis
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-gray-600 py-2">Funcionalidades</a>
            <a href="#pricing" className="block text-sm font-medium text-gray-600 py-2">Planes</a>
            <a href="#testimonials" className="block text-sm font-medium text-gray-600 py-2">Testimonios</a>
            <Link href="/login" className="block text-sm font-medium text-gray-700 py-2">Iniciar Sesión</Link>
            <Link href="/registro" className="btn-primary w-full text-center text-sm">Comenzar Gratis</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Plataforma #1 para clubes en Chile</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              Gestiona tu club.{' '}
              <span className="gradient-text">Cobra sin esfuerzo.</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Automatiza cobros, gestiona socios y ofrece un portal de pagos profesional.
              Todo lo que necesitas para administrar tu club deportivo en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/registro" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                Comenzar Gratis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#features" className="btn-outline text-base px-8 py-4 w-full sm:w-auto">
                Ver Funcionalidades
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="card p-2 shadow-2xl shadow-gray-200/50">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-gray-400 text-xs ml-3">dashboard.pcdclub.cl</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Socios Activos', value: '342', change: '+12%', color: 'from-blue-500 to-blue-600' },
                    { label: 'Recaudado Mes', value: '$4.2M', change: '+8%', color: 'from-green-500 to-green-600' },
                    { label: 'Tasa Cobro', value: '94%', change: '+5%', color: 'from-purple-500 to-purple-600' },
                    { label: 'Pendientes', value: '18', change: '-23%', color: 'from-orange-500 to-orange-600' },
                  ].map((item) => (
                    <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-lg p-4 text-white`}>
                      <div className="text-xs opacity-80">{item.label}</div>
                      <div className="text-2xl font-bold mt-1">{item.value}</div>
                      <div className="text-xs mt-1 opacity-80">{item.change} este mes</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-400 mb-3">Ingresos Mensuales</div>
                    <div className="flex items-end gap-1 h-24">
                      {[40, 55, 45, 60, 70, 65, 80, 75, 90, 85, 95, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-sm text-gray-400 mb-3">Últimos Pagos</div>
                    <div className="space-y-2">
                      {['Juan P.', 'María S.', 'Carlos R.', 'Ana M.'].map((name) => (
                        <div key={name} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{name}</span>
                          <span className="text-green-400 font-medium">Pagado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-4">
              <Globe className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Funcionalidades</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para{' '}
              <span className="gradient-text">gestionar tu club</span>
            </h2>
            <p className="text-lg text-gray-600">
              Herramientas profesionales diseñadas para clubes deportivos, academias y organizaciones sociales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comienza en <span className="gradient-text">3 simples pasos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Crea tu Club', desc: 'Regístrate y configura tu club en minutos. Personaliza tu portal de pagos con tu logo y colores.', icon: Shield },
              { step: '02', title: 'Agrega Socios', desc: 'Importa o registra a tus miembros. Define categorías, cuotas y métodos de pago aceptados.', icon: Users },
              { step: '03', title: 'Cobra Automático', desc: 'Activa la cobranza automática y deja que el sistema se encargue. Recibe reportes y notificaciones.', icon: TrendingUp },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-sm font-bold text-primary-600 mb-2">Paso {item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes que se adaptan a <span className="gradient-text">tu club</span>
            </h2>
            <p className="text-lg text-gray-600">Sin contratos. Cancela cuando quieras. Precios en CLP + IVA.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 relative ${plan.highlighted ? 'border-2 border-primary-500 shadow-xl shadow-primary-100' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Más Popular
                  </div>
                )}
                <div className="text-sm font-semibold text-primary-600 mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{plan.description}</p>
                <p className="text-sm font-medium text-gray-700 mb-6">{plan.members}</p>
                <Link
                  href="/registro"
                  className={`w-full text-center block ${plan.highlighted ? 'btn-primary' : 'btn-outline'} mb-6`}
                >
                  Comenzar Ahora
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen <span className="gradient-text">nuestros clubes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Moderniza la gestión de tu club hoy
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Únete a más de 500 clubes que ya automatizaron sus cobros y redujeron la morosidad.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-700 bg-white rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg">
              Crear mi Club Gratis
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="mailto:contacto@pcdclub.cl" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-200">
              Contactar Ventas
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">PCDClub</span>
              </div>
              <p className="text-sm leading-relaxed">
                Plataforma integral para la gestión y cobros de clubes deportivos en Chile y Latinoamérica.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trabaja con nosotros</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Términos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} PCDClub. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors"><Smartphone className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
