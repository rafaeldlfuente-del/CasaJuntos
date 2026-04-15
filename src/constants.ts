import { Person, Task, MealPlan, PersonType } from './types';
import { format, startOfWeek, addDays } from 'date-fns';

export const CATEGORIES = {
  hogar: [
    '🧹 Limpieza y orden',
    '🛒 Compras',
    '👕 Ropa y lavandería',
    '🔧 Mantenimiento',
    '🌿 Jardín / exterior',
    '📋 Gestiones adm.',
    '🐾 Mascotas',
    '♻️ Reciclaje',
    '📦 Otros'
  ],
  alimentacion: [
    '🍳 Desayuno',
    '🥗 Planificación',
    '🛒 Lista compra',
    '🍽️ Almuerzo',
    '🥘 Cena',
    '🧊 Organización',
    '🍱 Meriendas',
    '🍰 Repostería'
  ],
  cuidados_hijos: [
    '🌅 Rutina mañana',
    '🚗 Colegio/Guardería',
    '🏃 Extraescolares',
    '🩺 Terapias',
    '📚 Deberes',
    '🛁 Baño',
    '🌙 Rutina noche',
    '💊 Medicación',
    '👨‍⚕️ Sanidad',
    '🎮 Pantallas',
    '❤️ Tiempo calidad'
  ],
  cuidados_dependientes: [
    '🚿 Higiene',
    '💊 Medicación',
    '🍽️ Alimentación',
    '🧘 Fisioterapia',
    '🚗 Traslados',
    '👨‍⚕️ Sanidad',
    '🗣️ Acompañamiento',
    '🌙 Rutina noche',
    '📋 Gestiones adm.',
    '❤️ Otros'
  ]
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  adulto: 'Adulto',
  hijo_hija: 'Hijo/a',
  abuelo_abuela: 'Abuelo/a',
  p_externa: 'P. Externa'
};

export const SAMPLE_PERSONS: Person[] = [
  { id: '1', name: 'Elena', type: 'adulto', emoji: '👩‍🦰', color: '#C06C5D', isCareRecipient: false },
  { id: '2', name: 'Marcos', type: 'adulto', emoji: '👨‍🦱', color: '#5A5A40', isCareRecipient: false },
  { id: '3', name: 'Leo', type: 'hijo_hija', emoji: '👦', color: '#D4A373', isCareRecipient: true, notes: 'Alergia al melocotón. Le encanta el fútbol.' },
  { id: '4', name: 'Sofía', type: 'hijo_hija', emoji: '👱‍♀️', color: '#8DA68A', isCareRecipient: false },
  { id: '5', name: 'Abuela Carmen', type: 'abuelo_abuela', emoji: '👵', color: '#7E7C77', isCareRecipient: true, notes: 'Toma pastilla tensión por la mañana. Paseo diario necesario.' }
];

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

export const SAMPLE_TASKS: Task[] = [
  {
    id: 't1',
    name: 'Preparar almuerzo',
    block: 'alimentacion',
    category: '🍽️ Almuerzo',
    frequency: 'dias_especificos',
    specificDays: [1, 2, 3, 4, 5],
    assignedTo: ['1', '2'],
    duration: 45,
    timeOfDay: 'mediodía',
    priority: 'media',
    autoRotate: true,
    completedDates: []
  },
  {
    id: 't2',
    name: 'Llevar a Leo al colegio',
    block: 'cuidados_hijos',
    category: '🚗 Colegio/Guardería',
    frequency: 'diaria',
    assignedTo: ['2'],
    duration: 20,
    timeOfDay: 'mañana',
    priority: 'alta',
    autoRotate: false,
    completedDates: [],
    forWhom: ['3']
  },
  {
    id: 't3',
    name: 'Recoger a Leo del colegio',
    block: 'cuidados_hijos',
    category: '🚗 Colegio/Guardería',
    frequency: 'diaria',
    assignedTo: ['1'],
    duration: 20,
    timeOfDay: 'tarde',
    priority: 'alta',
    autoRotate: false,
    completedDates: [],
    forWhom: ['3']
  },
  {
    id: 't4',
    name: 'Acompañar a Leo a logopedia',
    block: 'cuidados_hijos',
    category: '🩺 Terapias',
    frequency: 'dias_especificos',
    specificDays: [2, 4],
    assignedTo: ['1'],
    duration: 60,
    timeOfDay: 'tarde',
    priority: 'media',
    autoRotate: false,
    completedDates: [],
    forWhom: ['3']
  },
  {
    id: 't5',
    name: 'Medicación Abuela Carmen',
    block: 'cuidados_dependientes',
    category: '💊 Medicación',
    frequency: 'diaria',
    assignedTo: ['1', '2'],
    duration: 10,
    timeOfDay: 'mañana',
    priority: 'alta',
    autoRotate: true,
    completedDates: [],
    forWhom: ['5']
  },
  {
    id: 't6',
    name: 'Compra semanal',
    block: 'hogar',
    category: '🛒 Compras',
    frequency: 'semanal',
    specificDays: [6],
    assignedTo: ['2'],
    duration: 90,
    timeOfDay: 'mañana',
    priority: 'media',
    autoRotate: false,
    completedDates: []
  },
  {
    id: 't7',
    name: 'Limpieza general',
    block: 'hogar',
    category: '🧹 Limpieza y orden',
    frequency: 'semanal',
    specificDays: [6],
    assignedTo: ['1', '4'],
    duration: 120,
    timeOfDay: 'mañana',
    priority: 'media',
    autoRotate: false,
    completedDates: []
  },
  {
    id: 't8',
    name: 'Preparar cena',
    block: 'alimentacion',
    category: '🥘 Cena',
    frequency: 'diaria',
    assignedTo: ['1', '2', '4'],
    duration: 40,
    timeOfDay: 'noche',
    priority: 'media',
    autoRotate: true,
    completedDates: []
  },
  {
    id: 't9',
    name: 'Rutina de noche Leo',
    block: 'cuidados_hijos',
    category: '🌙 Rutina noche',
    frequency: 'diaria',
    assignedTo: ['1', '2'],
    duration: 30,
    timeOfDay: 'noche',
    priority: 'media',
    autoRotate: true,
    completedDates: [],
    forWhom: ['3']
  },
  {
    id: 't10',
    name: 'Apoyo deberes Sofía',
    block: 'cuidados_hijos',
    category: '📚 Deberes',
    frequency: 'dias_especificos',
    specificDays: [1, 3],
    assignedTo: ['1'],
    duration: 45,
    timeOfDay: 'tarde',
    priority: 'baja',
    autoRotate: false,
    completedDates: [],
    forWhom: ['4']
  },
  {
    id: 't11',
    name: 'Lavandería',
    block: 'hogar',
    category: '👕 Ropa y lavandería',
    frequency: 'dias_especificos',
    specificDays: [2, 5],
    assignedTo: ['4'],
    duration: 30,
    timeOfDay: 'tarde',
    priority: 'baja',
    autoRotate: false,
    completedDates: []
  },
  {
    id: 't12',
    name: 'Acompañar Abuela Carmen al médico',
    block: 'cuidados_dependientes',
    category: '👨‍⚕️ Sanidad',
    frequency: 'mensual',
    assignedTo: ['1'],
    duration: 120,
    timeOfDay: 'mañana',
    priority: 'alta',
    autoRotate: false,
    completedDates: [],
    forWhom: ['5']
  }
];

export const generateSampleMealPlan = (): MealPlan => {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const plan: MealPlan = {};
  const dishes = [
    { a: 'Lentejas con verduras', c: 'Tortilla francesa y ensalada' },
    { a: 'Pollo asado', c: 'Crema de calabacín' },
    { a: 'Pasta boloñesa', c: 'Pescado a la plancha' },
    { a: 'Arroz con pollo', c: 'Sopa de fideos' },
    { a: 'Garbanzos salteados', c: 'Huevos rellenos' },
    { a: 'Paella familiar', c: 'Pizza casera' },
    { a: 'Asado de ternera', c: 'Sándwiches variados' }
  ];

  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const dStr = format(d, 'yyyy-MM-dd');
    plan[dStr] = {
      almuerzo: dishes[i].a,
      merienda: 'Fruta y yogur',
      cena: dishes[i].c,
      cookId: i % 2 === 0 ? '1' : '2'
    };
  }
  return plan;
};
