import React from 'react';
import { 
  Users, 
  Heart, 
  UserCheck, 
  UserX, 
  Calendar, 
  TrendingUp, 
  Flame, 
  Activity, 
  Layers,
  Sparkles
} from 'lucide-react';
import { DemographicsResponse } from '../../types';

interface StatsDashboardProps {
  stats: DemographicsResponse;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const maxMonthly = Math.max(...stats.monthlyBirthCounts, 1);

  const livingPercent = stats.totalPersons > 0
    ? Math.round((stats.livingCount / stats.totalPersons) * 100)
    : 0;

  const deceasedPercent = 100 - livingPercent;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Miembros */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Linaje
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalPersons}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{stats.totalRelations} Vínculos Genealógicos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Vivos vs Fallecidos */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Familiares Vivos
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats.livingCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{livingPercent}% del total registrado</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* En Memoria */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              En Memoria
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats.deceasedCount}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{deceasedPercent}% antepasados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Longevidad Promedio */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Longevidad Promedio
            </span>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats.avgDeceasedLifespan ? `${stats.avgDeceasedLifespan}a` : '—'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Edad media vivos: {stats.avgLivingAge ? `${stats.avgLivingAge} años` : '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Gráficos y Desgloses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución de Nacimientos por Mes */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Frecuencia de Cumpleaños por Mes
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribución de natalicios en el calendario anual
            </p>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {stats.monthlyBirthCounts.map((count, idx) => {
              const heightPercent = Math.round((count / maxMonthly) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {count}
                  </span>
                  <div
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg shadow-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all relative"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">{monthNames[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribución por Género y Matrimonios */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              Distribución por Género & Uniones
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Equilibrio demográfico del linaje familiar
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Mujeres */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                <span className="text-pink-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  Mujeres
                </span>
                <span className="text-slate-300 font-mono">
                  {stats.genderDistribution.females} ({stats.totalPersons > 0 ? Math.round((stats.genderDistribution.females / stats.totalPersons) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{
                    width: `${stats.totalPersons > 0 ? (stats.genderDistribution.females / stats.totalPersons) * 100 : 0}%`,
                  }}
                  className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full"
                />
              </div>
            </div>

            {/* Hombres */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Hombres
                </span>
                <span className="text-slate-300 font-mono">
                  {stats.genderDistribution.males} ({stats.totalPersons > 0 ? Math.round((stats.genderDistribution.males / stats.totalPersons) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  style={{
                    width: `${stats.totalPersons > 0 ? (stats.genderDistribution.males / stats.totalPersons) * 100 : 0}%`,
                  }}
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full"
                />
              </div>
            </div>

            {/* Resumen Matrimonios */}
            <div className="mt-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Uniones Matrimoniales / Parejas</span>
              <span className="text-xs font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                💍 {stats.totalMarriages} Registradas
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
