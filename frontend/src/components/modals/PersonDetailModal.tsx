import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Heart, 
  ShieldCheck, 
  Copy, 
  Check, 
  User, 
  Sparkles,
  MessageCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Person, SpouseRelationItem } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateAgeDetails, 
  getZodiacSign, 
  formatFullName,
  generateWhatsAppBirthdayText,
  generateWhatsAppMemorialText,
  openWhatsAppShare
} from '../../utils/genealogy';

interface PersonDetailModalProps {
  personId: string | null;
  onClose: () => void;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  onOpenAddRelation: (personId: string, category?: 'PARENT' | 'CHILD' | 'SPOUSE') => void;
  onSelectRelative: (relativeId: string) => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  personId,
  onClose,
  onEdit,
  onDelete,
  onOpenAddRelation,
  onSelectRelative,
}) => {
  const { isAuthenticated } = useAuth();
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const res = await api.getPersonById(personId);
        setPerson(res.person);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [personId]);

  if (!personId) return null;

  const copyMerkleHash = () => {
    if (person?.merkleHash) {
      navigator.clipboard.writeText(person.merkleHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const ageDetails = person ? calculateAgeDetails(person.birthDate, person.deathDate, person.isAlive) : null;
  const zodiac = person ? getZodiacSign(person.birthDate) : null;
  const fullName = person ? formatFullName(person) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 relative max-h-[92vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading || !person || !ageDetails ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Cargando ficha genealógica...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Header / Foto y Datos Básicos */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-800 pb-6">
              <div className="relative shrink-0">
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    alt={person.firstName}
                    className={`w-24 h-24 rounded-2xl object-cover border-4 shadow-xl ${
                      ageDetails.isAlive ? 'border-emerald-500/50' : 'border-purple-500/50 grayscale'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl border-4 flex items-center justify-center font-extrabold text-2xl shadow-xl ${
                      !ageDetails.isAlive
                        ? 'bg-purple-950/50 border-purple-500/40 text-purple-300'
                        : person.gender === 'FEMALE'
                        ? 'bg-pink-950 border-pink-500/40 text-pink-300'
                        : 'bg-sky-950 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    {person.firstName[0]}
                    {person.lastName[0]}
                  </div>
                )}

                <div
                  className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-md flex items-center gap-1 ${
                    ageDetails.isAlive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-purple-950 text-purple-200 border-purple-500/50 shadow-purple-950/80'
                  }`}
                >
                  {ageDetails.isAlive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>Vivo</span>
                    </>
                  ) : (
                    <>
                      <span>🪽</span>
                      <span>En Memoria</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white">
                    {fullName || `${person.firstName} ${person.lastName}`}
                  </h2>
                  {person.nickname && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/20 italic font-semibold">
                      "{person.nickname}"
                    </span>
                  )}
                </div>

                {person.maidenName && (
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    Apellido de soltera: {person.maidenName}
                  </p>
                )}

                {person.profession && (
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {person.profession}
                  </p>
                )}

                {/* Signo Zodiacal & Generación */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {zodiac && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
                      <span className="text-sm">{zodiac.symbol}</span>
                      <span>Signo: {zodiac.name}</span>
                      <span className="text-[10px] text-amber-400/80 font-normal">({zodiac.dates})</span>
                    </div>
                  )}

                  {person.generation && (
                    <div className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                      Generación {person.generation}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha de Fechas, Edad y Lugares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nacimiento & Edad */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Nacimiento
                </span>
                <div className="text-xs text-slate-200">
                  <strong>Fecha:</strong> {person.birthDate || 'No registrada'}
                </div>
                {person.birthPlace && (
                  <div className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{person.birthPlace}</span>
                  </div>
                )}
                {ageDetails.isAlive && ageDetails.currentAge !== null && (
                  <div className="mt-1 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    🟢 Edad actual: {ageDetails.currentAge} años
                  </div>
                )}
              </div>

              {/* Defunción & Cálculos en Memoria (si aplica) */}
              {!ageDetails.isAlive && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex flex-col gap-2 animate-in fade-in duration-200">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🪽</span>
                    Partida & Sepultura
                  </span>
                  <div className="text-xs text-slate-200">
                    <strong>Fecha de partida:</strong> {person.deathDate || 'No registrada'}
                  </div>
                  {person.deathPlace && (
                    <div className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{person.deathPlace}</span>
                    </div>
                  )}
                  <div className="mt-1 flex flex-col gap-1 text-xs">
                    {ageDetails.ageAtDeath !== null && (
                      <div className="p-2 rounded-xl bg-purple-900/50 border border-purple-500/30 text-purple-200 font-semibold">
                        🕊️ Falleció a los: <strong className="text-white">{ageDetails.ageAtDeath} años</strong>
                      </div>
                    )}
                    {ageDetails.wouldBeAge !== null && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 font-semibold">
                        ✨ Tendría de estar vivo: <strong className="text-amber-300">{ageDetails.wouldBeAge} años hoy</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Vínculos Genealógicos y Familiares */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  Núcleo Familiar & Vínculos
                </h4>
                {isAuthenticated && (
                  <button
                    onClick={() => onOpenAddRelation(person.id)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Vínculo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Progenitores (Padres) */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Progenitores (Padres)
                      </span>
                      {isAuthenticated && (
                        <button
                          onClick={() => onOpenAddRelation(person.id, 'PARENT')}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                          title="Añadir Padre o Madre"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Padre/Madre</span>
                        </button>
                      )}
                    </div>
                    {person.parentRelations && person.parentRelations.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {person.parentRelations.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => onSelectRelative(r.parentId)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors text-xs font-semibold text-slate-200"
                          >
                            <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                              P
                            </div>
                            <span className="truncate">
                              {formatFullName(r.parent) || `${r.parent.firstName} ${r.parent.lastName}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">No registrados</p>
                    )}
                  </div>
                </div>

                {/* Cónyuges / Parejas */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Cónyuges / Pareja
                      </span>
                      {isAuthenticated && (
                        <button
                          onClick={() => onOpenAddRelation(person.id, 'SPOUSE')}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                          title="Añadir Cónyuge o Pareja"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Pareja</span>
                        </button>
                      )}
                    </div>
                    {((person.spousesAsFirst?.length || 0) + (person.spousesAsSecond?.length || 0)) > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {person.spousesAsFirst?.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => s.person2 && onSelectRelative(s.person2.id)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors text-xs font-semibold text-slate-200"
                          >
                            <span className="text-[11px]">💍</span>
                            <span className="truncate">
                              {s.person2 ? formatFullName(s.person2) : 'Pareja'}
                            </span>
                          </div>
                        ))}
                        {person.spousesAsSecond?.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => s.person1 && onSelectRelative(s.person1.id)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors text-xs font-semibold text-slate-200"
                          >
                            <span className="text-[11px]">💍</span>
                            <span className="truncate">
                              {s.person1 ? formatFullName(s.person1) : 'Pareja'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">No registrada</p>
                    )}
                  </div>
                </div>

                {/* Descendientes (Hijos) */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Hijos ({person.childRelations?.length || 0})
                      </span>
                      {isAuthenticated && (
                        <button
                          onClick={() => onOpenAddRelation(person.id, 'CHILD')}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                          title="Añadir Hijo o Hija"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Hijo/a</span>
                        </button>
                      )}
                    </div>
                    {person.childRelations && person.childRelations.length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {person.childRelations.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => onSelectRelative(r.childId)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors text-xs font-semibold text-slate-200"
                          >
                            <div className="w-5 h-5 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center text-[10px] font-bold">
                              H
                            </div>
                            <span className="truncate">
                              {formatFullName(r.child) || `${r.child.firstName} ${r.child.lastName}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">Sin hijos registrados</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Biografía y Recuerdos */}
            {person.biography && (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Biografía & Recuerdos Familiares
                </span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {person.biography}
                </p>
              </div>
            )}

            {/* Contacto directo si está vivo */}
            {ageDetails.isAlive && (person.contactPhone || person.contactEmail) && (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  {person.contactPhone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {person.contactPhone}
                    </span>
                  )}
                  {person.contactEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      {person.contactEmail}
                    </span>
                  )}
                </div>

                {person.contactPhone && (
                  <a
                    href={`https://wa.me/${person.contactPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            )}

            {/* Sello de Integridad Criptográfica (SHA-256 Merkle Node) */}
            {person.merkleHash && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2 truncate pr-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-500">SHA-256:</span>
                  <span className="truncate text-slate-300">{person.merkleHash}</span>
                </div>
                <button
                  onClick={copyMerkleHash}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copiar Hash SHA-256 de integridad"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Acciones Administrativas */}
            {isAuthenticated && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar a ${fullName || person.firstName}?`)) {
                      onDelete(person.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold py-2 px-3 rounded-xl hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Familiar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (ageDetails.isAlive) {
                        const text = generateWhatsAppBirthdayText(person);
                        openWhatsAppShare(text);
                      } else {
                        const text = generateWhatsAppMemorialText(person);
                        openWhatsAppShare(text);
                      }
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                    title="Compartir datos por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Compartir por WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      onEdit(person);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-2 rounded-xl text-xs border border-slate-700 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar Datos</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
