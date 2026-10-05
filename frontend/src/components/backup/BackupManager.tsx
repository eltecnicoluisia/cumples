import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  FileJson, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BackupManagerProps {
  onDataImported: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  onDataImported,
  onShowToast,
}) => {
  const { isAuthenticated } = useAuth();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleJSONFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    if (!confirm('⚠️ Advertencia: Importar un respaldo sobrescribirá la base de datos actual con los datos del archivo. ¿Deseas continuar?')) {
      return;
    }

    try {
      setIsImporting(true);
      const text = await importFile.text();
      const parsed = JSON.parse(text);

      const res = await api.importJSONBackup(parsed);
      onShowToast('success', `Respaldo importado correctamente (${res.count} familiares cargados).`);
      setImportFile(null);
      onDataImported();
    } catch (err: any) {
      onShowToast('error', err.message || 'Error al procesar el archivo JSON');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Encabezado */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Gestión de Respaldos & Exportación Estándar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Descarga copias de seguridad criptográficas o exporta a software genealógico internacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SHA-256 Merkle Hash</span>
        </div>
      </div>

      {/* Opciones de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Respaldo JSON Completo */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <FileJson className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              Respaldo Integral JSON (CUMPLES)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Exporta la totalidad de personas, fechas de nacimiento/defunción, relaciones biológicas, matrimonios, biografías y metadatos con firma criptográfica de integridad SHA-256.
            </p>
          </div>

          <a
            href={api.exportJSONUrl()}
            download
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Respaldo JSON</span>
          </a>
        </div>

        {/* Card 2: Formato GEDCOM 5.5.1 */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between group hover:border-sky-500/40 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
              <FileText className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              Estándar Internacional GEDCOM 5.5.1 (.ged)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Compatible al 100% con plataformas de genealogía universales como MyHeritage, Ancestry, FamilySearch, Gramps y MacFamilyTree.
            </p>
          </div>

          <a
            href={api.exportGEDCOMUrl()}
            download
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Archivo GEDCOM</span>
          </a>
        </div>

      </div>

      {/* Sección de Restauración / Importación */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Restaurar Base de Datos desde Respaldo</h4>
            <p className="text-xs text-slate-400">
              Carga un archivo de respaldo previo en formato `.json` para restaurar todo el árbol
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs text-amber-300">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Inicia sesión como Administrador para poder restaurar o importar datos.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{importFile ? importFile.name : 'Seleccionar archivo .json'}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleJSONFileSelect}
                className="hidden"
                disabled={isImporting}
              />
            </label>

            {importFile && (
              <button
                onClick={handleImportSubmit}
                disabled={isImporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isImporting ? 'Importando...' : 'Iniciar Restauración'}</span>
              </button>
            )}

            <span className="text-[11px] text-slate-500">
              Solo archivos generados por CUMPLES
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
