import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Calendar, 
  Scale, 
  ListTodo, 
  UtensilsCrossed, 
  Users, 
  Plus, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isSameDay, startOfWeek, addDays, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AppState, Person, Task, MealPlan, TimeOfDay, TaskBlock, PersonType } from './types';
import { SAMPLE_PERSONS, SAMPLE_TASKS, generateSampleMealPlan, CATEGORIES, PERSON_TYPE_LABELS } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'hoy' | 'semana' | 'reparto' | 'tareas' | 'menu' | 'personas';

export default function App() {
  // --- STATE ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('casajuntos_state');
    if (saved) return JSON.parse(saved);
    return {
      persons: SAMPLE_PERSONS,
      tasks: SAMPLE_TASKS,
      mealPlan: generateSampleMealPlan(),
      shoppingList: ['Leche', 'Huevos', 'Pan', 'Fruta variada']
    };
  });

  const [activeTab, setActiveTab] = useState<Tab>('hoy');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('casajuntos_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- HELPERS ---
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  const toggleTaskCompletion = (taskId: string, date: string) => {
    updateState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          const isCompleted = t.completedDates.includes(date);
          return {
            ...t,
            completedDates: isCompleted 
              ? t.completedDates.filter(d => d !== date)
              : [...t.completedDates, date]
          };
        }
        return t;
      })
    }));
  };

  const deleteTask = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Tarea',
      message: '¿Estás seguro de que quieres eliminar esta tarea?',
      onConfirm: () => {
        updateState(prev => ({
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== id)
        }));
        setConfirmConfig(null);
      }
    });
  };

  const deletePerson = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Persona',
      message: '¿Estás seguro de que quieres eliminar a esta persona? Se eliminará de todas las tareas asignadas.',
      onConfirm: () => {
        updateState(prev => ({
          ...prev,
          persons: prev.persons.filter(p => p.id !== id),
          tasks: prev.tasks.map(t => ({
            ...t,
            assignedTo: t.assignedTo.filter(pid => pid !== id),
            forWhom: t.forWhom?.filter(pid => pid !== id)
          }))
        }));
        setConfirmConfig(null);
      }
    });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casajuntos_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setState(imported);
        alert('Datos importados correctamente');
      } catch (err) {
        alert('Error al importar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'BORRAR TODO',
      message: '¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.',
      onConfirm: () => {
        localStorage.removeItem('casajuntos_state');
        window.location.reload();
      }
    });
  };

  // --- RENDER VIEWS ---
  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-[240px] transition-colors duration-300">
      {/* Sidebar / Desktop Nav */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-sidebar border-r border-border hidden md:flex flex-col p-8 z-50">
        <div className="flex items-center gap-3 mb-10">
          <div className="text-3xl">🏡</div>
          <h1 className="text-2xl font-serif text-primary">CasaJuntos</h1>
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem active={activeTab === 'hoy'} onClick={() => setActiveTab('hoy')} icon={<span>🏠</span>} label="Hoy" />
          <NavItem active={activeTab === 'semana'} onClick={() => setActiveTab('semana')} icon={<span>📅</span>} label="Semana" />
          <NavItem active={activeTab === 'reparto'} onClick={() => setActiveTab('reparto')} icon={<span>⚖️</span>} label="Reparto" />
          <NavItem active={activeTab === 'tareas'} onClick={() => setActiveTab('tareas')} icon={<span>📋</span>} label="Tareas" />
          <NavItem active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} icon={<span>🍽️</span>} label="Menú" />
          <NavItem active={activeTab === 'personas'} onClick={() => setActiveTab('personas')} icon={<span>👥</span>} label="Familia" />
        </nav>

        <div className="mt-auto pt-6 border-t border-border space-y-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-cream transition-colors text-sm font-medium text-text-light">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <div className="flex gap-2">
            <button onClick={exportData} title="Exportar JSON" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Download size={18} />
            </button>
            <label className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer">
              <Upload size={18} />
              <input type="file" className="hidden" onChange={importData} accept=".json" />
            </label>
            <button onClick={clearAll} title="Borrar todo" className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sidebar/90 backdrop-blur-md border-t border-border flex justify-around p-3 md:hidden z-50">
        <MobileNavItem active={activeTab === 'hoy'} onClick={() => setActiveTab('hoy')} icon={<span>🏠</span>} label="Hoy" />
        <MobileNavItem active={activeTab === 'semana'} onClick={() => setActiveTab('semana')} icon={<span>📅</span>} label="Semana" />
        <MobileNavItem active={activeTab === 'reparto'} onClick={() => setActiveTab('reparto')} icon={<span>⚖️</span>} label="Reparto" />
        <MobileNavItem active={activeTab === 'tareas'} onClick={() => setActiveTab('tareas')} icon={<span>📋</span>} label="Tareas" />
        <MobileNavItem active={activeTab === 'personas'} onClick={() => setActiveTab('personas')} icon={<span>👥</span>} label="Hogar" />
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'hoy' && (
            <HoyView 
              state={state} 
              onToggle={toggleTaskCompletion} 
              onEditTask={(t) => { setEditingTask(t); setShowTaskModal(true); }}
              onEditMenu={() => setActiveTab('menu')}
            />
          )}
          {activeTab === 'semana' && <SemanaView state={state} onToggle={toggleTaskCompletion} />}
          {activeTab === 'reparto' && <RepartoView state={state} />}
          {activeTab === 'tareas' && (
            <TareasView 
              state={state} 
              onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} 
              onDelete={deleteTask} 
              onAdd={() => { setEditingTask(null); setShowTaskModal(true); }}
            />
          )}
          {activeTab === 'menu' && <MenuView state={state} updateState={updateState} />}
          {activeTab === 'personas' && (
            <PersonasView 
              state={state} 
              onEdit={(p) => { setEditingPerson(p); setShowPersonModal(true); }} 
              onDelete={deletePerson}
              onAdd={() => { setEditingPerson(null); setShowPersonModal(true); }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <PersonModal 
        isOpen={showPersonModal} 
        onClose={() => setShowPersonModal(false)} 
        person={editingPerson} 
        onSave={(p) => {
          updateState(prev => ({
            ...prev,
            persons: editingPerson 
              ? prev.persons.map(item => item.id === p.id ? p : item)
              : [...prev.persons, p]
          }));
          setShowPersonModal(false);
        }}
      />

      <TaskModal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
        task={editingTask} 
        persons={state.persons}
        onSave={(t) => {
          updateState(prev => ({
            ...prev,
            tasks: editingTask 
              ? prev.tasks.map(item => item.id === t.id ? t : item)
              : [...prev.tasks, t]
          }));
          setShowTaskModal(false);
        }}
      />

      <ConfirmModal 
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        onConfirm={() => confirmConfig?.onConfirm()}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 font-medium",
        active 
          ? "bg-cream text-primary shadow-sm" 
          : "text-text-light hover:bg-cream/50 hover:text-text dark:text-white/60 dark:hover:text-white"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all relative py-1 px-3 rounded-xl",
        active ? "text-primary bg-primary/5" : "text-text-light/40 dark:text-white/40"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="mobile-nav-indicator"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

// --- VIEWS ---

function HoyView({ state, onToggle, onEditTask, onEditMenu }: { state: AppState, onToggle: (id: string, date: string) => void, onEditTask: (t: Task) => void, onEditMenu: () => void }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = getDay(new Date());

  const tasksForToday = useMemo(() => {
    return state.tasks.filter(t => {
      if (t.frequency === 'diaria') return true;
      if (t.frequency === 'dias_especificos' && t.specificDays?.includes(dayOfWeek)) return true;
      if (t.frequency === 'puntual' && t.date === todayStr) return true;
      if (t.frequency === 'semanal' && t.specificDays?.includes(dayOfWeek)) return true;
      return false;
    }).sort((a, b) => {
      const order = { 'mañana': 0, 'mediodía': 1, 'tarde': 2, 'noche': 3 };
      return order[a.timeOfDay] - order[b.timeOfDay];
    });
  }, [state.tasks, dayOfWeek, todayStr]);

  const progress = useMemo(() => {
    if (tasksForToday.length === 0) return 0;
    const completed = tasksForToday.filter(t => t.completedDates.includes(todayStr)).length;
    return Math.round((completed / tasksForToday.length) * 100);
  }, [tasksForToday, todayStr]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TimeOfDay, Task[]> = { 'mañana': [], 'mediodía': [], 'tarde': [], 'noche': [] };
    tasksForToday.forEach(t => groups[t.timeOfDay].push(t));
    return groups;
  }, [tasksForToday]);

  const todayMeal = state.mealPlan[todayStr] || { almuerzo: 'No planificado', merienda: 'No planificado', cena: 'No planificado', cookId: '' };
  const cook = state.persons.find(p => p.id === todayMeal.cookId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center justify-between md:block">
          <div>
            <p className="text-text-light font-medium uppercase tracking-widest text-[10px] mb-1">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
            <h2 className="text-4xl text-primary">¡Hola, familia!</h2>
          </div>
          <div className="md:hidden">
            <div className="w-14 h-14 rounded-full border-4 border-bg flex items-center justify-center relative bg-white shadow-sm">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" 
                  className="text-primary" 
                  strokeDasharray={150.7} 
                  strokeDashoffset={150.7 - (150.7 * (progress / 100))} 
                />
              </svg>
              <span className="absolute text-xs font-bold text-primary">{progress}%</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex bg-white px-6 py-3 rounded-2xl border border-border shadow-sm items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-text-light font-bold uppercase mb-1">Progreso diario</p>
            <p className="text-lg font-bold text-primary">
              {tasksForToday.filter(t => t.completedDates.includes(todayStr)).length} / {tasksForToday.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-bg flex items-center justify-center relative">
            <svg className="w-full h-full -rotate-90">
              <circle 
                cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" 
                className="text-primary" 
                strokeDasharray={125.6} 
                strokeDashoffset={125.6 - (125.6 * (progress / 100))} 
              />
            </svg>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Tasks Column */}
        <div className="space-y-10">
          {tasksForToday.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-border">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="text-xl font-serif text-text-light">No hay tareas programadas para hoy</h3>
              <p className="text-text-light/60 text-sm">¡Disfruta del tiempo libre!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {(['mañana', 'mediodía', 'tarde', 'noche'] as TimeOfDay[]).map(time => (
                groupedTasks[time].length > 0 && (
                  <section key={time} className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-light border-b border-border pb-1">
                      {time}
                    </h3>
                    <div className="grid gap-3">
                      {groupedTasks[time].map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          persons={state.persons} 
                          completed={task.completedDates.includes(todayStr)}
                          onToggle={() => onToggle(task.id, todayStr)}
                          onEdit={() => onEditTask(task)}
                        />
                      ))}
                    </div>
                  </section>
                )
              ))}
            </div>
          )}
        </div>

        {/* Widgets Column */}
        <div className="space-y-6">
          {/* Menú Widget */}
          <div className="bg-cream p-6 rounded-[20px] border border-border relative group">
            <button 
              onClick={onEditMenu}
              className="absolute top-4 right-4 p-2 text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={16} />
            </button>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-light mb-4">Menú de Hoy</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                {cook?.emoji || '🍳'}
              </div>
              <div>
                <p className="text-[10px] text-text-light uppercase font-bold">Cocina hoy:</p>
                <p className="text-sm font-bold">{cook?.name || 'Sin asignar'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-bg p-3 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-accent uppercase">Almuerzo</p>
                <p className="text-sm font-medium">{todayMeal.almuerzo}</p>
              </div>
              <div className="bg-bg p-3 rounded-xl border border-border/50">
                <p className="text-[10px] font-bold text-accent uppercase">Cena</p>
                <p className="text-sm font-medium">{todayMeal.cena}</p>
              </div>
            </div>
          </div>

          {/* Familia Widget */}
          <div className="bg-white p-6 rounded-[20px] border border-border">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-light mb-4">Familia</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {state.persons.map(p => (
                <div 
                  key={p.id} 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-border/50"
                  style={{ backgroundColor: p.color + '20' }}
                  title={p.name}
                >
                  {p.emoji}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {state.persons.filter(p => p.isCareRecipient).map(p => (
                <div key={p.id} className="border-t border-bg pt-3 first:border-t-0 first:pt-0">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {p.name}
                  </p>
                  <p className="text-xs text-text-light line-clamp-2 mt-1">{p.notes || 'Sin observaciones.'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Carga Widget */}
          <div className="bg-primary text-white p-6 rounded-[20px] shadow-lg shadow-primary/20">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Resumen de carga</p>
            <p className="text-lg font-bold">Buen equilibrio semanal</p>
            <p className="text-xs opacity-80 mt-2 leading-relaxed">
              La distribución de tareas se mantiene estable entre los corresponsables.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TaskCard({ task, persons, completed, onToggle, onEdit }: { task: Task, persons: Person[], completed: boolean, onToggle: () => void, onEdit?: () => void, key?: React.Key }) {
  const assigned = persons.filter(p => task.assignedTo.includes(p.id));

  return (
    <div 
      className={cn(
        "group p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 shadow-sm",
        completed 
          ? "bg-bg border-border opacity-60" 
          : "bg-white border-border hover:border-primary/30",
        task.priority === 'alta' && !completed && "border-l-4 border-l-accent"
      )}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
          completed ? "bg-primary border-primary text-white" : "border-border text-transparent hover:border-primary"
        )}
      >
        <CheckCircle2 size={12} />
      </button>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
        <h4 className={cn("text-sm font-bold truncate", completed && "line-through text-text-light")}>{task.name}</h4>
        <p className="text-[11px] text-text-light truncate">
          {task.category} • {assigned.map(p => p.name).join(', ')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-bg px-2 py-1 rounded-lg text-[10px] font-bold text-primary shrink-0">
          {task.timeOfDay}
        </div>
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 text-text-light hover:text-primary hover:bg-bg rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// --- OTHER VIEWS (Simplified for brevity in this turn) ---

function SemanaView({ state, onToggle }: { state: AppState, onToggle: (id: string, date: string) => void }) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl text-primary">Vista Semanal</h2>
      
      {/* Day Picker for Mobile */}
      <div className="flex md:hidden overflow-x-auto pb-2 gap-2 no-scrollbar">
        {days.map(day => {
          const dStr = format(day, 'yyyy-MM-dd');
          const isActive = selectedDay === dStr;
          return (
            <button
              key={dStr}
              onClick={() => setSelectedDay(dStr)}
              className={cn(
                "flex flex-col items-center min-w-[60px] p-3 rounded-2xl border transition-all",
                isActive ? "bg-primary text-white border-primary" : "bg-white text-text-light border-border"
              )}
            >
              <span className="text-[10px] font-bold uppercase">{format(day, 'EEE', { locale: es })}</span>
              <span className="text-lg font-bold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map(day => {
          const dStr = format(day, 'yyyy-MM-dd');
          const isVisible = selectedDay === dStr;
          const dayTasks = state.tasks.filter(t => {
            const dow = getDay(day);
            if (t.frequency === 'diaria') return true;
            if (t.frequency === 'dias_especificos' && t.specificDays?.includes(dow)) return true;
            if (t.frequency === 'puntual' && t.date === dStr) return true;
            if (t.frequency === 'semanal' && t.specificDays?.includes(dow)) return true;
            return false;
          });

          return (
            <div 
              key={dStr} 
              className={cn(
                "bg-white rounded-3xl p-4 border border-border shadow-sm transition-all",
                !isVisible && "hidden md:block"
              )}
            >
              <div className="flex items-center justify-between mb-4 md:block">
                <p className="text-xs font-bold text-accent uppercase">
                  {format(day, 'EEEE d', { locale: es })}
                </p>
                <span className="md:hidden text-[10px] bg-bg px-2 py-1 rounded-full font-bold text-primary">
                  {dayTasks.length} tareas
                </span>
              </div>
              <div className="space-y-3">
                {dayTasks.length === 0 ? (
                  <p className="text-[10px] text-text-light italic py-4 text-center">Sin tareas</p>
                ) : (
                  dayTasks.map(t => (
                    <div key={t.id} className="p-3 bg-bg rounded-xl border border-border/50 shadow-sm">
                      <p className="text-xs font-bold leading-tight">{t.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex -space-x-1">
                          {t.assignedTo.map(pid => (
                            <div key={pid} className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center text-[10px] shadow-sm">
                              {state.persons.find(p => p.id === pid)?.emoji}
                            </div>
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-text-light uppercase">{t.timeOfDay}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RepartoView({ state }: { state: AppState }) {
  const stats = useMemo(() => {
    const totalMinutes = state.tasks.reduce((acc, t) => {
      let factor = 0;
      if (t.frequency === 'diaria') factor = 7;
      else if (t.frequency === 'dias_especificos') factor = t.specificDays?.length || 0;
      else if (t.frequency === 'semanal') factor = 1;
      return acc + (t.duration * factor);
    }, 0);

    const personStats = state.persons.filter(p => !p.isCareRecipient).map(p => {
      const pMinutes = state.tasks.reduce((acc, t) => {
        if (!t.assignedTo.includes(p.id)) return acc;
        let factor = 0;
        if (t.frequency === 'diaria') factor = 7;
        else if (t.frequency === 'dias_especificos') factor = t.specificDays?.length || 0;
        else if (t.frequency === 'semanal') factor = 1;
        return acc + ((t.duration * factor) / t.assignedTo.length);
      }, 0);
      return { ...p, minutes: pMinutes, percent: totalMinutes ? Math.round((pMinutes / totalMinutes) * 100) : 0 };
    });

    return { totalMinutes, personStats };
  }, [state.tasks, state.persons]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl text-primary">Panel de Corresponsabilidad</h2>
        <p className="text-sm text-text-light">Distribución de la carga de trabajo semanal</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {stats.personStats.map(p => (
          <div key={p.id} className="bg-white p-5 md:p-6 rounded-[32px] border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner" style={{ backgroundColor: p.color + '20' }}>
                  {p.emoji}
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-bold">{p.name}</h4>
                  <p className="text-[11px] md:text-sm text-text-light">{Math.round(p.minutes / 60)}h {Math.round(p.minutes % 60)}min / semana</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl md:text-3xl font-serif text-accent">{p.percent}%</span>
              </div>
            </div>
            <div className="h-3 md:h-4 bg-bg rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${p.percent}%` }}
                className="h-full bg-primary"
              />
            </div>
            {p.percent > 55 && (
              <div className="mt-4 flex items-center gap-2 text-accent text-[11px] md:text-sm font-bold bg-accent/5 p-3 rounded-xl border border-accent/10">
                <AlertCircle size={14} className="shrink-0" />
                <span>¡Alerta de sobrecarga! Supera el 55% de las tareas.</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-cream p-6 rounded-[32px] border border-border/50">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Resumen Total</h3>
        <p className="text-3xl font-serif text-primary">{Math.round(stats.totalMinutes / 60)} horas <span className="text-lg text-text-light">de trabajo doméstico semanal</span></p>
      </div>
    </motion.div>
  );
}

function TareasView({ state, onEdit, onDelete, onAdd }: { state: AppState, onEdit: (t: Task) => void, onDelete: (id: string) => void, onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-primary">Gestión de Tareas</h2>
        <button onClick={onAdd} className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <Plus size={20} />
          Nueva Tarea
        </button>
      </div>

      <div className="space-y-4">
        {(['hogar', 'alimentacion', 'cuidados_hijos', 'cuidados_dependientes'] as TaskBlock[]).map(block => {
          const blockTasks = state.tasks.filter(t => t.block === block);
          if (blockTasks.length === 0) return null;

          return (
            <div key={block} className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-light px-2 border-b border-border pb-1">{block.replace('_', ' ')}</h3>
              <div className="grid gap-3">
                {blockTasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-2xl border border-border flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center text-xl">
                        {task.category.split(' ')[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{task.name}</h4>
                        <p className="text-[11px] text-text-light">{task.frequency} • {task.timeOfDay}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(task)} className="p-2.5 text-primary hover:bg-primary/10 rounded-xl"><Edit2 size={18} /></button>
                      <button onClick={() => onDelete(task.id)} className="p-2.5 text-accent hover:bg-accent/10 rounded-xl"><Trash size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function MenuView({ state, updateState }: { state: AppState, updateState: (fn: (prev: AppState) => AppState) => void }) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-primary">Planificación de Menús</h2>
      </div>

      <div className="grid gap-6">
        {days.map((day, index) => {
          const dStr = format(day, 'yyyy-MM-dd');
          const plan = state.mealPlan[dStr] || { almuerzo: '', merienda: '', cena: '', cookId: '' };
          const isToday = dStr === format(new Date(), 'yyyy-MM-dd');

          return (
            <div key={dStr} className={cn(
              "bg-white p-6 rounded-3xl border transition-all shadow-sm",
              isToday ? "border-primary ring-1 ring-primary/20" : "border-border"
            )}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-bg w-12 h-12 rounded-2xl flex flex-col items-center justify-center border border-border">
                    <span className="text-[10px] font-bold uppercase text-text-light">{format(day, 'EEE', { locale: es })}</span>
                    <span className="text-lg font-bold text-primary leading-none">{format(day, 'd')}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold capitalize">{format(day, 'EEEE', { locale: es })}</h4>
                    {isToday && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase">Hoy</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold uppercase text-text-light">Responsable:</label>
                  <select 
                    value={plan.cookId || ''} 
                    onChange={(e) => {
                      const cookId = e.target.value;
                      updateState(prev => ({
                        ...prev,
                        mealPlan: { ...prev.mealPlan, [dStr]: { ...plan, cookId } }
                      }));
                    }}
                    className="bg-bg border border-border rounded-xl text-xs font-bold px-4 py-2 text-primary outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">¿Quién cocina?</option>
                    {state.persons.filter(p => !p.isCareRecipient).map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                  {index > 0 && (
                    <button 
                      onClick={() => {
                        const prevDStr = format(days[index-1], 'yyyy-MM-dd');
                        const prevPlan = state.mealPlan[prevDStr];
                        if (prevPlan) {
                          updateState(prev => ({
                            ...prev,
                            mealPlan: { ...prev.mealPlan, [dStr]: { ...prevPlan } }
                          }));
                        }
                      }}
                      className="p-3 text-text-light hover:text-primary hover:bg-bg rounded-xl transition-all border border-border md:border-none"
                      title="Copiar de ayer"
                    >
                      <Copy size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <MenuInput 
                  label="Almuerzo" 
                  value={plan.almuerzo} 
                  onChange={(v) => updateState(prev => ({ ...prev, mealPlan: { ...prev.mealPlan, [dStr]: { ...plan, almuerzo: v } } }))} 
                />
                <MenuInput 
                  label="Merienda" 
                  value={plan.merienda} 
                  onChange={(v) => updateState(prev => ({ ...prev, mealPlan: { ...prev.mealPlan, [dStr]: { ...plan, merienda: v } } }))} 
                />
                <MenuInput 
                  label="Cena" 
                  value={plan.cena} 
                  onChange={(v) => updateState(prev => ({ ...prev, mealPlan: { ...prev.mealPlan, [dStr]: { ...plan, cena: v } } }))} 
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-cream p-8 rounded-3xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl text-primary">Lista de la Compra</h3>
          <button 
            onClick={() => updateState(prev => ({ ...prev, shoppingList: [] }))}
            className="text-[10px] font-bold uppercase text-accent hover:underline"
          >
            Limpiar lista
          </button>
        </div>
        <textarea 
          className="w-full h-40 bg-white border border-border rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          placeholder="Añade ingredientes aquí (uno por línea)..."
          value={state.shoppingList.join('\n')}
          onChange={(e) => updateState(prev => ({ ...prev, shoppingList: e.target.value.split('\n') }))}
        />
      </div>
    </motion.div>
  );
}

function MenuInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-text-light ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        placeholder="..."
      />
    </div>
  );
}

function PersonasView({ state, onEdit, onDelete, onAdd }: { state: AppState, onEdit: (p: Person) => void, onDelete: (id: string) => void, onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-primary">Hogar y Familia</h2>
        <button onClick={onAdd} className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary/20">
          <Plus size={20} />
          Añadir Miembro
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {state.persons.map(person => (
          <div key={person.id} className="bg-white p-6 rounded-3xl border border-border flex items-start justify-between group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner" style={{ backgroundColor: person.color + '20' }}>
                {person.emoji}
              </div>
              <div>
                <h4 className="text-xl font-bold">{person.name}</h4>
                <p className="text-sm text-text-light">{PERSON_TYPE_LABELS[person.type]}</p>
                {person.isCareRecipient && (
                  <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Receptor de cuidados</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(person)} className="p-2.5 text-primary hover:bg-primary/10 rounded-xl"><Edit2 size={20} /></button>
              <button onClick={() => onDelete(person.id)} className="p-2.5 text-accent hover:bg-accent/10 rounded-xl"><Trash size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- MODALS ---

function PersonModal({ isOpen, onClose, person, onSave }: { isOpen: boolean, onClose: () => void, person: Person | null, onSave: (p: Person) => void }) {
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    type: 'adulto',
    emoji: '👤',
    color: '#5A5A40',
    notes: '',
    isCareRecipient: false
  });

  useEffect(() => {
    if (person) setFormData(person);
    else setFormData({ name: '', type: 'adulto', emoji: '👤', color: '#5A5A40', notes: '', isCareRecipient: false });
  }, [person, isOpen]);

  if (!isOpen) return null;

  const types = Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => ({
    value: value as PersonType,
    label
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-text/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-3xl p-8 shadow-2xl border-t md:border border-border max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden" />
        <h3 className="text-2xl mb-6 text-primary">{person ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Nombre</label>
            <input 
              type="text" 
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Emoji</label>
              <input 
                type="text" 
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-center text-2xl outline-none focus:ring-2 focus:ring-primary" 
                value={formData.emoji} 
                onChange={e => setFormData({ ...formData, emoji: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Color</label>
              <input 
                type="color" 
                className="w-full bg-bg border border-border rounded-xl h-[52px] p-1 outline-none focus:ring-2 focus:ring-primary" 
                value={formData.color} 
                onChange={e => setFormData({ ...formData, color: e.target.value })} 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Tipo</label>
            <select 
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 capitalize outline-none focus:ring-2 focus:ring-primary text-base" 
              value={formData.type}
              onChange={e => {
                const type = e.target.value as PersonType;
                const isCare = ['hijo_hija', 'abuelo_abuela'].includes(type);
                setFormData({ ...formData, type, isCareRecipient: isCare });
              }}
            >
              {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {formData.isCareRecipient && (
            <div>
              <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Notas de cuidados</label>
              <textarea 
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 h-24 outline-none focus:ring-2 focus:ring-primary text-base" 
                value={formData.notes} 
                onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-8 pb-6 md:pb-0">
          <button onClick={onClose} className="flex-1 px-4 py-4 rounded-xl border border-border font-bold text-text-light hover:bg-bg transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave({ ...formData, id: person?.id || Math.random().toString(36).substr(2, 9) } as Person)} 
            className="flex-1 px-4 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-text/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-3xl p-8 shadow-2xl border-t md:border border-border"
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden" />
        <h3 className="text-2xl mb-4 text-primary">{title}</h3>
        <p className="text-text-light mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 pb-6 md:pb-0">
          <button onClick={onCancel} className="flex-1 px-4 py-4 rounded-xl border border-border font-bold text-text-light hover:bg-bg transition-colors">Cancelar</button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-4 rounded-xl bg-accent text-white font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
function TaskModal({ isOpen, onClose, task, persons, onSave }: { isOpen: boolean, onClose: () => void, task: Task | null, persons: Person[], onSave: (t: Task) => void }) {
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    block: 'hogar',
    category: CATEGORIES.hogar[0],
    frequency: 'diaria',
    assignedTo: [],
    forWhom: [],
    duration: 30,
    timeOfDay: 'mañana',
    priority: 'media',
    autoRotate: false,
    completedDates: [],
    specificDays: [1, 2, 3, 4, 5, 6, 0]
  });

  useEffect(() => {
    if (task) setFormData(task);
    else setFormData({ name: '', block: 'hogar', category: CATEGORIES.hogar[0], frequency: 'diaria', assignedTo: [], forWhom: [], duration: 30, timeOfDay: 'mañana', priority: 'media', autoRotate: false, completedDates: [], specificDays: [1, 2, 3, 4, 5, 6, 0] });
  }, [task, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-text/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border-t md:border border-border"
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6 md:hidden" />
        <h3 className="text-2xl mb-6 text-primary">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Nombre de la tarea</label>
              <input 
                type="text" 
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Bloque</label>
                <select 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 capitalize outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.block}
                  onChange={e => {
                    const block = e.target.value as TaskBlock;
                    setFormData({ ...formData, block, category: CATEGORIES[block][0] });
                  }}
                >
                  <option value="hogar">Hogar</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="cuidados_hijos">Hijos</option>
                  <option value="cuidados_dependientes">Dependientes</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Categoría</label>
                <select 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES[formData.block as TaskBlock].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Frecuencia</label>
                <select 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.frequency}
                  onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="dias_especificos">Días específicos</option>
                  <option value="puntual">Puntual</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Momento</label>
                <select 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.timeOfDay}
                  onChange={e => setFormData({ ...formData, timeOfDay: e.target.value as any })}
                >
                  <option value="mañana">Mañana</option>
                  <option value="mediodía">Mediodía</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
              </div>
            </div>

            {(formData.frequency === 'dias_especificos' || formData.frequency === 'semanal') && (
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-2 block">Días de la semana</label>
                <div className="flex gap-1">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => {
                    const dIndex = (i + 1) % 7;
                    const isSelected = formData.specificDays?.includes(dIndex);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const current = formData.specificDays || [];
                          setFormData({
                            ...formData,
                            specificDays: isSelected ? current.filter(d => d !== dIndex) : [...current, dIndex]
                          });
                        }}
                        className={cn(
                          "w-10 h-10 md:w-8 md:h-8 rounded-lg text-[10px] font-bold transition-all border",
                          isSelected ? "bg-primary text-white border-primary" : "bg-bg text-text-light border-border"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-bg rounded-xl border border-border">
              <input 
                type="checkbox" 
                id="autoRotate"
                checked={formData.autoRotate}
                onChange={e => setFormData({ ...formData, autoRotate: e.target.checked })}
                className="w-5 h-5 md:w-4 md:h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="autoRotate" className="text-sm font-medium cursor-pointer">
                Rotar asignación automáticamente
                <p className="text-[10px] text-text-light">Cambia de responsable cada vez que se completa</p>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-text-light mb-3 block">Asignado a (Corresponsables)</label>
              <div className="flex flex-wrap gap-2">
                {persons.filter(p => !p.isCareRecipient).map(p => (
                  <button 
                    key={p.id}
                    onClick={() => {
                      const current = formData.assignedTo || [];
                      setFormData({ ...formData, assignedTo: current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id] });
                    }}
                    className={cn(
                      "px-4 py-3 md:px-3 md:py-2 rounded-xl text-sm font-bold transition-all border",
                      formData.assignedTo?.includes(p.id) ? "bg-primary/10 border-primary text-primary" : "bg-bg border-border text-text-light"
                    )}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            </div>
            {(formData.block === 'cuidados_hijos' || formData.block === 'cuidados_dependientes' || formData.block === 'alimentacion') && (
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-3 block">¿Para quién? (Receptores)</label>
                <div className="flex flex-wrap gap-2">
                  {persons.filter(p => p.isCareRecipient).map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        const current = formData.forWhom || [];
                        setFormData({ ...formData, forWhom: current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id] });
                      }}
                      className={cn(
                        "px-4 py-3 md:px-3 md:py-2 rounded-xl text-sm font-bold transition-all border",
                        formData.forWhom?.includes(p.id) ? "bg-accent/10 border-accent text-accent" : "bg-bg border-border text-text-light"
                      )}
                    >
                      {p.emoji} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Duración (min)</label>
                <input 
                  type="number" 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.duration} 
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-text-light mb-1 block">Prioridad</label>
                <select 
                  className="w-full bg-bg border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base" 
                  value={formData.priority} 
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-10 pb-10 md:pb-0">
          <button onClick={onClose} className="flex-1 px-4 py-4 rounded-xl border border-border font-bold text-text-light hover:bg-bg transition-colors">Cancelar</button>
          <button 
            onClick={() => onSave({ ...formData, id: task?.id || Math.random().toString(36).substr(2, 9) } as Task)} 
            className="flex-1 px-4 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

