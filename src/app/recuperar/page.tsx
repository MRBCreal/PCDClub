'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Email de recuperación enviado');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/user-not-found') {
        toast.error('No existe una cuenta con ese email');
      } else if (code === 'auth/invalid-email') {
        toast.error('Email inválido');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Demasiados intentos. Intenta más tarde.');
      } else {
        toast.error('Error al enviar el email de recuperación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">PCD<span className="text-primary-600">Club</span></span>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado</h2>
              <p className="text-sm text-gray-500 mb-6">
                Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <Link href="/login" className="btn-primary inline-flex">
                Volver al Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Recuperar contraseña</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-11"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}
