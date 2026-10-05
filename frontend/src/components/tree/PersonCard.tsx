import React from 'react';
import { 
  Calendar, 
  MapPin, 
  ChevronRight,
  MessageCircle,
  Share2
} from 'lucide-react';
import { TreeGraphNode } from '../../types';
import { 
  calculateAgeDetails, 
  getZodiacSign, 
  formatFullName,
  generateWhatsAppBirthdayText,
  generateWhatsAppMemorialText,
  openWhatsAppShare,
  getKinshipInfo
} from '../../utils/genealogy';

interface PersonCardProps {
  person: TreeGraphNode;
  onSelect: (id: string) => void;
  onAddRelative?: (id: string) => void;
  isFocused?: boolean;
  highlightMatch?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  onSelect,
  isFocused = false,
  highlightMatch = false,
}) => {
  const ageDetails = calculateAgeDetails(person.birthDate, person.deathDate, person.isAlive);
  const zodiac = getZodiacSign(person.birthDate);
  const fullName = formatFullName(person);

  const isMale = person.gender === 'MALE';
  const isFemale = person.gender === 'FEMALE';

  // Color de borde y acento según género (Azul = Hombre, Rosa = Mujer) y estado vital
  const getCardStyle = () => {
    if (!ageDetails.isAlive) {
      return {
        cardBg: 'bg-slate-900/90 hover:bg-slate-900',
        border: 'border-purple-500/40 hover:border-purple-400',
        badgeBg: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
        avatarBorder: isFemale ? 'border-pink-500/80 ring-2 ring-pink-500/20' : 'border-sky-500/80 ring-2 ring-sky-500/20',
        accentGlow: 'hover:shadow-purple-500/20',
        genderBadge: isFemale ? 'bg-pink-950/70 text-pink-300 border-pink-500/40' : 'bg-sky-950/70 text-sky-300 border-sky-500/40',
      };
    }

    if (isFemale) {
      return {
        cardBg: 'bg-slate-900/90 hover:bg-slate-900',
        border: 'border-pink-500/40 hover:border-pink-400',
        badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        avatarBorder: 'border-pink-500 shadow-md shadow-pink-500/20',
        accentGlow: 'hover:shadow-pink-500/25',
        genderBadge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      };
    }

    if (isMale) {
      return {
        cardBg: 'bg-slate-900/90 hover:bg-slate-900',
        border: 'border-sky-500/40 hover:border-sky-400',
        badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        avatarBorder: 'border-sky-500 shadow-md shadow-sky-500/20',
        accentGlow: 'hover:shadow-sky-500/25',
        genderBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      };
    }

    return {
      cardBg: 'bg-slate-900/90 hover:bg-slate-900',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      avatarBorder: 'border-emerald-400',
      accentGlow: 'hover:shadow-emerald-500/20',
      genderBadge: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  const style = getCardStyle();

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ageDetails.isAlive) {
      const text = generateWhatsAppBirthdayText(person);
      openWhatsAppShare(text);
    } else {
      const text = generateWhatsAppMemorialText(person);
      openWhatsAppShare(text);
    }
  };

  return (
    <div
      onClick={() => onSelect(person.id)}
      className={`relative w-64 sm:w-72 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-300 shadow-xl border backdrop-blur-md select-none group ${
        style.cardBg
      } ${style.border} ${style.accentGlow} ${
        isFocused ? 'ring-2 ring-emerald-400 scale-105 shadow-2xl z-20' : ''
      } ${highlightMatch ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
    >
      {/* Badge Superior: Sexo (Azul ♂ o Rosa ♀) y Estado Vital / Alitas */}
      <div className="absolute -top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Sexo: Azul para Hombre, Rosa para Mujer */}
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-md flex items-center gap-1 ${style.genderBadge}`}>
          {isFemale ? (
            <>
              <span className="text-xs">♀</span>
              <span>Femenino</span>
            </>
          ) : isMale ? (
            <>
              <span className="text-xs">♂</span>
              <span>Masculino</span>
            </>
          ) : (
            <span>Familiar</span>
          )}
        </span>

        {/* Estado Vital: Vivo o Alitas de Ángel */}
        {!ageDetails.isAlive ? (
          <div className="bg-purple-950 border border-purple-500/50 text-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-purple-950/80">
            <span className="text-xs">🪽</span>
            <span>En Memoria</span>
          </div>
        ) : (
          <div className="bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vivo</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 mt-2">
        {/* Avatar con Borde Azul o Rosa según género */}
        <div className="relative shrink-0">
          {person.avatarUrl ? (
            <img
              src={person.avatarUrl}
              alt={person.firstName}
              className={`w-14 h-14 rounded-2xl object-cover border-2 ${style.avatarBorder} shadow-md`}
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-2xl border-2 ${
                style.avatarBorder
              } flex items-center justify-center font-black text-base shadow-md ${
                isFemale
                  ? 'bg-pink-950/80 text-pink-300'
                  : isMale
                  ? 'bg-sky-950/80 text-sky-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {person.firstName[0]}
              {person.lastName[0]}
            </div>
          )}

          {/* Indicador inferior */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
              isFemale ? 'bg-pink-500' : isMale ? 'bg-sky-500' : 'bg-slate-600'
            }`}
          >
            <span className="text-[9px] text-white font-black leading-none">
              {isFemale ? '♀' : isMale ? '♂' : '•'}
            </span>
          </div>
        </div>

        {/* Nombres e Información */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-black transition-colors truncate ${
            isFemale ? 'text-pink-100 group-hover:text-pink-300' : isMale ? 'text-sky-100 group-hover:text-sky-300' : 'text-slate-100 group-hover:text-emerald-400'
          }`}>
            {fullName || `${person.firstName} ${person.lastName}`}
          </h3>

          {person.kinshipRole && person.kinshipRole !== 'otro' && (
            <div className="mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wide shadow-sm ${
                getKinshipInfo(person.kinshipRole).badgeColor
              }`}>
                <span>{getKinshipInfo(person.kinshipRole).icon}</span>
                <span>{getKinshipInfo(person.kinshipRole).label}</span>
              </span>
            </div>
          )}

          {person.nickname && (
            <p className="text-[11px] text-amber-300/90 truncate italic font-medium mt-0.5">
              "{person.nickname}"
            </p>
          )}

          {person.maidenName && (
            <p className="text-[10px] text-slate-400 truncate italic">
              de soltera: {person.maidenName}
            </p>
          )}

          {person.profession && (
            <p className="text-[11px] text-slate-300 truncate font-semibold mt-0.5">
              {person.profession}
            </p>
          )}
        </div>
      </div>

      {/* Datos Clave: Fecha de Nacimiento, Signo, Edad y Defunción */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
        {/* Nacimiento y Signo */}
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{person.birthDate || 'Sin fecha'}</span>
          </div>
          {zodiac && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
              {zodiac.symbol} {zodiac.name}
            </span>
          )}
        </div>

        {/* Si está VIVO: Mostrar Edad Actual */}
        {ageDetails.isAlive && ageDetails.currentAge !== null && (
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
            <span>Edad:</span>
            <span className="text-slate-100">{ageDetails.currentAge} años</span>
          </div>
        )}

        {/* Si está FALLECIDO: Alitas de ángel, Fecha de Partida, Edad al Fallecer y Qué Edad Tendría */}
        {!ageDetails.isAlive && (
          <div className="mt-1 p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col gap-1 text-[11px] text-purple-200">
            {person.deathDate && (
              <div className="flex items-center gap-1 text-purple-300 font-semibold">
                <span>🪽 Partida:</span>
                <span className="font-mono text-[10px]">{person.deathDate}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
              {ageDetails.ageAtDeath !== null && (
                <span className="text-purple-300">
                  Falleció a los: <strong className="text-white">{ageDetails.ageAtDeath}a</strong>
                </span>
              )}
              {ageDetails.wouldBeAge !== null && (
                <span className="text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">
                  Tendría hoy: <strong className="text-amber-300">{ageDetails.wouldBeAge} años</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Lugar de Nacimiento */}
        {person.birthPlace && (
          <div className="flex items-center gap-1 text-slate-400 text-[10px] truncate mt-0.5">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{person.birthPlace}</span>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta con Botón WhatsApp y Ver Perfil */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        {/* Botón WhatsApp */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          title={ageDetails.isAlive ? "Compartir cumpleaños por WhatsApp" : "Compartir homenaje por WhatsApp"}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-[10px] border border-emerald-500/30 transition-all shadow-sm group/btn"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>

        <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 font-bold transition-colors text-[10px]">
          <span>Ver perfil</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
