export type PersonType = 
  | 'adulto' 
  | 'hijo_hija' 
  | 'abuelo_abuela' 
  | 'p_externa';

export interface Person {
  id: string;
  name: string;
  type: PersonType;
  emoji: string;
  color: string;
  notes?: string;
  isCareRecipient: boolean;
}

export type TaskBlock = 'hogar' | 'alimentacion' | 'cuidados_hijos' | 'cuidados_dependientes';

export type Frequency = 
  | 'diaria' 
  | 'dias_alternos' 
  | 'semanal' 
  | 'quincenal' 
  | 'mensual' 
  | 'puntual'
  | 'dias_especificos';

export type TimeOfDay = 'mañana' | 'mediodía' | 'tarde' | 'noche';

export type Priority = 'alta' | 'media' | 'baja';

export interface Task {
  id: string;
  name: string;
  block: TaskBlock;
  category: string;
  frequency: Frequency;
  specificDays?: number[]; // 0-6 (Sunday-Saturday)
  date?: string; // For 'puntual'
  forWhom?: string[]; // IDs of care recipients
  assignedTo: string[]; // IDs of caregivers
  duration: number; // in minutes
  timeOfDay: TimeOfDay;
  notes?: string;
  priority: Priority;
  autoRotate: boolean;
  completedDates: string[]; // ISO dates
}

export interface MealPlan {
  [day: string]: { // 'YYYY-MM-DD'
    almuerzo: string;
    merienda: string;
    cena: string;
    cookId?: string;
  };
}

export interface AppState {
  persons: Person[];
  tasks: Task[];
  mealPlan: MealPlan;
  shoppingList: string[];
}
