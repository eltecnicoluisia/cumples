import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2, 
  Crown, 
  Layers, 
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  TrendingUp,
  X,
  Heart,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import { UserAdminItem, AdminPlatformStats, UserRole } from '../../types';
import { api } from '../../services/api';

interface AdminDashboardProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<UserAdminItem[]>([]);
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Crear/Editar Usuario
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAdminItem | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formFullName, setFormFullName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formRole, setFormRole] = useState<UserRole>('USER');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal Restablecer Contraseña
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserAdminItem | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);
      setUsers(usersRes.users);
      setStats(statsRes);
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al cargar panel administrativo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormPassword('');
    setFormFullName('');
    setFormPhone('');
    setFormRole('USER');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAdminItem) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPassword('');
    setFormFullName(user.fullName || '');
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setIsModalOpen(true);
  };

  // Abrir modal de restablecer contraseña
  const openResetPasswordModal = (user: UserAdminItem) => {
    setResetTargetUser(user);
    // Generar contraseña sugerida de 9 caracteres (1 mayúscula, 2+ números, cumple regla 8-10)
    const randomNum = Math.floor(10 + Math.random() * 90); // 2 dígitos
    const randomSuffix = Math.floor(10 + Math.random() * 90); // 2 dígitos
    setNewPassword(`Fam${randomNum}K${randomSuffix}`); // ej. Fam42K89 (8 caracteres)
    setShowPassword(true);
    setIsCopied(false);
    setIsResetModalOpen(true);
  };

  const generateRandomPassword = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const smalls = 'abcdefghijkmnpqrstuvwxyz';
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const s1 = smalls.charAt(Math.floor(Math.random() * smalls.length));
    const s2 = smalls.charAt(Math.floor(Math.random() * smalls.length));
    const s3 = smalls.charAt(Math.floor(Math.random() * smalls.length));
    const d1 = Math.floor(Math.random() * 10);
    const d2 = Math.floor(Math.random() * 10);
    const d3 = Math.floor(Math.random() * 10);
    const d4 = Math.floor(Math.random() * 10);
    setNewPassword(`${l1}${s1}${s2}${s3}${d1}${d2}${d3}${d4}`); // 8 caracteres, 1 mayúscula, 4 números
    setIsCopied(false);
  };

  const copyPasswordToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setIsCopied(true);
      onShowToast('info', 'Contraseña copiada al portapapeles');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onShowToast('warning', 'No se pudo copiar automáticamente');
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword.trim()) return;

    if (newPassword.trim().length < 6) {
      onShowToast('warning', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsResetting(true);
      await api.resetAdminUserPassword(resetTargetUser.id, newPassword.trim());
      onShowToast('success', `Contraseña de "${resetTargetUser.username}" restablecida correctamente.`);
      setIsResetModalOpen(false);
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al restablecer la contraseña');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingUser) {
        const payload: any = {
          fullName: formFullName.trim() || null,
          phone: formPhone.trim() || null,
          role: formRole,
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await api.updateAdminUser(editingUser.id, payload);
        onShowToast('success', `Usuario ${editingUser.username} actualizado`);
      } else {
        await api.createAdminUser({
          username: formUsername.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          fullName: formFullName.trim() || null,
          phone: formPhone.trim() || null,
          role: formRole,
          isActive: formIsActive,
        });
        onShowToast('success', `Usuario ${formUsername} registrado exitosamente`);
      }
      setIsModalOpen(false);
      loadAdminData();
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al guardar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar al usuario "${username}" y todo su árbol genealógico? Esta acción es irreversible.`)) {
      return;
    }
    try {
      await api.deleteAdminUser(id);
      onShowToast('success', `Usuario "${username}" eliminado correctamente.`);
      loadAdminData();
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al eliminar usuario');
    }
  };

  const handleToggleActive = async (user: UserAdminItem) => {
    try {
      await api.updateAdminUser(user.id, { isActive: !user.isActive });
      onShowToast('info', `Estado de "${user.username}" cambiado a ${!user.isActive ? 'Activo' : 'Inactivo'}`);
      loadAdminData();
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al cambiar estado');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchTerm.trim() !== '') {
        const full = `${u.username} ${u.email} ${u.fullName || ''} ${u.phone || ''}`.toLowerCase();
        if (!full.includes(searchTerm.toLowerCase())) return false;
      }
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      return true;
    });
  }, [users, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-300 min-w-0 overflow-hidden">
      
      {/* Header Panel Super Admin */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Panel de Administración de Usuarios</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold tracking-wider whitespace-nowrap">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control general de usuarios registrados, restablecimiento de contraseñas y estado de cuentas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            title="Recargar lista de usuarios"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Métricas de Comunidad */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Usuarios Registrados
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalUsers}</h3>
              <p className="text-xs text-emerald-400 mt-0.5 font-medium">{stats.activeUsers} Cuentas Activas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Total Familiares en Sistema
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalPersons}</h3>
              <p className="text-xs text-slate-400 mt-0.5">En todos los árboles genealógicos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Modo de la Plataforma
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-1">Gratuito</h3>
              <p className="text-xs text-slate-400 mt-0.5">Acceso Libre para Familias</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Heart className="w-6 h-6" />
            </div>
          </div>

        </div>
      )}

      {/* Tabla de Usuarios Registrados */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por usuario, correo, nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">Estado: Todos los usuarios</option>
              <option value="ACTIVE">🟢 Solo Activos</option>
              <option value="INACTIVE">🔴 Solo Inactivos</option>
            </select>
          </div>

        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Usuario / Nombre</th>
                <th className="py-3.5 px-4">Correo Electrónico</th>
                <th className="py-3.5 px-4">Teléfono</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">Árbol (Familiares)</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Fecha Registro</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    {isLoading ? 'Cargando usuarios...' : 'No se encontraron usuarios con los filtros seleccionados'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    
                    {/* Usuario & Nombre */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shadow-md ${
                          u.role === 'ADMIN' 
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950' 
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950'
                        }`}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 flex items-center gap-1.5">
                            {u.username}
                            {u.role === 'ADMIN' && (
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </p>
                          {u.fullName && (
                            <p className="text-[11px] text-slate-400">{u.fullName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {u.email}
                      </span>
                    </td>

                    {/* Teléfono */}
                    <td className="py-3.5 px-4">
                      {u.phone ? (
                        <span className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          {u.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Sin teléfono</span>
                      )}
                    </td>

                    {/* Rol */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {u.role === 'ADMIN' ? '👑 ADMIN' : 'FAMILIA'}
                      </span>
                    </td>

                    {/* Familiares Registrados */}
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-xs">
                        {u.totalRelatives} {u.totalRelatives === 1 ? 'familiar' : 'familiares'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.username === 'admin'}
                        title={u.username === 'admin' ? 'El admin principal siempre está activo' : 'Clic para activar o suspender acceso'}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>

                    {/* Fecha de Registro */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* Botón Restablecer Contraseña */}
                        <button
                          onClick={() => openResetPasswordModal(u)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                          title="Restablecer Contraseña"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Restablecer Clave</span>
                        </button>

                        {/* Botón Editar */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar información del usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar */}
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar usuario y su árbol"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Restablecer Contraseña Dedicado */}
      {isResetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-amber-500/40 shadow-2xl p-6 sm:p-8 relative bg-slate-900">
            
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Restablecer Contraseña
                </h3>
                <p className="text-xs text-slate-400">
                  Usuario: <span className="text-amber-300 font-bold">{resetTargetUser.username}</span> ({resetTargetUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nueva Contraseña para el Usuario
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-20 py-2.5 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title={showPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPasswordToClipboard}
                      className="p-1 text-slate-400 hover:text-amber-300"
                      title="Copiar contraseña"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar otra contraseña</span>
                </button>

                {isCopied && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copiada
                  </span>
                )}
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Al guardar, la contraseña anterior quedará invalidada inmediatamente y el usuario podrá iniciar sesión con esta nueva clave.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isResetting || !newPassword.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isResetting ? 'Guardando...' : 'Guardar Nueva Contraseña'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {editingUser ? `Editar Usuario: ${editingUser.username}` : 'Registrar Nuevo Usuario'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configura datos de acceso y permisos
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitUser} className="flex flex-col gap-4">
              
              {!editingUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nombre de Usuario <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="Ej. familia_perez"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Correo Electrónico <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="usuario@correo.com"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Ej. Carlos Pérez"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+58 412..."
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Rol de Usuario</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="USER">Usuario / Familia</option>
                  <option value="ADMIN">Super Administrador</option>
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Solo Lectura</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-slate-200">Cuenta Habilitada para acceder</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
