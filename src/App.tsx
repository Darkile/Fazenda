/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, writeBatch, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { Instagram } from 'lucide-react';

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [confirmCount, setConfirmCount] = useState(0);
  const [quickConfirmed, setQuickConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'public_stats', 'rsvps'), (docSnap) => {
      if (docSnap.exists()) {
        setConfirmCount(docSnap.data().count || 0);
      } else {
        setConfirmCount(0);
      }
    }, (error) => {
      console.error("Error fetching RSVP count:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleQuickConfirm = async () => {
    if (quickConfirmed) return;
    setQuickConfirmed(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
    try {
      const batch = writeBatch(db);
      
      const rsvpRef = doc(collection(db, 'rsvps'));
      batch.set(rsvpRef, {
        name: 'Confirmação Rápida',
        phone: 'N/A',
        createdAt: serverTimestamp()
      });
      
      const statsRef = doc(db, 'public_stats', 'rsvps');
      batch.set(statsRef, { count: increment(1) }, { merge: true });
      
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      
      const rsvpRef = doc(collection(db, 'rsvps'));
      batch.set(rsvpRef, {
        name: formData.name,
        phone: formData.phone,
        createdAt: serverTimestamp()
      });
      
      const statsRef = doc(db, 'public_stats', 'rsvps');
      batch.set(statsRef, { count: increment(1) }, { merge: true });
      
      await batch.commit();
      
      setSubmitted(true);

      // Redirecionar para o WhatsApp
      const message = `Olá! Gostaria de confirmar minha presença. Nome: ${formData.name}, Telefone: ${formData.phone}`;
      const whatsappUrl = `https://wa.me/5515998018939?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rsvps');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen">
      {/* Top Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-[#faf9f5]/80 dark:bg-[#061b0e]/80 backdrop-blur-xl flex justify-between items-center px-8 py-6 max-w-none">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#061b0e] dark:text-[#faf9f5]">menu</span>
          <span className="text-2xl font-headline uppercase tracking-widest text-[#061b0e] dark:text-[#faf9f5]">Hotel Recanto do Interior</span>
        </div>
        <button 
          onClick={handleQuickConfirm}
          disabled={quickConfirmed}
          className="font-body text-sm md:text-lg uppercase tracking-widest text-[#735c00] font-bold text-right disabled:opacity-70"
        >
          {quickConfirmed ? 'Confirmado' : 'Confirmar Presença'}
        </button>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[795px] flex flex-col justify-end px-8 pb-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img alt="Hotel Entrance" className="w-full h-full object-cover grayscale-[20%]" src="https://lh3.googleusercontent.com/aida/ADBb0ujU2dOw4AqyYtRmqT788tW_ABgzBI4BeoOzWsOtXPZPEFdKPNXsFAFXn3PoG_J0peKpt16fkhxzYgIpyltwh6L_egeP89DiRFPgnCU5GXGjpAbe9iLpF2jkrtxtpsuejk7ox-2qG0jvgufUHxdteaUa_6nuUQ0INw_nST-WC9Y1lGeB7kXqwzcZJo63JWVtjx6bvhYr5h4RUYuLiA6yE8kyaSpJPi9UP6ZvcnQBAwX4481e1N88OWk6CuY7t8gXuuohciq3V26Erdc"/>
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"></div>
          </div>
          <div className="relative z-10 space-y-4">
            <span className="font-label text-secondary-fixed-dim tracking-[0.3em] uppercase text-sm">REABERTURA</span>
            <h1 className="font-headline text-5xl md:text-7xl text-surface-bright leading-none tracking-tight">
              Hotel Recanto <br/> do Interior
            </h1>
            <p className="text-surface-variant font-light max-w-xs text-lg italic">
              Onde o luxo encontra a serenidade da floresta.
            </p>
            <div className="pt-4 flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-fixed"></span>
              </span>
              <p className="text-secondary-fixed font-bold text-sm tracking-widest uppercase">
                {confirmCount} pessoas já confirmaram
              </p>
            </div>
          </div>
        </section>

        {/* Invitation Text Section */}
        <section className="bg-surface py-24 px-8 space-y-12">
          <div className="space-y-6 max-w-xl mx-auto text-center">
            <h2 className="font-headline text-4xl text-primary leading-tight">
              Temos o prazer de convidar você para a nossa reabertura!
            </h2>
            <div className="w-12 h-[1px] bg-secondary mx-auto"></div>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Venha viver momentos únicos de descanso, tranquilidade e conexão com a natureza — o cenário perfeito para desacelerar e recarregar as energias.
            </p>
          </div>
        </section>

        {/* Event Bento Grid Details */}
        <section className="bg-surface-container-low py-20 px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {/* Date & Time Card */}
            <div className="bg-surface-container-lowest p-10 space-y-6 flex flex-col justify-center border-l-4 border-secondary">
              <span className="font-label text-secondary tracking-widest uppercase text-xs">QUANDO</span>
              <div>
                <p className="font-headline text-3xl text-primary">Sábado, 28/03/2026</p>
                <p className="font-headline text-2xl text-secondary">Às 14h00</p>
              </div>
            </div>

            {/* Featured Image - Asymmetric */}
            <div className="relative h-64 md:h-auto overflow-hidden rounded-sm">
              <img alt="Details" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMXKBTW8MsiqYdFdGPyKrx44XnGT37yTzM8w-IAoU9BOk1xpMkW8R6z_hB2tI5_LAaQ-IxKa_UumKubpAhDzEmx8i2bUBt-CM09WElFV5iyVDJ6uF_1-txSjJ6NwGwuG55G-NVj6Mee79o_tRKdBkxQdh2ZHU5XL4ga_8juA_A3tqzUopVWoD90AYCJAubPJ11iXNDiuQ_3Y5ioToYtMqtGdcNY3PeROtlxhBqfCeovLUUdQ1eBxXs_ghCS7heLr2wy9u2aV-UEgmJ"/>
            </div>

            {/* Amenities List */}
            <div className="bg-primary text-surface p-10 space-y-8 md:col-span-1">
              <h3 className="font-headline text-2xl text-secondary-fixed">Experiência Exclusiva</h3>
              <ul className="space-y-4 font-body tracking-wide">
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">music_note</span>
                  Palco Shows
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">pool</span>
                  Piscina Olímpica
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">restaurant</span>
                  Área Gourmet
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">spa</span>
                  Spa
                </li>
                <li className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">king_bed</span>
                  Conforto Premium
                </li>
              </ul>
            </div>

            {/* Call to Action Card */}
            <div className="bg-secondary-fixed text-on-secondary-fixed p-10 flex flex-col justify-center">
              <p className="font-headline text-2xl mb-8 italic">Garanta sua presença neste novo capítulo.</p>
              
              {showForm ? (
                submitted ? (
                  <div className="text-center py-4">
                    <span className="material-symbols-outlined text-5xl text-primary mb-4">check_circle</span>
                    <p className="font-headline text-xl text-primary">Presença Confirmada!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b border-primary/30 py-3 text-primary placeholder:text-primary/60 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Nome Completo"
                    />
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b border-primary/30 py-3 text-primary placeholder:text-primary/60 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Telefone / WhatsApp"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary text-on-primary py-4 rounded-sm font-bold tracking-widest uppercase text-xs mt-4 disabled:opacity-70"
                    >
                      {isSubmitting ? 'Enviando...' : 'Confirmar'}
                    </button>
                  </form>
                )
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex-1 bg-primary text-on-primary py-5 px-6 flex justify-between items-center rounded-sm font-bold tracking-widest uppercase text-xs hover:opacity-90 transition-opacity border border-primary"
                  >
                    Confirmar Presença
                    <span className="material-symbols-outlined">check_circle</span>
                  </button>
                  <a 
                    href="https://wa.me/5515998018939"
                    className="flex-1 bg-transparent text-primary py-5 px-6 flex justify-between items-center rounded-sm font-bold tracking-widest uppercase text-xs hover:bg-primary/5 transition-colors border border-primary/20"
                  >
                    Reservas e informações
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-surface py-24 px-8 overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2 space-y-6 order-2 md:order-1">
              <span className="font-label text-secondary tracking-widest uppercase text-xs">LOCALIZAÇÃO</span>
              <h2 className="font-headline text-3xl text-primary">Porto Feliz, São Paulo</h2>
              <p className="text-on-surface-variant leading-relaxed">
                Bairro Porungal, nº 68<br/>
                Porto Feliz – SP<br/>
                CEP: 18540-000
              </p>
              <div className="pt-4">
                <a 
                  className="text-primary font-bold flex items-center gap-2 border-b border-secondary w-fit pb-1 hover:opacity-80 transition-opacity" 
                  href="https://google.com/maps?q=-23.2548121,-47.483355&z=17&hl=pt-BR"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  VER NO MAPA
                </a>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative group">
                <div className="absolute -top-4 -left-4 w-full h-full bg-secondary-fixed-dim/20 z-0"></div>
                <a 
                  href="https://google.com/maps?q=-23.2548121,-47.483355&z=17&hl=pt-BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 w-full aspect-square block shadow-2xl overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <iframe 
                    src="https://maps.google.com/maps?q=-23.2548121,-47.483355&z=17&output=embed" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0, pointerEvents: 'none' }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa do Local"
                  ></iframe>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Feature */}
        <section className="py-24 bg-surface-container-low text-center px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/5 pointer-events-none"></div>
          <a 
            className="group relative flex flex-col items-center justify-center space-y-6 inline-block p-8 rounded-2xl hover:bg-surface transition-all duration-500 hover:shadow-xl border border-transparent hover:border-secondary/20 max-w-md mx-auto" 
            href="https://www.instagram.com/recan_todointerior/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-500">
              <div className="w-full h-full bg-surface-container-low group-hover:bg-surface rounded-full flex items-center justify-center transition-colors duration-500">
                <Instagram className="w-10 h-10 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-headline text-3xl text-primary group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#f09433] group-hover:to-[#bc1888] transition-all duration-500 italic">
                @recan_todointerior
              </p>
              <p className="font-label text-on-surface-variant tracking-[0.3em] text-xs uppercase font-bold">
                Siga nossa jornada no Instagram
              </p>
            </div>
          </a>
        </section>
      </main>

      {/* Footer Shell */}
      <footer className="bg-[#f4f4f0] dark:bg-[#1b3022] flex flex-col md:flex-row justify-between items-center px-12 py-20 w-full gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <span className="font-headline text-[#061b0e] dark:text-[#faf9f5] text-xl">Hotel Recanto do Interior</span>
          <p className="font-body uppercase tracking-widest text-[#061b0e]/60 dark:text-[#faf9f5]/60 text-xs">
            © 2024 Recanto do Interior. All rights reserved.
          </p>
        </div>
        <div className="flex gap-8">
          <a className="font-body uppercase tracking-widest text-[#061b0e]/60 dark:text-[#faf9f5]/60 hover:text-[#735c00] transition-all text-xs" href="https://www.instagram.com/recan_todointerior/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a className="font-body uppercase tracking-widest text-[#061b0e]/60 dark:text-[#faf9f5]/60 hover:text-[#735c00] transition-all text-xs" href="#">Privacy Policy</a>
          <a className="font-body uppercase tracking-widest text-[#061b0e]/60 dark:text-[#faf9f5]/60 hover:text-[#735c00] transition-all text-xs" href="#">Contact</a>
        </div>
      </footer>

      {/* Fixed Reservation CTA Mobile Only */}
      <div className="fixed bottom-0 left-0 w-full p-4 z-50 md:hidden bg-surface/80 glass-effect border-t border-outline-variant/10">
        <button 
          onClick={handleQuickConfirm}
          disabled={quickConfirmed}
          className="w-full bg-primary text-on-primary py-4 px-6 text-center font-bold tracking-widest uppercase text-xs flex justify-center items-center gap-3 disabled:opacity-90"
        >
          <span className="material-symbols-outlined text-secondary">
            {quickConfirmed ? 'check_circle' : 'calendar_today'}
          </span>
          {quickConfirmed ? 'Confirmado' : 'Confirmar Presença'}
        </button>
      </div>

      {/* Floating Toast */}
      <div 
        className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-secondary-fixed text-on-secondary-fixed px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 transition-all duration-500 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <span className="material-symbols-outlined">check_circle</span>
        <span className="font-bold tracking-widest uppercase text-sm whitespace-nowrap">Obrigado, esperamos você!</span>
      </div>
    </div>
  );
}
