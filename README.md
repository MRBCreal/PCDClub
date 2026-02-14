# PCDClub - Plataforma de Gestión y Pagos para Clubes

Plataforma integral para la gestión de membresías, cobros automáticos y administración de clubes deportivos, academias y organizaciones sociales.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Storage, App Hosting)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: react-hot-toast

## Firebase Services

| Service | Purpose |
|---------|---------|
| **Authentication** | Login con email/password y Google OAuth |
| **Firestore** | Base de datos principal (clubes, miembros, pagos) |
| **Storage** | Logos, fotos de perfil, documentos del club |
| **App Hosting** | Deploy de la app Next.js |
| **Analytics** | Métricas de uso |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── login/             # Autenticación
│   ├── registro/          # Registro de usuarios
│   └── dashboard/         # Panel de administración
│       └── crear-club/    # Crear nuevo club
├── contexts/
│   └── AuthContext.tsx     # Contexto de autenticación Firebase
├── lib/
│   ├── firebase.ts        # Firebase Client SDK config
│   ├── firebase-admin.ts  # Firebase Admin SDK (server-side)
│   └── firestore.ts       # Operaciones CRUD Firestore
└── types/
    └── index.ts           # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project configured
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pcdproyecto-rgb/PCDClub.git
cd PCDClub

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
npm run dev
```

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password + Google)
3. Create a **Firestore** database
4. Enable **Storage**
5. Copy your config to `.env.local`

### Deploy to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy
```

## Features

- **Cobros Automáticos**: Recordatorios por email y WhatsApp
- **Portal de Pagos**: Portal personalizado con marca del club
- **Gestión de Socios**: Miembros, categorías, apoderados
- **Reportes**: Dashboard con KPIs en tiempo real
- **Reserva de Espacios**: Canchas, salas y clases
- **Documentos**: Boletas, certificados y documentación

## Firestore Data Model

- `users/` - Usuarios registrados
- `clubs/` - Clubes creados
  - `clubs/{id}/members/` - Miembros del club
  - `clubs/{id}/payments/` - Pagos y cobros
  - `clubs/{id}/invoices/` - Boletas/facturas
  - `clubs/{id}/events/` - Eventos
  - `clubs/{id}/attendance/` - Asistencia
  - `clubs/{id}/documents/` - Documentos
- `transactions/` - Transacciones de pago (server-side)
- `notifications/` - Notificaciones de usuarios

## License

MIT
