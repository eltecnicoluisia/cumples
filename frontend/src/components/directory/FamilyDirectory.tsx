import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  MapPin, 
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Person, Gender } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateAgeDetails, 
  getZodiacSign, 
  formatFullName,
  generateWhatsAppBirthdayText,
  generateWhatsAppMemorialText,
  openWhatsAppShare,
  getKinshipInfo
} from '../../utils/genealogy';

interface FamilyDirectoryProps {
  persons: Person[];
  onSelectPerson: (id: string) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  onAddNew: () => void;
}

export const FamilyDirectory: React.FC<FamilyDirectoryProps> = ({
  persons,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onAddNew,
}) => {
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [vitalFilter, setVitalFilter] = useState<'ALL' | 'ALIVE' | 'DECEASED'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [generationFilter, setGenerationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'BIRTH_DATE' | 'GENERATION'>('BIRTH_DATE');

  // Filtrado y ordenamiento
  const filteredPersons = useMemo(() => {
    return persons
      .filter((p) => {
        // Búsqueda textual por todos los nombres y campos
        if (searchTerm.trim() !== '') {
          const full = `${p.firstName} ${p.middleName || ''} ${p.lastName} ${p.secondLastName || ''} ${p.maidenName || ''} ${p.nickname || ''} ${p.profession || ''} ${p.birthPlace || ''}`.toLowerCase();
          if (!full.includes(searchTerm.toLowerCase())) return false;
        }

        // Filtro de vida
        if (vitalFilter === 'ALIVE' && !p.isAlive) return false;
        if (vitalFilter === 'DECEASED' && p.isAlive) return false;

        // Filtro de género
        if (genderFilter !== 'ALL' && p.gender !== genderFilter) return false;

        // Filtro de generación
        if (generationFilter !== 'ALL' && String(p.generation || 1) !== generationFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BIRTH_DATE') {
          return (a.birthDate || '9999').localeCompare(b.birthDate || '9999');
        }
        if (sortBy === 'NAME') {
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        }
        if (sortBy === 'GENERATION') {
          return (a.generation || 1) - (b.generation || 1);
        }
        return 0;
      });
  }, [persons, searchTerm, vitalFilter, genderFilter, generationFilter, sortBy]);

  // Obtener generaciones únicas presentes
  const availableGenerations = useMemo(() => {
    const gens = new Set<number>();
    persons.forEach((p) => gens.add(p.generation || 1));
    return Array.from(gens).sort((a, b) => a - b);
  }, [persons]);

  const handleShareWhatsApp = (e: React.MouseEvent, p: Person) => {
    e.stopPropagation();
    const age = calculateAgeDetails(p.birthDate, p.deathDate, p.isAlive);
    if (age.isAlive) {
      const text = generateWhatsAppBirthdayText(p);
      openWhatsAppShare(text);
    } else {
      const text = generateWhatsAppMemorialText(p);
      openWhatsAppShare(text);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Barra de Filtros y Acciones */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Buscador */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, profesión o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filtros Dropdowns & Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          
          {/* Filtro Vital */}
          <select
            value={vitalFilter}
            onChange={(e) => setVitalFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option className="bg-slate-900 text-slate-100 font-semibold" value="ALL">Estado: Todos</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="ALIVE">🟢 Solo Vivos</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="DECEASED">🪽 En Memoria</option>
          </select>

          {/* Filtro Género */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option className="bg-slate-900 text-slate-100 font-semibold" value="ALL">Sexo: Todos</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="FEMALE">♀ Mujeres (Rosa)</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="MALE">♂ Hombres (Azul)</option>
          </select>

          {/* Filtro Generación */}
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option className="bg-slate-900 text-slate-100 font-semibold" value="ALL">Generación: Todas</option>
            {availableGenerations.map((g) => (
              <option className="bg-slate-900 text-slate-100 font-semibold" key={g} value={String(g)}>
                Generación {g}
              </option>
            ))}
          </select>

          {/* Ordenar por */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option className="bg-slate-900 text-slate-100 font-semibold" value="BIRTH_DATE">Ordenar: Fecha de Nacimiento</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="NAME">Ordenar: Apellido y Nombre</option>
            <option className="bg-slate-900 text-slate-100 font-semibold" value="GENERATION">Ordenar: Generación</option>
          </select>

          {/* Toggle Grid/Table */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'GRID' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'TABLE' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Vista en Tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Nuevo */}
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar Familiar</span>
          </button>

        </div>

      </div>

      {/* Resultados & Conteo */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Mostrando {filteredPersons.length} de {persons.length} familiares</span>
        <span>
          <strong className="text-emerald-400">{filteredPersons.filter(p => p.isAlive).length}</strong> vivos ·{' '}
          <strong className="text-purple-400">{filteredPersons.filter(p => !p.isAlive).length}</strong> en memoria
        </span>
      </div>

      {/* Vista en Cuadrícula (Grid) */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPersons.map((p) => {
            const ageDetails = calculateAgeDetails(p.birthDate, p.deathDate, p.isAlive);
            const zodiac = getZodiacSign(p.birthDate);
            const fullName = formatFullName(p);
            const isFemale = p.gender === 'FEMALE';
            const isMale = p.gender === 'MALE';

            return (
              <div
                key={p.id}
                onClick={() => onSelectPerson(p.id)}
                className={`glass-card p-5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  !ageDetails.isAlive
                    ? 'border-purple-500/30 hover:border-purple-400 bg-slate-900/90'
                    : isFemale
                    ? 'border-pink-500/30 hover:border-pink-400 bg-slate-900/90'
                    : isMale
                    ? 'border-sky-500/30 hover:border-sky-400 bg-slate-900/90'
                    : 'border-slate-800 hover:border-emerald-500/40 bg-slate-900/90'
                }`}
              >
                <div>
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isFemale
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                            : isMale
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isFemale ? '♀ Mujer' : isMale ? '♂ Hombre' : 'Familiar'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ageDetails.isAlive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-purple-950 text-purple-300 border-purple-500/40'
                        }`}
                      >
                        {ageDetails.isAlive ? '🟢 Vivo' : '🪽 En Memoria'}
                      </span>

                      {p.kinshipRole && p.kinshipRole !== 'otro' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${getKinshipInfo(p.kinshipRole).badgeColor}`}>
                          <span>{getKinshipInfo(p.kinshipRole).icon}</span>
                          <span>{getKinshipInfo(p.kinshipRole).label}</span>
                        </span>
                      )}
                    </div>

                    {isAuthenticated && (
                      <div
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onEditPerson(p)}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                          title="Editar familiar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar a ${fullName || p.firstName}?`)) {
                              onDeletePerson(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                          title="Eliminar familiar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Avatar y Nombres */}
                  <div className="flex items-center gap-3">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.firstName}
                        className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md ${
                          !ageDetails.isAlive
                            ? 'border-purple-500 grayscale'
                            : isFemale
                            ? 'border-pink-500'
                            : 'border-sky-500'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-base shadow-md ${
                          !ageDetails.isAlive
                            ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                            : isFemale
                            ? 'bg-pink-950/80 border-pink-500/60 text-pink-300'
                            : 'bg-sky-950/80 border-sky-500/60 text-sky-300'
                        }`}
                      >
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-extrabold transition-colors truncate ${
                        isFemale ? 'text-pink-100 group-hover:text-pink-300' : isMale ? 'text-sky-100 group-hover:text-sky-300' : 'text-slate-100 group-hover:text-emerald-400'
                      }`}>
                        {fullName || `${p.firstName} ${p.lastName}`}
                      </h4>
                      {p.nickname && (
                        <p className="text-[11px] text-amber-300/90 italic truncate">
                          "{p.nickname}"
                        </p>
                      )}
                      {p.profession && (
                        <p className="text-[11px] text-slate-300 truncate font-medium">{p.profession}</p>
                      )}
                    </div>
                  </div>

                  {/* Fechas, Edad y Lugares */}
                  <div className="mt-3 flex flex-col gap-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
                    {p.birthDate && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-[11px]">{p.birthDate}</span>
                        </div>
                        {zodiac && (
                          <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {zodiac.symbol} {zodiac.name}
                          </span>
                        )}
                      </div>
                    )}

                    {ageDetails.isAlive && ageDetails.currentAge !== null && (
                      <div className="text-[11px] font-bold text-emerald-300">
                        Edad: {ageDetails.currentAge} años
                      </div>
                    )}

                    {!ageDetails.isAlive && (
                      <div className="text-[10px] text-purple-300 bg-purple-950/40 p-1.5 rounded-lg border border-purple-500/20 flex flex-col gap-0.5">
                        {p.deathDate && <span>🪽 Partida: {p.deathDate}</span>}
                        {ageDetails.ageAtDeath !== null && <span>Falleció a los: {ageDetails.ageAtDeath} años</span>}
                        {ageDetails.wouldBeAge !== null && <span>Tendría hoy: <strong>{ageDetails.wouldBeAge} años</strong></span>}
                      </div>
                    )}

                    {p.birthPlace && (
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{p.birthPlace}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón WhatsApp y Ver Detalle */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsApp(e, p)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-[10px] border border-emerald-500/30 transition-all"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 font-semibold transition-colors text-[10px]">
                    <span>Ver parentesco</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista en Tabla (Table) */}
      {viewMode === 'TABLE' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Familiar</th>
                  <th className="py-3 px-4">Sexo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Nacimiento / Edad</th>
                  <th className="py-3 px-4">Signo</th>
                  <th className="py-3 px-4">Lugar</th>
                  <th className="py-3 px-4 text-right">Compartir / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPersons.map((p) => {
                  const ageDetails = calculateAgeDetails(p.birthDate, p.deathDate, p.isAlive);
                  const zodiac = getZodiacSign(p.birthDate);
                  const fullName = formatFullName(p);
                  const isFemale = p.gender === 'FEMALE';
                  const isMale = p.gender === 'MALE';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPerson(p.id)}
                      className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isFemale ? 'bg-pink-950 border border-pink-500/40 text-pink-300' : 'bg-sky-950 border border-sky-500/40 text-sky-300'
                            }`}
                          >
                            {p.firstName[0]}
                            {p.lastName[0]}
                          </div>
                          <div>
                            <p className={`font-extrabold transition-colors ${
                              isFemale ? 'text-pink-100 hover:text-pink-300' : 'text-sky-100 hover:text-sky-300'
                            }`}>
                              {fullName || `${p.firstName} ${p.lastName}`}
                            </p>
                            {p.profession && <p className="text-[10px] text-slate-400">{p.profession}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isFemale ? 'bg-pink-500/20 text-pink-300' : isMale ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isFemale ? '♀ Mujer' : isMale ? '♂ Hombre' : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ageDetails.isAlive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {ageDetails.isAlive ? '🟢 Vivo' : '🪽 En Memoria'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>{p.birthDate || '—'}</div>
                        {ageDetails.isAlive && ageDetails.currentAge !== null && (
                          <span className="text-[10px] text-emerald-400 font-sans font-bold">({ageDetails.currentAge} años)</span>
                        )}
                        {!ageDetails.isAlive && ageDetails.wouldBeAge !== null && (
                          <span className="text-[10px] text-purple-300 font-sans">(Tendría {ageDetails.wouldBeAge}a)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {zodiac ? (
                          <span className="text-[11px] text-amber-300 font-bold">
                            {zodiac.symbol} {zodiac.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.birthPlace || '—'}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleShareWhatsApp(e, p)}
                            title="Compartir por WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {isAuthenticated && (
                            <>
                              <button
                                onClick={() => onEditPerson(p)}
                                className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar a ${fullName || p.firstName}?`)) onDeletePerson(p.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
