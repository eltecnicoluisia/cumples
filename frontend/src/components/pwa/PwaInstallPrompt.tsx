import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, Check, Monitor } from 'lucide-react';

export const triggerPwaInstallModal = () => {
  window.dispatchEvent(new CustomEvent('open-pwa-install'));
};

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si ya está corriendo como app instalada (standalone)
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Manejar evento de instalación estándar (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissedToday = localStorage.getItem('cumples_pwa_dismissed');
      if (!dismissedToday && !isRunningStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuchar evento para abrir modal desde cualquier parte (Navbar, etc.)
    const handleOpenInstallModal = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-install', handleOpenInstallModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstallModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS || !deferredPrompt) {
      setShowModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setShowModal(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowPrompt(false);
    localStorage.setItem('cumples_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Banner Flotante Inferior de Instalación en Móvil */}
      {showPrompt && !showModal && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/40 bg-slate-900/95 shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-3">
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowModal(true)}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Instalar Aplicación</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold">
                    APP WEB
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Accede a CUMPLES desde tu pantalla de inicio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[3]" />
                <span>Instalar</span>
              </button>

              <button
                onClick={handleDismissBanner}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Guía Completa de Instalación PWA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Instalar Aplicación CUMPLES</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                    PWA
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accede instantáneamente desde tu pantalla de inicio sin abrir el navegador
                </p>
              </div>
            </div>

            {isStandalone ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>¡Genial! Ya tienes CUMPLES instalado en este dispositivo.</span>
              </div>
            ) : (
              <>
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full mb-6 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-5 h-5 stroke-[3]" />
                    <span>📲 Instalar Aplicación Ahora en 1 Clic</span>
                  </button>
                )}

                <div className="flex flex-col gap-4 text-xs">
                  <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">
                    Instrucciones para instalar en tu dispositivo:
                  </h4>

                  {/* Android / Chrome */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>En Android / Google Chrome:</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      1. Toca el botón verde <b>&quot;Instalar Aplicación Ahora&quot;</b> de arriba.<br />
                      2. Si no aparece, toca el menú de tres puntos (<b>⋮</b>) arriba a la derecha en Chrome y presiona <b>&quot;Agregar a la pantalla principal&quot;</b> o <b>&quot;Instalar aplicación&quot;</b>.
                    </p>
                  </div>

                  {/* iPhone / Safari */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Share2 className="w-4 h-4 text-sky-400" />
                      <span>En iPhone / iPad (Safari):</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      1. Toca el icono <b>Compartir</b> (<Share2 className="w-3.5 h-3.5 inline text-sky-400" />) en la barra inferior de Safari.<br />
                      2. Desliza hacia abajo y selecciona <b>&quot;Añadir a la pantalla de inicio&quot;</b> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />).
                    </p>
                  </div>

                  {/* Laptop / PC */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-white text-xs">
                      <Monitor className="w-4 h-4 text-amber-400" />
                      <span>En Computadora / Laptop (Chrome o Edge):</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Toca el icono de pantalla con flecha (<Download className="w-3.5 h-3.5 inline text-amber-400" />) ubicado en la barra de dirección superior a la derecha y selecciona <b>&quot;Instalar CUMPLES&quot;</b>.
                    </p>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Entendido / Cerrar
            </button>

          </div>
        </div>
      )}
    </>
  );
};
