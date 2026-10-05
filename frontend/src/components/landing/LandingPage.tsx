import React from 'react';
import { 
  Network, 
  PartyPopper, 
  Heart, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Users, 
  Calendar,
  Gift,
  Smile
} from 'lucide-react';

interface LandingPageProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenRegister, onOpenLogin }) => {
  return (
    <div className="flex flex-col gap-16 max-w-7xl mx-auto pb-20 pt-8 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="relative text-center flex flex-col items-center gap-6 px-4">
        
        {/* Badge Flotante */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-950/40">
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Plataforma 100% Gratuita & Libre para Todas las Familias</span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight">
          Preserva el linaje de tu familia y no olvides ningún{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
            Cumpleaños
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Crea tu árbol genealógico interactivo, celebra las fechas de tus seres queridos vivos y honra la memoria de tus antepasados sin ningún costo.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all scale-100 hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Crear mi Árbol Familiar Gratis</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-6 py-4 rounded-2xl text-sm transition-all cursor-pointer"
          >
            <span>Ya tengo cuenta · Iniciar Sesión</span>
          </button>
        </div>

        {/* Ventajas Gratuitas */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" /> Sin límites de familiares
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" /> Felicitaciones por WhatsApp en 1-clic
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" /> Respaldos JSON y GEDCOM incluidos
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" /> Privado y Seguro
          </span>
        </div>

      </div>

      {/* Características Destacadas (Grid 3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-emerald-500/40 transition-all shadow-xl">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Network className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Árbol Genealógico Interactivo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navegación visual con zoom fluido, niveles generacionales, conexiones familiares, matrimonios y retratos fotográficos.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-amber-500/40 transition-all shadow-xl">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <PartyPopper className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Alertas de Cumpleaños & Fechas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cálculo automático de días restantes, edad que cumplirán y mensajes personalizados de felicitación directa por WhatsApp.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-purple-500/40 transition-all shadow-xl">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">En Memoria & Antepasados</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conmemoración de familiares que partieron, cálculo de longevidad histórica y biografías con memorias y anécdotas.
            </p>
          </div>
        </div>

      </div>

      {/* Banner de Compromiso Gratuito */}
      <div className="px-4">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-2xl">
          <div className="flex-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
              <Smile className="w-4 h-4" />
              Compromiso Familiar
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Todas las funciones están 100% desbloqueadas
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
              Regístrate en menos de 10 segundos y comienza a armar la historia de tu familia hoy mismo.
            </p>
          </div>

          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
          >
            <span>Empezar Ahora Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
