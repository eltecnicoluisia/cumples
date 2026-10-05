import React from 'react';
import { 
  Network, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Database, 
  Plus, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Clock, 
  Crown,
  Search,
  UserPlus,
  Lightbulb,
  FolderTree,
  ChevronDown,
  FolderPlus,
  Check,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TreeItem } from '../../types';
import { triggerPwaInstallModal } from '../pwa/PwaInstallPrompt';

export type TabType = 'tree' | 'events' | 'directory' | 'stats' | 'backup' | 'admin' | 'landing';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAddPerson: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenTutorial: () => void;
  onOpenPwaInstall?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalMembers: number;
  eveAlertsCount?: number;
  todayAlertsCount?: number;
  trees?: TreeItem[];
  activeTreeId?: string | null;
  onSelectTree?: (id: string) => void;
  onCreateTree?: (name: string, description?: string) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddPerson,
  onOpenLogin,
  onOpenRegister,
  onOpenTutorial,
  onOpenPwaInstall,
  searchQuery,
  setSearchQuery,
  totalMembers,
  eveAlertsCount = 0,
  todayAlertsCount = 0,
  trees = [],
  activeTreeId = null,
  onSelectTree,
  onCreateTree,
}) => {
  const { user, isAuthenticated, logout, inactivityRemaining, resetInactivityTimer } = useAuth();

  const [isTreeMenuOpen, setIsTreeMenuOpen] = React.useState(false);
  const [isCreateTreeModalOpen, setIsCreateTreeModalOpen] = React.useState(false);
  const [newTreeName, setNewTreeName] = React.useState('');
  const [isSubmittingTree, setIsSubmittingTree] = React.useState(false);

  const activeTree = trees.find(t => t.id === activeTreeId) || trees[0];
  const activeTreeName = activeTree?.name || 'Árbol Genealógico';

  const handleCreateTreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim() || !onCreateTree) return;
    try {
      setIsSubmittingTree(true);
      await onCreateTree(newTreeName.trim());
      setNewTreeName('');
      setIsCreateTreeModalOpen(false);
    } catch {
      // Handled in parent
    } finally {
      setIsSubmittingTree(false);
    }
  };

  const totalEventAlerts = eveAlertsCount + todayAlertsCount;
  const minutesRemaining = Math.floor(inactivityRemaining / 60);
  const secondsRemaining = inactivityRemaining % 60;
  const isTimeLow = inactivityRemaining <= 300; // Menos de 5 min

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 glass-panel">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Título */}
          <div className="flex items-center gap-3 shrink-0">
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center cursor-pointer"
              onClick={() => setActiveTab(isAuthenticated ? (user?.role === 'ADMIN' ? 'admin' : 'tree') : 'landing')}
            >
              <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                {user?.role === 'ADMIN' ? (
                  <Crown className="w-5 h-5 text-amber-400" />
                ) : (
                  <Network className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 cursor-pointer"
                  onClick={() => setActiveTab(isAuthenticated ? (user?.role === 'ADMIN' ? 'admin' : 'tree') : 'landing')}
                >
                  CUMPLES
                </span>
                
                {/* 🌳 Multi-Árbol Selector */}
                {isAuthenticated && user?.role !== 'ADMIN' && (
                  <div className="relative">
                    <button
                      onClick={() => setIsTreeMenuOpen(!isTreeMenuOpen)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-all shadow-sm"
                      title="Cambiar o Administrar Árboles Genealógicos"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="max-w-[130px] truncate">{activeTreeName}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Menú Desplegable de Árboles */}
                    {isTreeMenuOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in duration-150">
                        <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Tus Árboles Genealógicos
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {trees.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                onSelectTree?.(t.id);
                                setIsTreeMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                                t.id === activeTreeId || (!activeTreeId && t.isDefault)
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400'
                                  : 'text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FolderTree className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{t.name}</span>
                              </div>
                              {(t.id === activeTreeId || (!activeTreeId && t.isDefault)) && (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="p-1.5 border-t border-slate-800 bg-slate-950/60">
                          <button
                            onClick={() => {
                              setIsTreeMenuOpen(false);
                              setIsCreateTreeModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow"
                          >
                            <FolderPlus className="w-4 h-4" />
                            <span>+ Crear Nuevo Árbol</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {user?.role === 'ADMIN'
                  ? 'Panel de Control de Usuarios'
                  : isAuthenticated
                  ? `${totalMembers} Familiares en tu Árbol`
                  : 'Memoria & Linaje Familiar'}
              </p>
            </div>
          </div>

          {/* Navegación Principal (Solo si está autenticado y NO es admin) */}
          {isAuthenticated && user?.role !== 'ADMIN' ? (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('tree')}
                className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'tree'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Árbol"
              >
                <Network className="w-4 h-4 shrink-0" />
                <span className="hidden 2xl:inline">Árbol</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`relative flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'events'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Cumpleaños"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="hidden 2xl:inline">Cumpleaños</span>
                {totalEventAlerts > 0 && (
                  <span 
                    title={`${todayAlertsCount > 0 ? `${todayAlertsCount} hoy` : ''} ${eveAlertsCount > 0 ? `${eveAlertsCount} mañana (1 día antes)` : ''}`}
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                      todayAlertsCount > 0 
                        ? 'bg-rose-500 text-white animate-bounce' 
                        : 'bg-amber-400 text-slate-950 animate-pulse'
                    }`}
                  >
                    {totalEventAlerts}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'directory'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Directorio"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden 2xl:inline">Directorio</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Estadísticas"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="hidden 2xl:inline">Estadísticas</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'backup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Respaldos"
              >
                <Database className="w-4 h-4 shrink-0" />
                <span className="hidden 2xl:inline">Respaldos</span>
              </button>
            </nav>
          ) : isAuthenticated && user?.role === 'ADMIN' ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Modo Super Administrador Activo</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-slate-400">
                La plataforma #1 para la memoria y cumpleaños de tu familia
              </span>
            </div>
          )}

          {/* Acciones Rápidas & Usuario */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {isAuthenticated ? (
              <>
                {user?.role !== 'ADMIN' && (
                  <>
                    {/* Buscador Rápido (solo en pantallas grandes 2xl) */}
                    <div className="relative hidden 2xl:block w-32 shrink-0">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Botón Añadir Familiar */}
                    <button
                      onClick={onOpenAddPerson}
                      className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                      title="Añadir un nuevo familiar al árbol"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span className="hidden 2xl:inline">+ Nuevo Familiar</span>
                    </button>

                    {/* Botón Manual de Uso */}
                    <button
                      onClick={onOpenTutorial}
                      title="Manual de Uso de CUMPLES"
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-amber-500/30 transition-all cursor-pointer shrink-0 shadow-md"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="hidden 2xl:inline">Manual de Uso</span>
                    </button>

                    {/* Botón Instalar App */}
                    <button
                      onClick={onOpenPwaInstall || triggerPwaInstallModal}
                      title="Instalar Aplicación CUMPLES en Celular o Computadora"
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-emerald-500/30 transition-all cursor-pointer shrink-0 shadow-md"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="hidden 2xl:inline">Instalar App</span>
                    </button>
                  </>
                )}

                {/* Temporizador de Inactividad */}
                <button
                  onClick={resetInactivityTimer}
                  title="Tiempo restante de sesión. Clic para renovar."
                  className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono transition-all shrink-0 ${
                    isTimeLow
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="font-mono text-[11px] font-bold">
                    {String(minutesRemaining).padStart(2, '0')}:{String(secondsRemaining).padStart(2, '0')}
                  </span>
                </button>

                {/* Badge Usuario & Logout */}
                <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800 shrink-0">
                  <div className="hidden xl:flex flex-col items-end shrink-0 max-w-[95px]">
                    <span className="text-xs font-bold text-slate-200 truncate w-full text-right" title={user?.username}>
                      {user?.username}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${user?.role === 'ADMIN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {user?.role === 'ADMIN' ? '👑 Admin' : 'Familia'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Cerrar sesión"
                    className="flex items-center gap-1 px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden 2xl:inline">Salir</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenPwaInstall || triggerPwaInstallModal}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                  title="Instalar CUMPLES en tu celular o PC"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Instalar App</span>
                </button>

                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>

                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarme</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Tabs Mobile (si está autenticado y no es ADMIN) */}
      {isAuthenticated && user?.role !== 'ADMIN' && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/95 py-2 px-2 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-semibold shrink-0 ${
              activeTab === 'tree' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <Network className="w-4 h-4" />
            Árbol
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-semibold shrink-0 ${
              activeTab === 'events' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <CalendarDays className="w-4 h-4" />
              {totalEventAlerts > 0 && (
                <span className={`absolute -top-1 -right-2 px-1 rounded-full text-[8px] font-black leading-tight ${
                  todayAlertsCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'
                }`}>
                  {totalEventAlerts}
                </span>
              )}
            </div>
            <span>Cumples</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-semibold shrink-0 ${
              activeTab === 'directory' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            Directorio
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-semibold shrink-0 ${
              activeTab === 'stats' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-semibold shrink-0 ${
              activeTab === 'backup' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
            }`}
          >
            <Database className="w-4 h-4" />
            Respaldos
          </button>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-md text-[10px] font-bold text-rose-400 bg-rose-500/10 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      )}

      {/* Modal Crear Nuevo Árbol */}
      {isCreateTreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Crear Nuevo Árbol Genealógico</h3>
                <p className="text-xs text-slate-400">Organiza tu linaje paterno, materno o familias por separado.</p>
              </div>
            </div>

            <form onSubmit={handleCreateTreeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre del Árbol <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Linaje Paterno Uzcátegui, Familia Materna Olivo..."
                  value={newTreeName}
                  onChange={(e) => setNewTreeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTreeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTree || !newTreeName.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                >
                  {isSubmittingTree ? 'Creando...' : 'Crear Árbol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

