import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CalendarDays, 
  PartyPopper, 
  Heart, 
  Gift, 
  Flame, 
  MessageCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles,
  ChevronRight,
  BellRing,
  AlertCircle
} from 'lucide-react';
import { UpcomingEventsResponse, BirthdayEvent, MemorialEvent, MarriageEvent, CustomEventItem } from '../../types';
import { 
  generateWhatsAppBirthdayText, 
  generateWhatsAppMemorialText, 
  generateWhatsAppMarriageText,
  generateWhatsAppCustomEventText,
  openWhatsAppShare,
  getZodiacSign
} from '../../utils/genealogy';

interface EventCalendarProps {
  eventsData: UpcomingEventsResponse;
  onSelectPerson: (id: string) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ eventsData, onSelectPerson }) => {
  const [activeSubTab, setActiveSubTab] = useState<'UPCOMING' | 'ALL_BIRTHDAYS' | 'MEMORIALS' | 'MARRIAGES' | 'CUSTOM'>('UPCOMING');
  const [daysFilter, setDaysFilter] = useState<number>(30); // 7, 30, 90, 365

  const triggerConfetti = (e: React.MouseEvent) => {
    e.stopPropagation();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const getMonthName = (monthNumber: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || '';
  };

  const handleShareBirthday = (e: React.MouseEvent, b: BirthdayEvent, isEve: boolean = false) => {
    e.stopPropagation();
    const text = generateWhatsAppBirthdayText({
      firstName: b.fullName,
      lastName: '',
      birthDate: b.birthDate,
      gender: b.gender,
      isEve: isEve || b.daysUntil === 1,
    });
    openWhatsAppShare(text);
  };

  const handleShareMemorial = (e: React.MouseEvent, m: MemorialEvent, isEve: boolean = false) => {
    e.stopPropagation();
    const text = generateWhatsAppMemorialText({
      firstName: m.fullName,
      lastName: '',
      deathDate: m.deathDate,
      isEve: isEve || m.daysUntil === 1,
    });
    openWhatsAppShare(text);
  };

  const handleShareMarriage = (e: React.MouseEvent, m: MarriageEvent, isEve: boolean = false) => {
    e.stopPropagation();
    const text = generateWhatsAppMarriageText({
      spouse1Name: m.spouse1Name,
      spouse2Name: m.spouse2Name,
      marriageDate: m.marriageDate,
      yearsMarried: m.yearsMarried,
      isEve: isEve || m.daysUntil === 1,
    });
    openWhatsAppShare(text);
  };

  const handleShareCustom = (e: React.MouseEvent, c: CustomEventItem, isEve: boolean = false) => {
    e.stopPropagation();
    const text = generateWhatsAppCustomEventText({
      personName: c.personName,
      title: c.title,
      eventType: c.eventType,
      eventDate: c.eventDate,
      yearsAnniversary: c.yearsAnniversary,
      description: c.description,
      isEve: isEve || c.daysUntil === 1,
    });
    openWhatsAppShare(text);
  };

  // Eventos de alerta de víspera (exactamente a 1 día / mañana) y Hoy
  const tomorrowBirthdays = eventsData.allBirthdays.filter((b) => b.daysUntil === 1);
  const tomorrowMemorials = eventsData.allMemorials.filter((m) => m.daysUntil === 1);
  const tomorrowMarriages = (eventsData.allMarriages || []).filter((m) => m.daysUntil === 1);
  const tomorrowCustom = (eventsData.allCustomEvents || []).filter((c) => c.daysUntil === 1);

  const todayBirthdays = eventsData.allBirthdays.filter((b) => b.daysUntil === 0);
  const todayMemorials = eventsData.allMemorials.filter((m) => m.daysUntil === 0);
  const todayMarriages = (eventsData.allMarriages || []).filter((m) => m.daysUntil === 0);
  const todayCustom = (eventsData.allCustomEvents || []).filter((c) => c.daysUntil === 0);

  // Filtrar cumpleaños por días restantes
  const filteredBirthdays = eventsData.allBirthdays.filter(
    (b) => b.daysUntil <= daysFilter
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* 🚨 Alertas Destacadas: 1 Día Antes (Mañana) y Hoy */}
      {(tomorrowBirthdays.length > 0 || tomorrowMemorials.length > 0 || todayBirthdays.length > 0 || todayMemorials.length > 0) && (
        <div className="flex flex-col gap-3">
          
          {/* Alertas de 1 DÍA ANTES: Cumpleaños Mañana */}
          {tomorrowBirthdays.map((b) => (
            <div 
              key={`alert-tomorrow-bday-${b.personId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center shrink-0 text-amber-300">
                  <BellRing className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      🚨 Alerta: Mañana (1 día antes)
                    </span>
                    <span className="text-xs text-amber-300 font-bold">🎂 Cumpleaños</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¡Mañana cumple años <span className="text-amber-300">{b.fullName}</span>!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {b.ageTurning ? `Cumplirá ${b.ageTurning} años.` : ''} Ten listo tu saludo para felicitarle a primera hora.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareBirthday(e, b, true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Alerta por WhatsApp</span>
              </button>
            </div>
          ))}

          {/* Alertas de 1 DÍA ANTES: Aniversario Luctuoso Mañana */}
          {tomorrowMemorials.map((m) => (
            <div 
              key={`alert-tomorrow-mem-${m.personId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-purple-500 bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shrink-0 text-purple-300">
                  <span className="text-2xl">🪽</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                      🕯️ Conmemoración Mañana
                    </span>
                    <span className="text-xs text-purple-300 font-bold">En Memoria</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Mañana conmemoramos a <span className="text-purple-300">{m.fullName}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {m.yearsPassed !== null ? `Se cumplen ${m.yearsPassed} años de su partida física.` : 'Aniversario luctuoso.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareMemorial(e, m, true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Homenaje por WhatsApp</span>
              </button>
            </div>
          ))}

          {/* Alertas de HOY: Cumpleaños */}
          {todayBirthdays.map((b) => (
            <div 
              key={`alert-today-bday-${b.personId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400 flex items-center justify-center shrink-0 text-emerald-300">
                  <PartyPopper className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      🎉 ¡HOY ES EL DÍA!
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">🎂 Cumpleaños</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¡Hoy está de cumpleaños <span className="text-emerald-300">{b.fullName}</span>!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {b.ageTurning ? `Cumple ${b.ageTurning} años hoy.` : ''} ¡Envíale felicitaciones y bendiciones!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareBirthday(e, b, false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Felicitación por WhatsApp</span>
              </button>
            </div>
          ))}

          {/* Alertas de HOY: Conmemoración */}
          {todayMemorials.map((m) => (
            <div 
              key={`alert-today-mem-${m.personId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-purple-500 bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shrink-0 text-purple-300">
                  <span className="text-2xl">🪽</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                      🕯️ Conmemoración Hoy
                    </span>
                    <span className="text-xs text-purple-300 font-bold">En Memoria</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Hoy recordamos con amor a <span className="text-purple-300">{m.fullName}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {m.yearsPassed !== null ? `A ${m.yearsPassed} años de su partida física.` : 'Aniversario luctuoso.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareMemorial(e, m, false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Homenaje por WhatsApp</span>
              </button>
            </div>
          ))}
          {/* Alertas de 1 DÍA ANTES: Aniversario de Matrimonio Mañana */}
          {tomorrowMarriages.map((m) => (
            <div 
              key={`alert-tomorrow-mar-${m.relationId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-pink-500 bg-gradient-to-r from-pink-950/80 via-slate-900 to-pink-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400 flex items-center justify-center shrink-0 text-pink-300">
                  <Heart className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider">
                      🚨 Alerta: Mañana (1 día antes)
                    </span>
                    <span className="text-xs text-pink-300 font-bold">💍 Aniversario de Boda</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¡Mañana celebran su aniversario <span className="text-pink-300">{m.spouse1Name} y {m.spouse2Name}</span>!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {m.yearsMarried !== null ? `Cumplirán ${m.yearsMarried + 1} años de matrimonio.` : ''} Ten listo tu mensaje de felicitación.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareMarriage(e, m, true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all shadow-lg shadow-pink-600/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Alerta por WhatsApp</span>
              </button>
            </div>
          ))}

          {/* Alertas de 1 DÍA ANTES: Hito Especial Mañana */}
          {tomorrowCustom.map((c) => (
            <div 
              key={`alert-tomorrow-cust-${c.id}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-sky-400 bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-400/20 border border-sky-400 flex items-center justify-center shrink-0 text-sky-300">
                  <Sparkles className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      🎓 Hito Especial Mañana
                    </span>
                    <span className="text-xs text-sky-300 font-bold">{c.title}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Mañana conmemoramos: <span className="text-sky-300">{c.title}</span> de {c.personName}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {c.description || 'Hito importante en la historia familiar.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareCustom(e, c, true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Hito por WhatsApp</span>
              </button>
            </div>
          ))}

          {/* Alertas de HOY: Aniversario de Matrimonio */}
          {todayMarriages.map((m) => (
            <div 
              key={`alert-today-mar-${m.relationId}`}
              className="p-4 sm:p-5 rounded-2xl border-2 border-pink-500 bg-gradient-to-r from-pink-950/90 via-slate-900 to-pink-950/40 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400 flex items-center justify-center shrink-0 text-pink-300">
                  <Heart className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase tracking-wider">
                      🥂 ¡HOY ES SU ANIVERSARIO!
                    </span>
                    <span className="text-xs text-pink-300 font-bold">💍 Matrimonio</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    ¡Hoy celebran su aniversario <span className="text-pink-300">{m.spouse1Name} y {m.spouse2Name}</span>!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {m.yearsMarried !== null ? `Cumplen ${m.yearsMarried} años juntos.` : '¡Felicidades a la pareja!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleShareMarriage(e, m, false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all shadow-lg shadow-pink-600/30 hover:scale-105 shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Felicitación por WhatsApp</span>
              </button>
            </div>
          ))}

        </div>
      )}

      {/* Header & Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Próximos 7 días */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/80 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <PartyPopper className="w-4 h-4" />
              Esta Semana (7 días)
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {eventsData.next7DaysBirthdays.length}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {eventsData.next7DaysBirthdays.length === 1 ? 'Cumpleaños próximo' : 'Cumpleaños próximos'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Próximos 30 días */}
        <div className="glass-panel p-5 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-slate-900/80 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Este Mes (30 días)
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {eventsData.next30DaysBirthdays.length}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Celebraciones en el mes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Homenajes y Memoria */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-slate-900/80 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              En Memoria
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {eventsData.totalMemorials}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Familiares recordados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Selector de Pestañas de Eventos */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 rounded-2xl border border-slate-800">
        
        <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveSubTab('UPCOMING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'UPCOMING'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            Próximos Cumpleaños ({eventsData.allBirthdays.length})
          </button>

          <button
            onClick={() => setActiveSubTab('ALL_BIRTHDAYS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'ALL_BIRTHDAYS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Calendario Anual
          </button>

          <button
            onClick={() => setActiveSubTab('MEMORIALS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'MEMORIALS'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-300 hover:text-purple-300'
            }`}
          >
            <span className="text-xs">🪽</span>
            Aniversarios Luctuosos ({eventsData.totalMemorials})
          </button>
        </div>

        {/* Filtro de Rango si está en UPCOMING */}
        {activeSubTab === 'UPCOMING' && (
          <div className="flex items-center gap-1 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
            <span className="text-slate-400 px-2 text-[11px]">Rango:</span>
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setDaysFilter(days)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  daysFilter === days
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days === 365 ? 'Todo el Año' : `${days} días`}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Contenido según Pestaña */}
      {activeSubTab === 'UPCOMING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBirthdays.length === 0 ? (
            <div className="col-span-full glass-panel p-12 rounded-2xl text-center text-slate-400">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No hay cumpleaños en este rango</h3>
              <p className="text-xs text-slate-500 mt-1">Prueba ampliando el filtro a 90 días o todo el año.</p>
            </div>
          ) : (
            filteredBirthdays.map((b) => {
              const isToday = b.daysUntil === 0;
              const isTomorrow = b.daysUntil === 1;
              const zodiac = getZodiacSign(b.birthDate);

              return (
                <div
                  key={b.personId}
                  onClick={() => onSelectPerson(b.personId)}
                  className={`glass-card p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isToday
                      ? 'border-amber-400/80 bg-gradient-to-br from-amber-950/50 via-slate-900/80 to-slate-900 ring-2 ring-amber-400/40 shadow-2xl'
                      : isTomorrow
                      ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/30 to-slate-900/80'
                      : b.gender === 'FEMALE'
                      ? 'border-pink-500/30 hover:border-pink-400 bg-slate-900/90'
                      : 'border-sky-500/30 hover:border-sky-400 bg-slate-900/90'
                  }`}
                >
                  {/* Badge de Días Restantes y Sexo */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {isToday ? (
                        <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-400/30 animate-bounce">
                          <PartyPopper className="w-3.5 h-3.5" />
                          ¡Es Hoy! 🎂
                        </span>
                      ) : isTomorrow ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ¡Mañana!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          En {b.daysUntil} días
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        b.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      }`}>
                        {b.gender === 'FEMALE' ? '♀ Mujer' : '♂ Hombre'}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      {b.birthDay} de {getMonthName(b.birthMonth)}
                    </span>
                  </div>

                  {/* Datos del Familiar */}
                  <div className="flex items-center gap-3">
                    {b.avatarUrl ? (
                      <img
                        src={b.avatarUrl}
                        alt={b.fullName}
                        className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md ${
                          b.gender === 'FEMALE' ? 'border-pink-500' : 'border-sky-500'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-base shadow-md ${
                          b.gender === 'FEMALE'
                            ? 'bg-pink-950/80 border-pink-500/60 text-pink-300'
                            : 'bg-sky-950/80 border-sky-500/60 text-sky-300'
                        }`}
                      >
                        {b.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                        {b.fullName}
                      </h4>
                      {b.ageTurning !== null ? (
                        <p className="text-xs text-emerald-400 font-bold mt-0.5">
                          Cumplirá <span className="text-white font-black">{b.ageTurning}</span> años
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">Fecha: {b.birthDate}</p>
                      )}
                      {zodiac && (
                        <p className="text-[11px] text-amber-300 font-semibold mt-0.5 flex items-center gap-1">
                          <span>{zodiac.symbol}</span>
                          <span>{zodiac.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas: Celebrar + Compartir WhatsApp */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={triggerConfetti}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors py-1.5 px-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Celebrar
                    </button>

                    <button
                      onClick={(e) => handleShareBirthday(e, b)}
                      className="flex items-center gap-1.5 text-xs text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-bold transition-all py-1.5 px-3 rounded-xl shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Compartir por WhatsApp
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vista de Calendario Anual Completo */}
      {activeSubTab === 'ALL_BIRTHDAYS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
            const monthEvents = eventsData.allBirthdays.filter((b) => b.birthMonth === monthNum);

            return (
              <div key={monthNum} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {getMonthName(monthNum)}
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {monthEvents.length} {monthEvents.length === 1 ? 'cumple' : 'cumples'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {monthEvents.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-2 text-center">Sin cumpleaños</p>
                  ) : (
                    monthEvents.map((b) => (
                      <div
                        key={b.personId}
                        onClick={() => onSelectPerson(b.personId)}
                        className={`flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border cursor-pointer transition-all text-xs ${
                          b.gender === 'FEMALE' ? 'border-pink-500/20 hover:border-pink-500/50' : 'border-sky-500/20 hover:border-sky-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-6 h-6 rounded-lg font-black flex items-center justify-center shrink-0 text-[11px] ${
                            b.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-300' : 'bg-sky-500/20 text-sky-300'
                          }`}>
                            {b.birthDay}
                          </span>
                          <span className="font-bold text-slate-200 truncate">{b.fullName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleShareBirthday(e, b)}
                          title="Compartir por WhatsApp"
                          className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista de Aniversarios Luctuosos & En Memoria */}
      {activeSubTab === 'MEMORIALS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventsData.allMemorials.length === 0 ? (
            <div className="col-span-full glass-panel p-12 rounded-2xl text-center text-slate-400">
              <span className="text-4xl block mb-3">🪽</span>
              <h3 className="text-base font-bold text-slate-200">No hay aniversarios luctuosos registrados</h3>
              <p className="text-xs text-slate-500 mt-1">Todos los familiares registrados figuran como vivos.</p>
            </div>
          ) : (
            eventsData.allMemorials.map((m) => {
              const isTodayMem = m.daysUntil === 0;
              const isTomorrowMem = m.daysUntil === 1;

              return (
                <div
                  key={m.personId}
                  onClick={() => onSelectPerson(m.personId)}
                  className={`glass-card p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isTodayMem
                      ? 'border-purple-400 bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 ring-2 ring-purple-400/50 shadow-2xl'
                      : isTomorrowMem
                      ? 'border-purple-500/80 bg-gradient-to-br from-purple-950/50 to-slate-900/90'
                      : 'border-purple-500/40 bg-slate-900/90 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {isTodayMem ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                          <span>🪽</span>
                          ¡Conmemoración Hoy!
                        </span>
                      ) : isTomorrowMem ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400 text-purple-200 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-300" />
                          ¡Mañana (1 día antes)!
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-1">
                          <span>🪽</span>
                          En memoria · Hace {m.yearsPassed !== null ? `${m.yearsPassed} años` : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-purple-200 font-semibold">
                      {m.deathDay} de {getMonthName(m.deathMonth)}
                    </span>
                  </div>

                <div className="flex items-center gap-3">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/50 grayscale group-hover:grayscale-0 transition-all shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl border-2 border-purple-500/40 bg-purple-950/60 text-purple-300 flex items-center justify-center font-bold text-base shadow-md">
                      {m.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                      {m.fullName}
                    </h4>
                    <p className="text-xs text-purple-300/90 mt-0.5">
                      Falleció: <span className="text-slate-100 font-semibold">{m.deathDate}</span>
                    </p>
                    {m.ageAtDeath !== null && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Longevidad: {m.ageAtDeath} años
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <button
                    onClick={(e) => handleShareMemorial(e, m)}
                    className="flex items-center gap-1.5 text-xs text-purple-200 bg-purple-900/60 hover:bg-purple-800 font-bold transition-all py-1.5 px-3 rounded-xl border border-purple-500/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-purple-300" />
                    Compartir Homenaje
                  </button>

                  <div className="flex items-center gap-1 text-purple-400 group-hover:text-purple-300 font-bold">
                    <span>Ver biografía</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

    </div>
  );
};
