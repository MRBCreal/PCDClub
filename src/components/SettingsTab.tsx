import React, { useState } from 'react';
import { Club, ClubSettings, PaymentMethod } from '@/types';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { updateClub } from '@/lib/firestore';
import toast from 'react-hot-toast';

interface SettingsTabProps {
  club: Club;
  onUpdate: () => void;
}

export default function SettingsTab({ club, onUpdate }: SettingsTabProps) {
  const [form, setForm] = useState<Partial<Club>>({
    name: club.name,
    description: club.description,
    address: club.address ?? '',
    city: club.city ?? '',
    region: club.region ?? '',
    phone: club.phone ?? '',
    email: club.email,
    website: club.website ?? '',
    settings: {
      ...club.settings
    }
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSettingsChange = (field: keyof ClubSettings, value: any) => {
    setForm({
      ...form,
      settings: {
        ...form.settings!,
        [field]: value
      }
    });
  };

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    const currentMethods = form.settings?.paymentMethods || [];
    const updatedMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    
    handleSettingsChange('paymentMethods', updatedMethods);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClub(club.id, form);
      toast.success('Configuración guardada correctamente');
      onUpdate();
    } catch (error: any) {
      toast.error(`Error al guardar: ${error.message}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" /> 
          Configuración del Club
        </h3>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Información General
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Club *</label>
              <input 
                name="name"
                className="input-field" 
                value={form.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea 
                name="description"
                className="input-field" 
                rows={3} 
                value={form.description} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto *</label>
              <input 
                name="email"
                type="email" 
                className="input-field" 
                value={form.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                name="phone"
                className="input-field" 
                value={form.phone} 
                onChange={handleChange} 
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input 
                name="address"
                className="input-field" 
                value={form.address} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input 
                name="city"
                className="input-field" 
                value={form.city} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región/Estado</label>
              <input 
                name="region"
                className="input-field" 
                value={form.region} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Configuración de Pagos y Finanzas
          </h4>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda Principal</label>
                <select 
                  className="input-field"
                  value={form.settings?.currency}
                  onChange={(e) => handleSettingsChange('currency', e.target.value)}
                >
                  <option value="CLP">Peso Chileno (CLP)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Días de gracia tras vencimiento</label>
                <input 
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.settings?.gracePeriodDays}
                  onChange={(e) => handleSettingsChange('gracePeriodDays', Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Métodos de Pago Aceptados</label>
              <div className="flex flex-wrap gap-3">
                {['transfer', 'cash', 'card', 'webpay', 'mercadopago', 'flow'].map(method => {
                  const isSelected = form.settings?.paymentMethods?.includes(method as PaymentMethod);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handlePaymentMethodToggle(method as PaymentMethod)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' 
                          : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {method === 'transfer' ? 'Transferencia' : 
                       method === 'cash' ? 'Efectivo' :
                       method === 'card' ? 'Tarjeta' :
                       method === 'webpay' ? 'WebPay' :
                       method === 'mercadopago' ? 'MercadoPago' : 'Flow'}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.settings?.autoReminders}
                  onChange={(e) => handleSettingsChange('autoReminders', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600" 
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">Recordatorios automáticos</span>
                  <span className="block text-xs text-gray-500">Enviar emails automáticos a socios con pagos próximos o vencidos</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-2">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary px-8 py-3 flex items-center gap-2 text-base shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
