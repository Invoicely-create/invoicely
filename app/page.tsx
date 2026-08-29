'use client';

import React, { useState, ChangeEvent } from 'react';
import { CreditCard, Plus, Trash2, Download, Image as ImageIcon } from 'lucide-react';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

interface Item {
  description: string;
  quantity: number;
  price: number;
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currency, setCurrency] = useState('$');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([
    { description: 'Servicio de consultoría', quantity: 1, price: 50 },
  ]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Manejo de logo
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Cálculos financieros
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const discountAmount = (subtotal * (discountRate || 0)) / 100;
  const taxableTotal = subtotal - discountAmount;
  const taxAmount = (taxableTotal * (taxRate || 0)) / 100;
  const grandTotal = taxableTotal + taxAmount;

  const handleSubscribe = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error iniciando la pasarela de pago');
      }
    } catch (err) {
      alert('Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12">
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, .no-print {
            display: none !important;
          }
          main {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          input, select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            appearance: none;
          }
        }
      `}</style>

      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 border-b pb-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoicely</h1>
          <p className="text-sm text-slate-500">Generador de facturas profesional</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loadingCheckout}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
          >
            <CreditCard className="w-4 h-4" />
            {loadingCheckout ? 'Cargando...' : 'Obtener Plan Pro ($4.99/mo)'}
          </button>

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                Iniciar Sesión
              </button>
            </SignInButton>
          )}

          {isLoaded && isSignedIn && (
            <UserButton afterSignOutUrl="/" />
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-6 md:p-8">
        <div id="invoice-preview" className="p-4 bg-white text-slate-800">
          
          {/* Encabezado de la factura */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
            <div>
              {logoUrl ? (
                <div className="relative group">
                  <img src={logoUrl} alt="Logo Empresa" className="h-16 object-contain mb-2" />
                  <label className="text-xs text-indigo-600 cursor-pointer no-print hover:underline block">
                    Cambiar logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-slate-300 p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition no-print">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">Subir Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
              <h2 className="text-2xl font-bold text-indigo-600 mt-2">INVOICELY</h2>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-slate-500">Fecha: {new Date().toLocaleDateString()}</p>
              <div className="flex items-center gap-2 no-print">
                <span className="text-xs text-slate-500">Moneda:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border rounded px-2 py-1 text-xs bg-slate-50"
                >
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Lista de conceptos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Conceptos / Artículos</h3>
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 mb-3 items-center">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-20 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Precio"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                  className="w-28 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 p-2 no-print"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline mt-2 no-print"
            >
              <Plus className="w-4 h-4" /> Agregar línea
            </button>
          </div>

          {/* Desglose de totales */}
          <div className="border-t pt-4 flex flex-col items-end">
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal:</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Descuento (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-16 border rounded px-1 text-right text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Impuesto / IVU (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 border rounded px-1 text-right text-xs"
                />
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-2 mt-2">
                <span>Total Final:</span>
                <span className="text-xl text-indigo-600">{currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end no-print">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Guardar como PDF
          </button>
        </div>
      </main>
    </div>
  );
}