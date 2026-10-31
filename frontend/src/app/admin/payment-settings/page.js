'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '../../../components/layout/AdminSidebar';
import Toast from '../../../components/ui/Toast';
import LoadingState from '../../../components/ui/LoadingState';
import apiClient, { getFileUrl } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';

export default function AdminPaymentSettingsPage() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const [formData, setFormData] = useState({
    upiId: '',
    payeeName: '',
    paymentInstructions: '',
  });
  const [existingQrUrl, setExistingQrUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/admin/payment-settings?_t=${Date.now()}`);
      if (res.data?.data?.paymentSetting) {
        const s = res.data.data.paymentSetting;
        setFormData({
          upiId: s.upiId || '',
          payeeName: s.payeeName || '',
          paymentInstructions: s.paymentInstructions || '',
        });
        setExistingQrUrl(s.qrCodeUrl || '');
      }
    } catch (err) {
      console.error('[AdminPaymentSettings] Fetch error:', err);
      setToast({ visible: true, message: 'Failed to load payment settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchSettings();
  }, [admin]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setQrFile(null);
      setQrPreview('');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ visible: true, message: 'Please select a valid image (PNG, JPEG, WEBP).', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ visible: true, message: 'QR Code image must be under 5MB in size.', type: 'error' });
      return;
    }

    setQrFile(file);
    const objectUrl = URL.createObjectURL(file);
    setQrPreview(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.upiId.trim()) {
      setToast({ visible: true, message: 'UPI ID is required for receiving payments.', type: 'error' });
      return;
    }

    if (!formData.payeeName.trim()) {
      setToast({ visible: true, message: 'Payee display name is required.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append('upiId', formData.upiId.trim());
      data.append('payeeName', formData.payeeName.trim());
      data.append('paymentInstructions', formData.paymentInstructions.trim());
      if (qrFile) {
        data.append('qrCode', qrFile);
      }

      const res = await apiClient.post('/admin/payment-settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        const updated = res.data.data.paymentSetting;
        setExistingQrUrl(updated.qrCodeUrl || '');
        setQrFile(null);
        setQrPreview('');
        setToast({ visible: true, message: 'Payment settings saved successfully!', type: 'success' });
        // Refresh admin settings from the server to guarantee fresh state
        await fetchSettings();
      }
    } catch (err) {
      console.error('[AdminPaymentSettings] Save error:', err);
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to save payment settings.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <Link href="/admin/login" className="px-5 py-2.5 bg-sky-500 text-obsidian-950 font-bold rounded-xl text-sm">
          Admin Login Required
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col md:flex-row text-slate-200">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400 text-[24px]">qr_code_2</span>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Payment Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure your manual UPI payment details and PhonePe/UPI QR code shown to students when purchasing premium resources.
            </p>
          </div>

          {loading ? (
            <LoadingState message="Loading payment configuration..." />
          ) : (
            <form onSubmit={handleSubmit} className="bg-obsidian-900 border border-white/[0.06] rounded-2xl p-4 sm:p-8 shadow-2xl space-y-6">
              
              {/* UPI ID & Payee Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    UPI ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. username@ybl or mobile@upi"
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Your real UPI ID for receiving payments.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Payee Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    placeholder="e.g. NotesofAni / Aniruddha"
                    className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Name displayed under the QR code in the purchase modal.</p>
                </div>
              </div>

              {/* QR Code Upload & Preview */}
              <div className="bg-obsidian-950/60 border border-white/10 rounded-xl p-5 space-y-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  PhonePe / UPI QR Code Image
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current or Preview Image */}
                  <div className="w-36 h-36 rounded-xl border border-white/10 bg-obsidian-900 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {qrPreview ? (
                      <img src={qrPreview} alt="QR Preview" className="w-full h-full object-contain p-2" />
                    ) : existingQrUrl ? (
                      <img
                        key={existingQrUrl}
                        src={getFileUrl(existingQrUrl)}
                        alt="Configured QR Code"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <span className="material-symbols-outlined text-[36px] text-slate-400 block mb-1">qr_code_scanner</span>
                        <span className="text-[11px]">No QR code</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <input
                      type="file"
                      id="qrUpload"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="qrUpload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      {existingQrUrl || qrPreview ? 'Replace QR Code Image' : 'Upload QR Code Image'}
                    </label>

                    <p className="text-xs text-slate-400">
                      Upload your official PhonePe, GPay, Paytm, or BHIM QR code image (PNG, JPEG, WEBP up to 5MB).
                    </p>
                    {existingQrUrl && (
                      <p className="text-[11px] text-emerald-400 font-mono">
                        ✓ QR Code image currently active
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Payment Instructions for Students
                </label>
                <textarea
                  rows={4}
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  placeholder="Enter step-by-step payment instructions for buyers..."
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                ></textarea>
                <p className="text-[11px] text-slate-400 mt-1">
                  Shown in the Buy Now modal guiding buyers to scan, pay, and submit their transaction reference number.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  {saving ? 'Saving Settings...' : 'Save Payment Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
