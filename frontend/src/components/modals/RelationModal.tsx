import React, { useState, useEffect } from 'react';
import { X, Heart, Link, Users, Sparkles, UserPlus, Check, ArrowRight } from 'lucide-react';
import { Person, RelationType, SpouseType } from '../../types';
import { api } from '../../services/api';
import { formatFullName, formatPersonDropdownLabel } from '../../utils/genealogy';

export type RelationCategoryMode = 'PARENT' | 'CHILD' | 'SPOUSE';

interface RelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  defaultPersonId?: string | null;
  initialCategory?: RelationCategoryMode;
  onSuccess: () => void;
  onOpenRegisterPerson?: (preset?: string) => void;
}

export const RelationModal: React.FC<RelationModalProps> = ({
  isOpen,
  onClose,
  persons,
  defaultPersonId,
  initialCategory = 'PARENT',
  onSuccess,
  onOpenRegisterPerson,
}) => {
  const [categoryMode, setCategoryMode] = useState<RelationCategoryMode>(initialCategory);
  
  // Target person ID (the person selected as primary subject)
  const [primaryPersonId, setPrimaryPersonId] = useState<string>(defaultPersonId || '');
  
  // Relative person ID (the second person being linked)
  const [relativePersonId, setRelativePersonId] = useState<string>('');
  
  const [parentChildType, setParentChildType] = useState<RelationType>('BIOLOGICAL');
  const [spouseType, setSpouseType] = useState<SpouseType>('MARRIED');
  const [marriageDate, setMarriageDate] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategoryMode(initialCategory || 'PARENT');
      setPrimaryPersonId(defaultPersonId || (persons.length > 0 ? persons[0].id : ''));
      setRelativePersonId('');
      setErrorMsg(null);
    }
  }, [isOpen, defaultPersonId, initialCategory, persons]);

  if (!isOpen) return null;

  const primaryPerson = persons.find((p) => p.id === primaryPersonId);
  const relativePerson = persons.find((p) => p.id === relativePersonId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!primaryPersonId || !relativePersonId) {
      setErrorMsg('Por favor selecciona a ambas personas para crear el vínculo.');
      return;
    }
    if (primaryPersonId === relativePersonId) {
      setErrorMsg('No puedes vincular a una persona consigo misma.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (categoryMode === 'PARENT') {
        // Primary person is the CHILD, relative person is the PARENT
        await api.addParentChildRelation({
          parentId: relativePersonId,
          childId: primaryPersonId,
          type: parentChildType,
        });
      } else if (categoryMode === 'CHILD') {
        // Primary person is the PARENT, relative person is the CHILD
        await api.addParentChildRelation({
          parentId: primaryPersonId,
          childId: relativePersonId,
          type: parentChildType,
        });
      } else {
        // Spouse relation
        await api.addSpouseRelation({
          person1Id: primaryPersonId,
          person2Id: relativePersonId,
          type: spouseType,
          marriageDate: marriageDate || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la relación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPresetForCategory = () => {
    if (categoryMode === 'PARENT') return 'padre';
    if (categoryMode === 'CHILD') return 'hijo';
    return 'conyuge';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Link className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Vincular Parentesco Familiar</span>
            </h3>
            <p className="text-xs text-slate-400">
              Conecta de forma rápida y clara a dos personas en tu árbol genealógico
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Selector Visual de Vínculos (3 Opciones Grandes y Claras) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            1. Selecciona el tipo de vínculo que deseas agregar:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Opción 1: Agregar Padre / Madre */}
            <button
              type="button"
              onClick={() => {
                setCategoryMode('PARENT');
                setRelativePersonId('');
              }}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-1 ${
                categoryMode === 'PARENT'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Padre / Madre</span>
              </div>
              <span className={`text-[10px] font-medium leading-tight ${categoryMode === 'PARENT' ? 'text-slate-950/80' : 'text-slate-400'}`}>
                Añadir papá o mamá
              </span>
            </button>

            {/* Opción 2: Agregar Hijo / Hija */}
            <button
              type="button"
              onClick={() => {
                setCategoryMode('CHILD');
                setRelativePersonId('');
              }}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-1 ${
                categoryMode === 'CHILD'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Hijo / Hija</span>
              </div>
              <span className={`text-[10px] font-medium leading-tight ${categoryMode === 'CHILD' ? 'text-slate-950/80' : 'text-slate-400'}`}>
                Añadir descendiente
              </span>
            </button>

            {/* Opción 3: Agregar Cónyuge / Pareja */}
            <button
              type="button"
              onClick={() => {
                setCategoryMode('SPOUSE');
                setRelativePersonId('');
              }}
              className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-1 ${
                categoryMode === 'SPOUSE'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Heart className="w-4 h-4 shrink-0" />
                <span>Cónyuge / Pareja</span>
              </div>
              <span className={`text-[10px] font-medium leading-tight ${categoryMode === 'SPOUSE' ? 'text-slate-950/80' : 'text-slate-400'}`}>
                Añadir matrimonio
              </span>
            </button>

          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Formulario Dinámico Según Modo */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col gap-4">
            
            {/* Campo 1: Persona Principal */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {categoryMode === 'PARENT' && '¿A qué familiar le vamos a registrar el Padre o Madre?'}
                {categoryMode === 'CHILD' && '¿Quién es el Padre o Madre?'}
                {categoryMode === 'SPOUSE' && 'Primera Persona (Familiar):'}
                <span className="text-emerald-400 ml-1">*</span>
              </label>
              <select
                required
                value={primaryPersonId}
                onChange={(e) => setPrimaryPersonId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Seleccionar familiar por nombre completo...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPersonDropdownLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 2: Familiar a Vincular */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {categoryMode === 'PARENT' && `¿Quién es el Padre o Madre de ${primaryPerson ? formatFullName(primaryPerson) : 'este familiar'}?`}
                {categoryMode === 'CHILD' && `¿Quién es el Hijo o Hija de ${primaryPerson ? formatFullName(primaryPerson) : 'este familiar'}?`}
                {categoryMode === 'SPOUSE' && `¿Quién es la Pareja o Cónyuge de ${primaryPerson ? formatFullName(primaryPerson) : 'este familiar'}?`}
                <span className="text-emerald-400 ml-1">*</span>
              </label>
              <select
                required
                value={relativePersonId}
                onChange={(e) => setRelativePersonId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Seleccionar de la lista por nombre completo...</option>
                {persons
                  .filter((p) => p.id !== primaryPersonId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPersonDropdownLabel(p)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Opciones Adicionales de Tipo de Vínculo */}
            {categoryMode !== 'SPOUSE' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Tipo de Vínculo Filial:
                </label>
                <select
                  value={parentChildType}
                  onChange={(e) => setParentChildType(e.target.value as RelationType)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="BIOLOGICAL">Biológico / Consanguíneo (Por defecto)</option>
                  <option value="ADOPTIVE">Adoptivo</option>
                  <option value="FOSTER">Crianza / Tutoría</option>
                  <option value="STEP">Hijastro / Padrastro</option>
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Estado de Unión:
                  </label>
                  <select
                    value={spouseType}
                    onChange={(e) => setSpouseType(e.target.value as SpouseType)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MARRIED">Matrimonio</option>
                    <option value="PARTNER">Pareja de Hecho</option>
                    <option value="DIVORCED">Divorciados</option>
                    <option value="WIDOWED">Viudez</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Fecha de Boda (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1995-06-15"
                    value={marriageDate}
                    onChange={(e) => setMarriageDate(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Resumen Claro de Confirmación en Lenguaje Natural */}
          {primaryPerson && relativePerson && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <strong className="text-white">Resumen: </strong>
                {categoryMode === 'PARENT' && (
                  <span>
                    <strong>{formatFullName(relativePerson)}</strong> figurará como <strong className="text-emerald-400">{relativePerson.gender === 'FEMALE' ? 'MADRE' : 'PADRE'}</strong> de <strong>{formatFullName(primaryPerson)}</strong>.
                  </span>
                )}
                {categoryMode === 'CHILD' && (
                  <span>
                    <strong>{formatFullName(relativePerson)}</strong> figurará como <strong className="text-emerald-400">{relativePerson.gender === 'FEMALE' ? 'HIJA' : 'HIJO'}</strong> de <strong>{formatFullName(primaryPerson)}</strong>.
                  </span>
                )}
                {categoryMode === 'SPOUSE' && (
                  <span>
                    <strong>{formatFullName(primaryPerson)}</strong> y <strong>{formatFullName(relativePerson)}</strong> figurarán como <strong className="text-emerald-400">PAREJA / CÓNYUGES</strong>.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Botón "¿La persona no aparece en la lista?" */}
          {onOpenRegisterPerson && (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>💡</span> ¿No encuentras a la persona en la lista?
                </span>
                <p className="text-[11px] text-slate-400">
                  Puedes registrarla en 1 solo paso usando nuestro formulario rápido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterPerson(getPresetForCategory());
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>+ Registrar Nuevo Familiar</span>
              </button>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !primaryPersonId || !relativePersonId}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar y Guardar Vínculo'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
