'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient, { getFileUrl } from '../../lib/api-client';

export default function BuyNowModal({ isOpen, onClose, resource, user, onSuccess }) {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');

  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedTxId, setSubmittedTxId] = useState('');

  // Fetch payment configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmitError('');
      setTransactionId('');
      setPaymentNote('');
      setCopied(false);

      async function fetchConfig() {
        try {
          setLoadingConfig(true);
          setConfigError('');
          const res = await apiClient.get(`/payment/config?_t=${Date.now()}`);
          const configData = res.data?.data?.config || res.data?.data;
          if (configData && typeof configData === 'object') {
            setConfig(configData);
          } else {
            setConfig(null);
          }
        } catch (err) {
          console.error('[BuyNowModal] Fetch config error:', err);
          setConfigError('Unable to load payment configuration. Please try again.');
        } finally {
          setLoadingConfig(false);
        }
      }

      fetchConfig();
    }
  }, [isOpen]);

  if (!isOpen || !resource) return null;

  const handleCopyUPI = async () => {
    if (!config?.upiId) return;
    try {
      await navigator.clipboard.writeText(config.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setSubmitError('Please enter your UPI transaction / reference ID.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const res = await apiClient.post('/purchases', {
        resourceId: resource._id,
        transactionId: transactionId.trim(),
        paymentNote: paymentNote.trim(),
      });

      if (res.data?.status === 'success') {
        setIsSuccess(true);
        setSubmittedTxId(transactionId.trim());
        if (onSuccess) {
          onSuccess(res.data.data.purchase);
        }
      }
    } catch (err) {
      console.error('[BuyNowModal] Purchase submit error:', err);
      setSubmitError(
        err.response?.data?.message ||
          'Failed to submit purchase request. Please verify the transaction ID and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isConfigured = Boolean(
    config && (config.isConfigured || config.upiId?.trim() || config.qrCodeUrl?.trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-obsidian-900 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-8 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06]"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Buy Premium Resource</h3>
            <p className="text-xs text-slate-400">Manual PhonePe / UPI Payment Request</p>
          </div>
        </div>

        {/* Resource Info Banner */}
        <div className="bg-obsidian-950/80 border border-white/[0.06] rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-white text-sm truncate">{resource.title}</h4>
            <p className="text-xs text-slate-400">Lifetime access & download after approval</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block">Total Amount</span>
            <span className="text-lg font-extrabold text-amber-400">₹{resource.price}</span>
          </div>
        </div>

        {/* State 1: Success Confirmation */}
        {isSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[34px]">check_circle</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Request Submitted Successfully</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your purchase request with reference{' '}
                <span className="font-mono text-amber-400 font-bold">{submittedTxId}</span> has been
                received.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-left text-xs text-amber-300/90 space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  The administrator will verify your payment in their bank/PhonePe account and approve
                  access. You will receive an email once approved.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Link
                href="/profile"
                className="flex-1 py-2.5 px-4 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-xs font-semibold text-center transition-all"
              >
                View in My Purchases
              </Link>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-obsidian-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
              >
                Close
              </button>
            </div>
          </div>
        ) : loadingConfig ? (
          /* State 2: Loading Payment Config */
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="inline-block w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin mb-3"></div>
            <p>Loading payment details...</p>
          </div>
        ) : !isConfigured ? (
          /* State 3: Payment Settings Not Configured */
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">construction</span>
            </div>
            <h4 className="text-base font-bold text-white">Payment Setup in Progress</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Payment settings are currently being updated by the administrator. Please check back
              shortly or contact support to purchase this resource.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          /* State 4: Active Payment Flow */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step Guide */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Payment Instructions
            </div>

            {/* QR Code and UPI ID Box */}
            <div className="p-4 rounded-xl bg-obsidian-950/70 border border-white/[0.06] flex flex-col sm:flex-row items-center gap-4">
              {config.qrCodeUrl && (
                <div className="p-2 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
                  <img
                    key={config.qrCodeUrl}
                    src={getFileUrl(config.qrCodeUrl)}
                    alt="PhonePe UPI QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              )}

              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                {config.payeeName && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Payee Name
                    </span>
                    <span className="text-sm font-bold text-white">{config.payeeName}</span>
                  </div>
                )}

                {config.upiId && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      UPI ID
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-mono font-bold text-sky-400 bg-obsidian-900 px-2 py-1 rounded border border-white/10 break-all">
                        {config.upiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/10 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                        title="Copy UPI ID"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {copied ? 'check' : 'content_copy'}
                        </span>
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {config.paymentInstructions && (
                  <p className="text-[11px] text-slate-300 leading-snug pt-1">
                    {config.paymentInstructions}
                  </p>
                )}
              </div>
            </div>

            {/* Steps List */}
            <ol className="text-xs text-slate-300 space-y-1.5 pl-4 list-decimal marker:text-sky-400">
              <li>Scan the QR code or pay to the UPI ID using PhonePe / Google Pay / Paytm.</li>
              <li>Pay exact amount: <strong className="text-amber-400 font-bold">₹{resource.price}</strong>.</li>
              <li>Copy the 12-digit UPI Reference Number / Transaction UTR from your payment app.</li>
              <li>Paste the Transaction ID below and submit for manual verification.</li>
            </ol>

            {/* Form Inputs */}
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  UPI Transaction ID / UTR Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 429381749281 or UPI Reference ID"
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Note / Sender Name <span className="text-slate-500 text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Paid via PhonePe from John Doe"
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * Note: Submitting this form sends a purchase request to the administrator. Payment will
                be manually verified in our bank account before access is granted.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                {submitting ? 'Submitting Request...' : `Submit Payment Request (₹${resource.price})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
