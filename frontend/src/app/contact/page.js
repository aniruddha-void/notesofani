'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../context/AuthContext';

export default function ContactPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [status, setStatus] = useState('idle'); 
  const [errors, setErrors] = useState({});
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) errs.message = 'Message is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

   
    if (!user) {
      setSignInModalOpen(true);
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setApiErrorMessage('');
    setStatus('sending');

    try {
      const res = await apiClient.post('/contact', formData);
      const isEmailSent = res.data?.emailSent !== false;
      const isSuccess = res.data?.status === 'success';
      const isWarning = res.data?.status === 'warning' || res.data?.emailSent === false;

      if (isSuccess && isEmailSent) {
        setStatus('success');
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          subject: 'General Inquiry',
          message: '',
        });
        setToast({
          visible: true,
          message: res.data?.message || 'Your message has been sent successfully.',
          type: 'success',
        });
      } else if (isWarning) {
        setStatus('partial_success');
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          subject: 'General Inquiry',
          message: '',
        });
        setToast({
          visible: true,
          message: res.data?.message || 'Your message was saved, but the email notification could not be sent.',
          type: 'warning',
        });
      } else {
        const errMsg = res.data?.message || 'Unable to send your message. Please try again.';
        setStatus('error');
        setApiErrorMessage(errMsg);
        setToast({ visible: true, message: errMsg, type: 'error' });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setSignInModalOpen(true);
        setStatus('idle');
        return;
      }
      const errMsg = err.response?.data?.message || 'Unable to send your message. Please try again.';
      setStatus('error');
      setApiErrorMessage(errMsg);
      setToast({ visible: true, message: errMsg, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface font-body-md text-body-md text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-space-xl">
          <div className="flex flex-col w-full">
           
            <div className="relative w-full overflow-hidden">
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary/5 blur-[120px] pointer-events-none rounded-full"></div>

             
              <section className="relative pt-4 pb-12 sm:pb-16 max-w-4xl mx-auto flex flex-col items-start gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-tag text-label-tag tracking-wider uppercase font-medium">GET IN TOUCH</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">
                    Let’s talk.
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                    Have a question, found an issue, or want to get in touch? Send us a message.
                  </p>
                </div>
              </section>

              
              <section className="max-w-4xl mx-auto pb-16 sm:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 
                  <aside className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-surface-container rounded-xl p-6 shadow-sm flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-label-code text-label-code uppercase tracking-wider text-outline">Official Channel</span>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface">Direct Inquiry</h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          Official contact channel for research notes, queries, site issues, or general remarks.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 pt-2">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">schedule</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          We’ll get back to you as soon as possible.
                        </p>
                      </div>
                    </div>
                  </aside>

                 
                  <main className="lg:col-span-8">
                    <div className="bg-surface-container rounded-xl p-7 sm:p-9 shadow-sm relative overflow-hidden">
                      {status === 'idle' && (
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                           
                            <div className="flex flex-col gap-1.5">
                              <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor="form-name">
                                Name <span className="text-primary">*</span>
                              </label>
                              <input
                                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                id="form-name"
                                placeholder="Your Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                              {errors.name && (
                                <span className="font-label-caption text-label-caption text-error flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">error</span>
                                  {errors.name}
                                </span>
                              )}
                            </div>

                            
                            <div className="flex flex-col gap-1.5">
                              <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor="form-email">
                                Email <span className="text-primary">*</span>
                              </label>
                              <input
                                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                id="form-email"
                                placeholder="you@example.com"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              />
                              {errors.email && (
                                <span className="font-label-caption text-label-caption text-error flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">error</span>
                                  {errors.email}
                                </span>
                              )}
                            </div>
                          </div>

                          
                          <div className="flex flex-col gap-1.5">
                            <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor="form-subject">
                              Subject <span className="text-outline font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                              <select
                                className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary transition-all pr-10 cursor-pointer"
                                id="form-subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                              >
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Resource Suggestion">Resource Suggestion</option>
                                <option value="Report an Issue">Report an Issue</option>
                                <option value="Other">Other</option>
                              </select>
                              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                                expand_more
                              </span>
                            </div>
                          </div>

                        
                          <div className="flex flex-col gap-1.5">
                            <label className="font-body-sm text-body-sm text-on-surface font-medium" htmlFor="form-message">
                              Message <span className="text-primary">*</span>
                            </label>
                            <textarea
                              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                              id="form-message"
                              placeholder="Write your message here..."
                              rows={5}
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                            {errors.message && (
                              <span className="font-label-caption text-label-caption text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errors.message}
                              </span>
                            )}
                          </div>

                          
                          <div className="pt-2 flex items-center justify-between">
                            <button
                              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-body-md text-body-md font-semibold hover:bg-primary transition-all shadow-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              type="submit"
                              disabled={status === 'sending'}
                            >
                              <span>{status === 'sending' ? 'Sending...' : 'Send Message'}</span>
                              <span className="material-symbols-outlined text-[18px]">
                                {status === 'sending' ? 'hourglass_empty' : 'arrow_forward'}
                              </span>
                            </button>
                          </div>
                        </form>
                      )}

                      
                      {status === 'sending' && (
                        <div className="min-h-[380px] flex flex-col items-center justify-center gap-4 text-center">
                          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          <div className="flex flex-col gap-1">
                            <span className="font-headline-sm text-headline-sm text-on-surface font-medium">Sending message...</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Establishing connection with desk records</span>
                          </div>
                        </div>
                      )}

                      
                      {status === 'success' && (
                        <div className="min-h-[380px] flex flex-col items-center justify-center gap-5 text-center px-4">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[32px]">check_circle</span>
                          </div>
                          <div className="flex flex-col gap-2 max-w-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Message sent.</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                              Your message has been sent successfully.
                            </p>
                          </div>
                          <div className="pt-2 flex items-center gap-4">
                            <button
                              onClick={() => setStatus('idle')}
                              className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md hover:bg-surface-bright transition-all"
                            >
                              Send another message
                            </button>
                          </div>
                        </div>
                      )}

                    
                      {status === 'partial_success' && (
                        <div className="min-h-[380px] flex flex-col items-center justify-center gap-5 text-center px-4">
                          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <span className="material-symbols-outlined text-[32px]">mark_email_unread</span>
                          </div>
                          <div className="flex flex-col gap-2 max-w-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Message saved.</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                              Your message was saved, but the email notification could not be sent.
                            </p>
                          </div>
                          <div className="pt-2 flex items-center gap-4">
                            <button
                              onClick={() => setStatus('idle')}
                              className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md hover:bg-surface-bright transition-all"
                            >
                              Send another message
                            </button>
                          </div>
                        </div>
                      )}

                      
                      {status === 'error' && (
                        <div className="min-h-[380px] flex flex-col items-center justify-center gap-5 text-center px-4">
                          <div className="w-14 h-14 rounded-full bg-error-container/30 flex items-center justify-center text-error">
                            <span className="material-symbols-outlined text-[32px]">warning</span>
                          </div>
                          <div className="flex flex-col gap-2 max-w-md">
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Something went wrong.</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                              {apiErrorMessage || 'Unable to send your message. Please try again.'}
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              onClick={() => setStatus('idle')}
                              className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-body-md text-body-md font-semibold hover:bg-primary transition-all"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </main>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      
      <Modal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        title="Sign in required"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Please sign in to your NotesofAni account before sending a message.
          </p>
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSignInModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

