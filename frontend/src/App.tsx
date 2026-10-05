import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabType } from './components/layout/Navbar';
import { FamilyTreeCanvas } from './components/tree/FamilyTreeCanvas';
import { EventCalendar } from './components/events/EventCalendar';
import { FamilyDirectory } from './components/directory/FamilyDirectory';
import { StatsDashboard } from './components/stats/StatsDashboard';
import { BackupManager } from './components/backup/BackupManager';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { PersonModal } from './components/modals/PersonModal';
import { PersonDetailModal } from './components/modals/PersonDetailModal';
import { RelationModal } from './components/modals/RelationModal';
import { LoginModal } from './components/auth/LoginModal';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { TutorialModal } from './components/modals/TutorialModal';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { 
  Person, 
  TreeGraphData, 
  UpcomingEventsResponse, 
  DemographicsResponse,
  TreeItem
} from './types';
import { AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, showInactivityWarning, resetInactivityTimer, inactivityRemaining } = useAuth();

  // Estados de navegación y datos
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [persons, setPersons] = useState<Person[]>([]);
  const [treeData, setTreeData] = useState<TreeGraphData>({ nodes: [], parentChildEdges: [], spouseEdges: [] });
  const [eventsData, setEventsData] = useState<UpcomingEventsResponse>({
    today: new Date().toISOString().split('T')[0],
    totalBirthdays: 0,
    totalMemorials: 0,
    next7DaysBirthdays: [],
    next30DaysBirthdays: [],
    allBirthdays: [],
    allMemorials: [],
  });
  const [statsData, setStatsData] = useState<DemographicsResponse>({
    totalPersons: 0,
    livingCount: 0,
    deceasedCount: 0,
    genderDistribution: { males: 0, females: 0, others: 0 },
    totalRelations: 0,
    totalMarriages: 0,
    avgLivingAge: null,
    avgDeceasedLifespan: null,
    monthlyBirthCounts: Array(12).fill(0),
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Multi-Árboles
  const [trees, setTrees] = useState<TreeItem[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);

  // Modales
  const [isPersonModalOpen, setIsPersonModalOpen] = useState<boolean>(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personModalRolePreset, setPersonModalRolePreset] = useState<string>('abuelo_pat');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState<boolean>(false);
  const [relationDefaultPersonId, setRelationDefaultPersonId] = useState<string | null>(null);
  const [relationInitialCategory, setRelationInitialCategory] = useState<'PARENT' | 'CHILD' | 'SPOUSE'>('PARENT');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Carga general de datos de usuario autenticado
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || user?.role === 'ADMIN') return;
    try {
      setIsLoading(true);
      const [personsRes, treeRes, eventsRes, statsRes, treesRes] = await Promise.all([
        api.getPersons(),
        api.getTreeGraph(),
        api.getUpcomingEvents(),
        api.getDemographics(),
        api.getTrees(),
      ]);

      setPersons(personsRes.persons);
      setTreeData(treeRes);
      setEventsData(eventsRes);
      setStatsData(statsRes);
      setTrees(treesRes.trees);
      if (treesRes.trees.length > 0 && !activeTreeId) {
        setActiveTreeId(treesRes.trees[0].id);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role, activeTreeId, showToast]);

  const handleCreateTree = async (name: string, description?: string) => {
    try {
      const res = await api.createTree({ name, description });
      showToast('success', `Árbol "${res.tree.name}" creado exitosamente.`);
      setTrees((prev) => [...prev, res.tree]);
      setActiveTreeId(res.tree.id);
    } catch (err: any) {
      showToast('error', err.message || 'Error al crear árbol');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        setActiveTab('admin');
        setIsLoading(false);
      } else {
        loadUserData();
        if (activeTab === 'landing' || activeTab === 'admin') {
          setActiveTab('tree');
        }
        if (!localStorage.getItem('geneatrack_tutorial_seen')) {
          setIsTutorialOpen(true);
          localStorage.setItem('geneatrack_tutorial_seen', 'true');
        }
      }
    }
  }, [isAuthenticated, user?.role, loadUserData, activeTab]);

  // Manejo de guardado / edición de persona
  const handleSavePerson = async (data: Partial<Person>) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      throw new Error('Debes iniciar sesión para realizar cambios.');
    }

    if (editingPerson) {
      await api.updatePerson(editingPerson.id, data);
      showToast('success', `${data.firstName} ha sido actualizado correctamente.`);
    } else {
      await api.createPerson(data);
      showToast('success', `${data.firstName} ha sido añadido a tu árbol familiar.`);
    }
    await loadUserData();
  };

  const handleDeletePerson = async (id: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await api.deletePerson(id);
      showToast('success', 'Familiar eliminado del registro.');
      await loadUserData();
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notificaciones */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Alerta de Inactividad Próxima a Expirar */}
      {showInactivityWarning && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between z-50 shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Tu sesión expirará por inactividad en {Math.floor(inactivityRemaining / 60)}:
              {String(inactivityRemaining % 60).padStart(2, '0')} min.
            </span>
          </div>
          <button
            onClick={resetInactivityTimer}
            className="bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Mantener Sesión Activa
          </button>
        </div>
      )}

      {/* Barra de Navegación Principal */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddPerson={() => {
          setEditingPerson(null);
          setIsPersonModalOpen(true);
        }}
        onOpenLogin={() => {
          setLoginInitialRegister(false);
          setIsLoginModalOpen(true);
        }}
        onOpenRegister={() => {
          setLoginInitialRegister(true);
          setIsLoginModalOpen(true);
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalMembers={persons.length}
        eveAlertsCount={
          (eventsData.allBirthdays?.filter((b) => b.daysUntil === 1).length || 0) +
          (eventsData.allMemorials?.filter((m) => m.daysUntil === 1).length || 0) +
          (eventsData.allMarriages?.filter((m) => m.daysUntil === 1).length || 0) +
          (eventsData.allCustomEvents?.filter((c) => c.daysUntil === 1).length || 0)
        }
        todayAlertsCount={
          (eventsData.allBirthdays?.filter((b) => b.daysUntil === 0).length || 0) +
          (eventsData.allMemorials?.filter((m) => m.daysUntil === 0).length || 0) +
          (eventsData.allMarriages?.filter((m) => m.daysUntil === 0).length || 0) +
          (eventsData.allCustomEvents?.filter((c) => c.daysUntil === 0).length || 0)
        }
        trees={trees}
        activeTreeId={activeTreeId}
        onSelectTree={(id) => setActiveTreeId(id)}
        onCreateTree={handleCreateTree}
      />

      {/* Contenido Principal */}
      <main className="flex-1 w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 flex flex-col">
        {!isAuthenticated ? (
          <LandingPage
            onOpenRegister={() => {
              setLoginInitialRegister(true);
              setIsLoginModalOpen(true);
            }}
            onOpenLogin={() => {
              setLoginInitialRegister(false);
              setIsLoginModalOpen(true);
            }}
          />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-sm font-bold text-slate-300">Cargando tu árbol genealógico...</h3>
          </div>
        ) : user?.role === 'ADMIN' ? (
          <AdminDashboard onShowToast={showToast} />
        ) : (
          <>
            {activeTab === 'tree' && (
              <FamilyTreeCanvas
                treeData={treeData}
                onSelectPerson={(id) => setSelectedPersonId(id)}
                onAddRelative={(id) => {
                  setRelationDefaultPersonId(id);
                  setIsRelationModalOpen(true);
                }}
                onOpenAddPerson={() => {
                  setEditingPerson(null);
                  setPersonModalRolePreset('abuelo_pat');
                  setIsPersonModalOpen(true);
                }}
                onOpenAddPersonWithPreset={(preset) => {
                  setEditingPerson(null);
                  setPersonModalRolePreset(preset);
                  setIsPersonModalOpen(true);
                }}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'events' && (
              <EventCalendar
                eventsData={eventsData}
                onSelectPerson={(id) => setSelectedPersonId(id)}
              />
            )}

            {activeTab === 'directory' && (
              <FamilyDirectory
                persons={persons}
                onSelectPerson={(id) => setSelectedPersonId(id)}
                onEditPerson={(p) => {
                  setEditingPerson(p);
                  setIsPersonModalOpen(true);
                }}
                onDeletePerson={handleDeletePerson}
                onAddNew={() => {
                  setEditingPerson(null);
                  setPersonModalRolePreset('otro');
                  setIsPersonModalOpen(true);
                }}
              />
            )}

            {activeTab === 'stats' && <StatsDashboard stats={statsData} />}

            {activeTab === 'backup' && (
              <BackupManager
                onDataImported={loadUserData}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Modales */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => {
          setIsPersonModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        initialData={editingPerson}
        defaultRolePreset={personModalRolePreset}
      />

      <PersonDetailModal
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onEdit={(p) => {
          setSelectedPersonId(null);
          setEditingPerson(p);
          setIsPersonModalOpen(true);
        }}
        onDelete={handleDeletePerson}
        onOpenAddRelation={(personId, category) => {
          setRelationDefaultPersonId(personId);
          setRelationInitialCategory(category || 'PARENT');
          setIsRelationModalOpen(true);
        }}
        onSelectRelative={(relId) => setSelectedPersonId(relId)}
      />

      <RelationModal
        isOpen={isRelationModalOpen}
        onClose={() => {
          setIsRelationModalOpen(false);
          setRelationDefaultPersonId(null);
        }}
        persons={persons}
        defaultPersonId={relationDefaultPersonId}
        initialCategory={relationInitialCategory}
        onSuccess={() => {
          showToast('success', 'Vínculo familiar registrado exitosamente.');
          loadUserData();
        }}
        onOpenRegisterPerson={(preset) => {
          setEditingPerson(null);
          if (preset) setPersonModalRolePreset(preset);
          setIsPersonModalOpen(true);
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onShowToast={showToast}
        initialRegister={loginInitialRegister}
      />

      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />

      {/* Notificación Flotante / Banner para Instalar PWA en Móviles */}
      <PwaInstallPrompt />

    </div>
  );
};
