import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Lock, 
  LogIn, 
  UserPlus, 
  Phone, 
  User as UserIcon,
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Send,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  initialRegister?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  initialRegister = false,
}) => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(initialRegister);
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(false);
  const [unregisteredUser, setUnregisteredUser] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsRegisterMode(initialRegister);
    setIsForgotMode(false);
    setUnregisteredUser(null);
    setErrorMsg(null);
    setPassword('');
    setPhone('');
    setFullName('');
    setLoginIdentifier('');
    setForgotIdentifier('');
  }, [initialRegister, isOpen]);

  // Manejo de entrada de teléfono (solo números, max 11 dígitos)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(numericOnly);
  };

  // Validación en tiempo real del Semáforo de Contraseña
  const passwordRules = useMemo(() => {
    const lengthValid = password.length >= 8 && password.length <= 10;
    const uppercaseValid = /[A-Z]/.test(password);
    const numbersCount = (password.match(/[0-9]/g) || []).length;
    const numbersValid = numbersCount >= 2;

    const totalPassed = (lengthValid ? 1 : 0) + (uppercaseValid ? 1 : 0) + (numbersValid ? 1 : 0);
    const isAllValid = lengthValid && uppercaseValid && numbersValid;

    let trafficStatus: 'EMPTY' | 'RED' | 'YELLOW' | 'GREEN' = 'EMPTY';
    if (password.length > 0) {
      if (isAllValid) {
        trafficStatus = 'GREEN';
      } else if (totalPassed >= 1) {
        trafficStatus = 'YELLOW';
      } else {
        trafficStatus = 'RED';
      }
    }

    return {
      lengthValid,
      uppercaseValid,
      numbersValid,
      numbersCount,
      totalPassed,
      isAllValid,
      trafficStatus,
    };
  }, [password]);

  const isFormValid = useMemo(() => {
    if (isRegisterMode) {
      return phone.length === 11 && fullName.trim().length >= 3 && passwordRules.isAllValid;
    }
    return loginIdentifier.trim().length >= 3 && password.length >= 1;
  }, [isRegisterMode, phone, fullName, passwordRules.isAllValid, loginIdentifier, password]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setIsSubmitting(true);
      if (isRegisterMode) {
        if (phone.length !== 11) {
          setErrorMsg('El número de celular debe contener exactamente 11 números (ej. 04121234567)');
          return;
        }

        if (fullName.trim().length < 3) {
          setErrorMsg('Por favor ingresa tu Nombre y Apellido completo');
          return;
        }

        if (!passwordRules.isAllValid) {
          setErrorMsg('La contraseña debe cumplir con todas las normas del semáforo (mínimo 8 y máximo 10 caracteres, 1 mayúscula y 2 números)');
          return;
        }

        await register(phone.trim(), fullName.trim(), password);
        onShowToast('success', `¡Bienvenido ${fullName.trim()}! Tu árbol genealógico ha sido creado.`);
      } else {
        if (!loginIdentifier.trim()) {
          setErrorMsg('Por favor ingresa tu número de celular o usuario');
          return;
        }
        await login(loginIdentifier.trim(), password, remember);
        onShowToast('success', `¡Bienvenido de nuevo!`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUnregisteredUser(null);

    if (!forgotIdentifier.trim()) {
      setErrorMsg('Por favor ingresa tu número de celular o usuario registrado');
      return;
    }

    const cleanId = forgotIdentifier.trim();

    try {
      setIsCheckingUser(true);
      const checkRes = await api.checkUserExists(cleanId);

      if (!checkRes.exists) {
        setUnregisteredUser(cleanId);
        return;
      }

      const todayDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const text =
        `🔐 *SOLICITUD DE RESTABLECIMIENTO DE CONTRASEÑA (CUMPLES)*\n` +
        `----------------------------------------\n` +
        `Hola Administrador de CUMPLES, he olvidado mi contraseña y requiero ayuda para restablecer el acceso a mi cuenta.\n\n` +
        `👤 *Usuario / Celular registrado:* ${cleanId}\n` +
        `🗓️ *Fecha de solicitud:* ${todayDate}\n` +
        `----------------------------------------\n` +
        `Por favor, ayúdame a verificar mi cuenta y asignarme una nueva clave de acceso. ¡Gracias!`;

      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?phone=584242964339&text=${encoded}`, '_blank');
      onShowToast('info', 'Solicitud enviada a WhatsApp (04242964339). El Administrador procesará tu clave.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al verificar el usuario en el sistema');
    } finally {
      setIsCheckingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative bg-slate-900/95">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isForgotMode ? (
          /* MODO RESTABLECER CONTRASEÑA POR WHATSAPP */
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Restablecer Contraseña
                </h3>
                <p className="text-xs text-slate-400">
                  Verificación de cuenta y asistencia por WhatsApp
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {unregisteredUser ? (
              /* ALERTA TÉCNICA SUTIL DE USUARIO NO REGISTRADO */
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Usuario o Celular No Registrado</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      El identificador <span className="font-mono font-bold text-amber-300">{unregisteredUser}</span> no se encuentra registrado en nuestra base de datos.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setIsRegisterMode(true);
                      setPhone(unregisteredUser.replace(/\D/g, '').slice(0, 11));
                      setUnregisteredUser(null);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>🌱 Registrarme Gratis con este Número</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUnregisteredUser(null)}
                    className="text-[11px] text-slate-400 hover:text-white text-center py-1 font-semibold cursor-pointer transition-colors"
                  >
                    Intentar con otro usuario o número
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULARIO DE RESTABLECER */
              <form onSubmit={handleSendWhatsAppReset} className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col gap-3">
                  <label className="block text-xs font-bold text-slate-300">
                    Número de Celular o Usuario Registrado <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 04121234567 o tu usuario"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    El sistema verificará la existencia de tu cuenta antes de conectar con la línea de soporte oficial (<b>04242964339</b>).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isCheckingUser || !forgotIdentifier.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>{isCheckingUser ? 'Verificando Cuenta...' : 'Solicitar Restablecimiento por WhatsApp'}</span>
                </button>

                <div className="text-center pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al Inicio de Sesión</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* MODO INICIO DE SESIÓN / REGISTRO NORMAL */
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                {isRegisterMode ? <Smartphone className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {isRegisterMode ? 'Crear mi Árbol Familiar' : 'Acceso a mi Árbol'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRegisterMode ? 'Registro gratuito para guardar tus familiares' : 'Inicia sesión con tu número de celular o usuario'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isRegisterMode ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Número de Celular (Será tu Usuario) <span className="text-emerald-400">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold ${
                        phone.length === 11 ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {phone.length}/11 dígitos
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="Ej. 04121234567 (11 números sin símbolos)"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ingresa exactamente los 11 dígitos de tu número celular sin guiones ni espacios.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nombre y Apellido del Registrador <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Luis Uzcátegui"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Número de Celular o Usuario
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 04121234567 o usuario"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Contraseña <span className="text-emerald-400">*</span>
                  </label>
                  {isRegisterMode && (
                    <span className={`text-[10px] font-mono font-bold ${
                      passwordRules.lengthValid ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {password.length}/10 caracteres
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={isRegisterMode ? 10 : 30}
                    placeholder={isRegisterMode ? "Mín. 8, máx. 10 con 1 mayús. y 2 núm." : "Ingresa tu contraseña"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-xl pl-3.5 pr-12 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                      isRegisterMode
                        ? passwordRules.trafficStatus === 'GREEN'
                          ? 'border-emerald-500 shadow-sm shadow-emerald-500/20'
                          : passwordRules.trafficStatus === 'YELLOW'
                          ? 'border-amber-500'
                          : passwordRules.trafficStatus === 'RED'
                          ? 'border-rose-500'
                          : 'border-slate-800 focus:border-emerald-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer border border-slate-800"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                        <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                          passwordRules.trafficStatus === 'RED' ? 'bg-rose-500 shadow-md shadow-rose-500/60 scale-125 animate-pulse' : 'bg-rose-950 opacity-40'
                        }`} />
                        <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                          passwordRules.trafficStatus === 'YELLOW' ? 'bg-amber-400 shadow-md shadow-amber-400/60 scale-125 animate-pulse' : 'bg-amber-950 opacity-40'
                        }`} />
                        <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                          passwordRules.trafficStatus === 'GREEN' ? 'bg-emerald-400 shadow-md shadow-emerald-400/60 scale-125 animate-pulse' : 'bg-emerald-950 opacity-40'
                        }`} />
                      </div>
                      <span className="text-xs font-bold text-slate-200">Semáforo de Contraseña</span>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      passwordRules.trafficStatus === 'GREEN' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      passwordRules.trafficStatus === 'YELLOW' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      passwordRules.trafficStatus === 'RED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      {passwordRules.trafficStatus === 'GREEN' ? '🟢 Contraseña Válida' :
                       passwordRules.trafficStatus === 'YELLOW' ? '🟡 En Progreso' :
                       passwordRules.trafficStatus === 'RED' ? '🔴 No Cumple' : '⚪ Ingresa tu Clave'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className={`flex items-center gap-2 transition-colors ${passwordRules.lengthValid ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] shrink-0 ${passwordRules.lengthValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'border-slate-700 text-slate-600'}`}>
                        {passwordRules.lengthValid ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                      </div>
                      <span>Mínimo 8 y máximo 10 dígitos/caracteres ({password.length}/10)</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-colors ${passwordRules.uppercaseValid ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] shrink-0 ${passwordRules.uppercaseValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'border-slate-700 text-slate-600'}`}>
                        {passwordRules.uppercaseValid ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
                      </div>
                      <span>Al menos 1 letra mayúscula (ej. A, B, C...)</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-colors ${passwordRules.numbersValid ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] shrink-0 ${passwordRules.numbersValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'border-slate-700 text-slate-600'}`}>
                        {passwordRules.numbersValid ? <Check className="w-3 h-3 stroke-[3]" /> : '3'}
                      </div>
                      <span>Al menos 2 números ({passwordRules.numbersCount}/2)</span>
                    </div>
                  </div>
                </div>
              )}

              {!isRegisterMode && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Recordar sesión</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotIdentifier(loginIdentifier || '');
                      setUnregisteredUser(null);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-xs shadow-lg transition-all mt-2 cursor-pointer ${
                  !isFormValid
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 hover:scale-[1.01]'
                }`}
              >
                {isRegisterMode ? <UserPlus className="w-4 h-4 stroke-[3]" /> : <LogIn className="w-4 h-4 stroke-[3]" />}
                <span>
                  {isSubmitting 
                    ? 'Procesando...' 
                    : isRegisterMode 
                    ? 'Registrarme y Crear mi Árbol' 
                    : 'Iniciar Sesión'}
                </span>
              </button>

              <div className="text-center mt-2 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                {isRegisterMode ? (
                  <p>
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(false)}
                      className="text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Inicia sesión aquí
                    </button>
                  </p>
                ) : (
                  <p>
                    ¿Aún no tienes árbol registrado?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(true)}
                      className="text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Regístrate gratis con tu celular aquí
                    </button>
                  </p>
                )}
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
