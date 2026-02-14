import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'PCDClub - Gestión y Pagos para Clubes Deportivos',
  description: 'Plataforma integral para la gestión de membresías, cobros automáticos y administración de clubes deportivos. Externaliza tus pagos y ofrece servicios web de alta calidad.',
  keywords: 'club deportivo, pagos online, gestión club, membresías, cobranza automática, chile',
  openGraph: {
    title: 'PCDClub - Gestión y Pagos para Clubes Deportivos',
    description: 'Plataforma integral para la gestión de membresías, cobros automáticos y administración de clubes deportivos.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
