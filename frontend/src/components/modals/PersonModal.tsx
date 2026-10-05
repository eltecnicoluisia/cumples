import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  User, 
  MapPin, 
  Heart, 
  Phone, 
  Mail, 
  Briefcase, 
  Sparkles,
  Layers,
  Info,
  Copy,
  Zap,
  Check,
  Clipboard,
  Send
} from 'lucide-react';
import { Person, Gender } from '../../types';
import { api } from '../../services/api';
import { DatePickerField } from '../ui/DatePickerField';
import { calculateAgeDetails, getZodiacSign, formatFullName, SMART_FAMILY_TEMPLATE, parseSmartFamilyData, openWhatsAppShare } from '../../utils/genealogy';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Person>) => Promise<void>;
  initialData?: Person | null;
  defaultRolePreset?: string;
}

const FAMILY_ROLE_PRESETS = [ 
  { id: 'bisabuelo_pat', label: '👴🏼 Bisabuelo Paterno', gen: 0, gender: 'MALE' as Gender }, 
  { id: 'bisabuela_pat', label: '👵🏼 Bisabuela Paterna', gen: 0, gender: 'FEMALE' as Gender },
  { id: 'bisabuelo_mat', label: '👴🏼 Bisabuelo Materno', gen: 0, gender: 'MALE' as Gender }, 
  { id: 'bisabuela_mat', label: '👵🏼 Bisabuela Materna', gen: 0, gender: 'FEMALE' as Gender },
  { id: 'abuelo_pat', label: '👴 Abuelo Paterno', gen: 1, gender: 'MALE' as Gender },
  { id: 'abuela_pat', label: '👵 Abuela Paterna', gen: 1, gender: 'FEMALE' as Gender },
  { id: 'abuelo_mat', label: '👴 Abuelo Materno', gen: 1, gender: 'MALE' as Gender },
  { id: 'abuela_mat', label: '👵 Abuela Materna', gen: 1, gender: 'FEMALE' as Gender },
  { id: 'tio_pat', label: '👨🏽‍🦳 Tío Paterno', gen: 2, gender: 'MALE' as Gender },
  { id: 'tia_pat', label: '👩🏽‍🦳 Tía Paterna', gen: 2, gender: 'FEMALE' as Gender },
  { id: 'tio_mat', label: '👨🏽‍🦳 Tío Materno', gen: 2, gender: 'MALE' as Gender },
  { id: 'tia_mat', label: '👩🏽‍🦳 Tía Materna', gen: 2, gender: 'FEMALE' as Gender },
  { id: 'padre', label: '👨 Padre', gen: 2, gender: 'MALE' as Gender },
  { id: 'madre', label: '👩 Madre', gen: 2, gender: 'FEMALE' as Gender },
  { id: 'yo', label: '👤 Yo (Registrador)', gen: 3, gender: 'UNKNOWN' as Gender },
  { id: 'hermano', label: '👦 Hermano', gen: 3, gender: 'MALE' as Gender },
  { id: 'hermana', label: '👧 Hermana', gen: 3, gender: 'FEMALE' as Gender },
  { id: 'primo', label: '👦🏽 Primo / Prima', gen: 3, gender: 'UNKNOWN' as Gender },
  { id: 'sobrino', label: '🧒🏽 Sobrino / Sobrina', gen: 4, gender: 'UNKNOWN' as Gender },
  { id: 'conyuge', label: '💍 Cónyuge / Pareja', gen: 3, gender: 'UNKNOWN' as Gender },
  { id: 'suegro', label: '👴🏼 Suegro / Suegra', gen: 2, gender: 'UNKNOWN' as Gender },
  { id: 'cunado', label: '👨🏼‍🦱 Cuñado / Cuñada', gen: 3, gender: 'UNKNOWN' as Gender },
  { id: 'hijo', label: '👶 Hijo', gen: 4, gender: 'MALE' as Gender },
  { id: 'hija', label: '👧 Hija', gen: 4, gender: 'FEMALE' as Gender },
  { id: 'nieto', label: '🧒 Nieto / Nieta', gen: 5, gender: 'UNKNOWN' as Gender },
  { id: 'tatarabuelo', label: '👴🏽 Tatarabuelo', gen: -1, gender: 'MALE' as Gender },
  { id: 'tatarabuela', label: '👵🏽 Tatarabuela', gen: -1, gender: 'FEMALE' as Gender },
  { id: 'otro', label: '👥 Otro Familiar', gen: 3, gender: 'UNKNOWN' as Gender },
];

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultRolePreset,
}) => {
  const [firstName, setFirstName] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [secondLastName, setSecondLastName] = useState<string>('');
  const [maidenName, setMaidenName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [gender, setGender] = useState<Gender>('UNKNOWN');
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [birthDate, setBirthDate] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [deathDate, setDeathDate] = useState<string>('');
  const [deathPlace, setDeathPlace] = useState<string>('');
  const [burialPlace, setBurialPlace] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [biography, setBiography] = useState<string>('');
  const [generation, setGeneration] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<string>('otro');

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [smartSuccessMsg, setSmartSuccessMsg] = useState<string | null>(null);

  const handleCopyTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(SMART_FAMILY_TEMPLATE);
    setCopiedTemplate(true);
    setSmartSuccessMsg('¡Plantilla copiada! Envíasela a tu familiar por WhatsApp.');
    setTimeout(() => { setCopiedTemplate(false); setSmartSuccessMsg(null); }, 3500);
  };

  const [showSmartInput, setShowSmartInput] = useState(false);
  const [smartInputText, setSmartInputText] = useState('');

  const processTextData = (text: string) => {
    if (!text || !text.trim()) {
      setErrorMsg('Por favor pega el texto de datos antes de autocompletar.');
      return false;
    }

    const data = parseSmartFamilyData(text);
    let count = 0;

    if (data.firstName) { setFirstName(data.firstName); count++; }
    if (data.middleName) { setMiddleName(data.middleName); count++; }
    if (data.lastName) { setLastName(data.lastName); count++; }
    if (data.secondLastName) { setSecondLastName(data.secondLastName); count++; }
    if (data.nickname) { setNickname(data.nickname); count++; }
    if (data.gender) { setGender(data.gender); count++; }
    if (data.isAlive !== undefined) { setIsAlive(data.isAlive); }
    if (data.birthDate) { setBirthDate(data.birthDate); count++; }
    if (data.birthPlace) { setBirthPlace(data.birthPlace); count++; }
    if (data.deathDate) { setDeathDate(data.deathDate); count++; }
    if (data.profession) { setProfession(data.profession); count++; }
    if (data.contactPhone) { setContactPhone(data.contactPhone); count++; }
    if (data.contactEmail) { setContactEmail(data.contactEmail); count++; }
    if (data.biography) { setBiography(data.biography); count++; }

    if (count > 0) {
      setErrorMsg(null);
      setSmartSuccessMsg(`✨ ¡Se autocompletaron ${count} campos inteligentemente!`);
      setShowSmartInput(false);
      setSmartInputText('');
      setTimeout(() => setSmartSuccessMsg(null), 4000);
      return true;
    } else {
      setErrorMsg('No se detectaron campos reconocibles. Asegúrate de copiar el formulario o líneas con etiquetas (ej. Primer Nombre: Carmen, Fecha de Nacimiento: 14/08/1985).');
      return false;
    }
  };

  const handleSmartPaste = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText && clipboardText.trim()) {
          const ok = processTextData(clipboardText);
          if (ok) return;
        }
      }
    } catch (err) {
      // Bloqueo del navegador por HTTP o permisos -> Abrir caja de pegado directo
    }
    setShowSmartInput((prev) => !prev);
  };

  const handleSelectRolePreset = (roleId: string) => {
    setSelectedRole(roleId);
    const found = FAMILY_ROLE_PRESETS.find((r) => r.id === roleId);
    if (found) {
      setGeneration(found.gen);
      if (found.gender !== 'UNKNOWN') {
        setGender(found.gender);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFirstName(initialData.firstName || '');
      setMiddleName(initialData.middleName || '');
      setLastName(initialData.lastName || '');
      setSecondLastName(initialData.secondLastName || '');
      setMaidenName(initialData.maidenName || '');
      setNickname(initialData.nickname || '');
      setGender(initialData.gender || 'UNKNOWN');
      setIsAlive(initialData.isAlive ?? true);
      setBirthDate(initialData.birthDate || '');
      setBirthPlace(initialData.birthPlace || '');
      setDeathDate(initialData.deathDate || '');
      setDeathPlace(initialData.deathPlace || '');
      setBurialPlace(initialData.burialPlace || '');
      setAvatarUrl(initialData.avatarUrl || '');
      setProfession(initialData.profession || '');
      setContactPhone(initialData.contactPhone || '');
      setContactEmail(initialData.contactEmail || '');
      setBiography(initialData.biography || '');
      setGeneration(initialData.generation || 1);
      setSelectedRole(initialData.kinshipRole || 'otro');
    } else {
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setSecondLastName('');
      setMaidenName('');
      setNickname('');
      setGender('UNKNOWN');
      setIsAlive(true);
      setBirthDate('');
      setBirthPlace('');
      setDeathDate('');
      setDeathPlace('');
      setBurialPlace('');
      setAvatarUrl('');
      setProfession('');
      setContactPhone('');
      setContactEmail('');
      setBiography('');
      setGeneration(1);

      if (defaultRolePreset) {
        handleSelectRolePreset(defaultRolePreset);
      } else {
        setSelectedRole('abuelo_pat');
        handleSelectRolePreset('abuelo_pat');
      }
    }
    setErrorMsg(null);
  }, [initialData, isOpen, defaultRolePreset]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.uploadAvatar(file);
      setAvatarUrl(res.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir foto');
    } finally {
      setIsUploading(false);
    }
  };

  const ageDetails = calculateAgeDetails(birthDate, deathDate, isAlive);
  const zodiac = getZodiacSign(birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('El primer nombre y el primer apellido son obligatorios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        secondLastName: secondLastName.trim() || null,
        maidenName: maidenName.trim() || null,
        nickname: nickname.trim() || null,
        gender,
        isAlive: deathDate && deathDate.trim() !== '' ? false : isAlive,
        birthDate: birthDate.trim() || null,
        birthPlace: birthPlace.trim() || null,
        deathDate: deathDate.trim() || null,
        deathPlace: deathPlace.trim() || null,
        burialPlace: burialPlace.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        profession: profession.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        biography: biography.trim() || null,
        generation: Number(generation) || 1,
        kinshipRole: selectedRole || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar familiar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 my-8 relative max-h-[92vh] overflow-y-auto">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {initialData ? 'Editar Familiar' : 'Registrar Familiar'}
            </h3>
            <p className="text-xs text-slate-400">
              Datos personales, fechas exactas, lugar de nacimiento y estado vital
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* ⚡ Barra de Pegado Inteligente & Copia de Plantilla (Método Recomendado) */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/40 flex flex-col gap-3.5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-2 right-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wide uppercase shadow-md animate-pulse">
                🌟 ¡El Método Más Fácil!
              </span>
            </div>

            <div className="flex items-center gap-3 pr-20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <span>Autocompletado Inteligente con WhatsApp</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Envia la plantilla a tu familiar por WhatsApp y pega su respuesta en 1 solo clic para llenar todo automáticamente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* 1. Copiar Plantilla */}
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-md active:scale-95"
                title="Copiar formulario de preguntas para enviarlo a tu familiar"
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-sky-400 shrink-0" />}
                <span className="truncate">{copiedTemplate ? '¡Copiado!' : '1. Copiar Plantilla'}</span>
              </button>

              {/* 2. Pegar Datos */}
              <button
                type="button"
                onClick={handleSmartPaste}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                title="Leer portapapeles y autocompletar todas las casillas"
              >
                <Clipboard className="w-4 h-4 shrink-0" />
                <span className="truncate">2. Pegar Datos</span>
              </button>

              {/* 3. Enviar por WhatsApp */}
              <button
                type="button"
                onClick={() => openWhatsAppShare(SMART_FAMILY_TEMPLATE)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                title="Abrir WhatsApp directamente con la plantilla de registro"
              >
                <Send className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="truncate">3. Enviar por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Selector de Rol Familiar Rápido */}
          {!initialData && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>¿A quién estás registrando? (Guía de Parentesco)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {FAMILY_ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectRolePreset(preset.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left truncate ${
                      selectedRole === preset.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Caja de Pegado Directo (Fallback cuando el navegador bloquea clipboard API o se presiona Pegar) */}
          {showSmartInput && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/40 flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4" />
                  Pega el texto copiado aquí (Ctrl + V):
                </span>
                <button
                  type="button"
                  onClick={() => setShowSmartInput(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕ Cerrar
                </button>
              </div>
              <textarea
                rows={4}
                value={smartInputText}
                onChange={(e) => setSmartInputText(e.target.value)}
                placeholder={`Pega aquí los datos enviados por tu familiar...\nEjemplo:\nPrimer Nombre: Carmen\nSegundo Nombre: Elena\nPrimer Apellido: Uzcátegui\nFecha de Nacimiento: 14/08/1985`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-400 resize-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => processTextData(smartInputText)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Autocompletar Campos Ahora</span>
              </button>
            </div>
          )}

          {smartSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold animate-in fade-in">
              {smartSuccessMsg}
            </div>
          )}

          {/* Subida de Foto / Avatar */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Fotografía o Retrato
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isUploading ? 'Subiendo...' : 'Subir Imagen'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formatos JPG, PNG, WEBP</p>
            </div>
          </div>

          {/* Nombres: Primer Nombre y Segundo Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Primer Nombre <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej. José"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Segundo Nombre <span className="text-slate-500 text-[10px] font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Ej. Gregorio"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Apellidos: Primer Apellido y Segundo Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Primer Apellido <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. Uzcátegui"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Segundo Apellido <span className="text-slate-500 text-[10px] font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={secondLastName}
                onChange={(e) => setSecondLastName(e.target.value)}
                placeholder="Ej. Rondón"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Apellido de Soltera y Apodo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Apellido de Soltera <span className="text-slate-500 text-[10px] font-normal">(si aplica)</span>
              </label>
              <input
                type="text"
                value={maidenName}
                onChange={(e) => setMaidenName(e.target.value)}
                placeholder="Opcional"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Apodo o Nombre de Cariño
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej. 'Mita', 'Pepe', 'Cheo'"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Género, Generación y Estado Vital */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="MALE">Hombre</option>
                <option value="FEMALE">Mujer</option>
                <option value="OTHER">Otro</option>
                <option value="UNKNOWN">Sin especificar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nivel Generacional</label>
              <select
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>Gen 1 (Bisabuelos / Patriarcas)</option>
                <option value={2}>Gen 2 (Abuelos / Tronco)</option>
                <option value={3}>Gen 3 (Padres / Tíos / Titular)</option>
                <option value={4}>Gen 4 (Hijos / Primos)</option>
                <option value={5}>Gen 5 (Nietos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Estado Vital</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAlive(true);
                    setDeathDate('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    isAlive && (!deathDate || deathDate.trim() === '')
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Vivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlive(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    !isAlive || (deathDate && deathDate.trim() !== '')
                      ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-sm">🪽</span>
                  <span>Fallecido</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nacimiento: Fecha (Calendario selector Día, Mes, Año) y Lugar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
            <DatePickerField
              label="Fecha de Nacimiento"
              value={birthDate}
              onChange={(val) => setBirthDate(val)}
              showZodiac={true}
              helperText="Elige el día, mes y año de nacimiento. El signo zodiacal y la edad se calculan automáticamente."
            />

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lugar de Nacimiento</span>
              </label>
              <input
                type="text"
                placeholder="Ciudad, Estado, País (Ej. Caracas, Venezuela)"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Resumen de Edad para persona viva */}
            {isAlive && (!deathDate || deathDate.trim() === '') && ageDetails.currentAge !== null && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Edad actual: <strong className="text-emerald-200">{ageDetails.currentAge} años</strong></span>
              </div>
            )}
          </div>

          {/* Defunción: Alitas de ángel, Fecha y Cálculos */}
          {(!isAlive || (deathDate && deathDate.trim() !== '')) && (
            <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <span className="text-base">🪽</span>
                <span>Registro en Memoria (Fallecimiento)</span>
              </div>

              <DatePickerField
                label="Fecha de Fallecimiento"
                value={deathDate}
                onChange={(val) => {
                  setDeathDate(val);
                  if (val) setIsAlive(false);
                }}
                accentColor="purple"
                helperText="Selecciona el día, mes y año de partida."
              />

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Lugar de Fallecimiento</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mérida, Venezuela"
                  value={deathPlace}
                  onChange={(e) => setDeathPlace(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              {/* Indicadores de edad al fallecer y qué edad tendría hoy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {ageDetails.ageAtDeath !== null && (
                  <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
                    <span>🕊️</span>
                    <span>Edad al fallecer: <strong>{ageDetails.ageAtDeath} años</strong></span>
                  </div>
                )}
                {ageDetails.wouldBeAge !== null && (
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                    <span>✨</span>
                    <span>Tendría hoy: <strong>{ageDetails.wouldBeAge} años</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profesión y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>Profesión u Oficio</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Abogado, Docente"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Teléfono / WhatsApp</span>
              </label>
              <input
                type="text"
                placeholder="+58 412 1234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Correo Electrónico</span>
              </label>
              <input
                type="email"
                placeholder="familiar@correo.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Biografía / Anécdotas */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Biografía, Recuerdos & Anécdotas
            </label>
            <textarea
              rows={3}
              placeholder="Historias familiares, aficiones, anécdotas inolvidables..."
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : initialData ? 'Actualizar Familiar' : 'Registrar Familiar'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
