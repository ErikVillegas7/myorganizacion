import type { Subject } from "@/types/materias";

function id(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface PlanTemplate {
  key: string;
  label: string;
  subjects: Subject[];
}

const ING_SISTEMAS: Subject[] = [
  // ── 1° año ──
  { id: id("analisis-matematico-i"), name: "Análisis Matemático I",  grade: "", conditions: "", correlatividades: [], year: 1, color: "violet", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("algebra-y-geometria-analitica"), name: "Álgebra y Geometría Analítica", grade: "", conditions: "", correlatividades: [], year: 1, color: "blue", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("fisica-i"), name: "Física I", grade: "", conditions: "", correlatividades: [], year: 1, color: "emerald", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("ingles-i"), name: "Inglés I", grade: "", conditions: "", correlatividades: [], year: 1, color: "rose", type: "cuatrimestral", kind: "taller" },
  { id: id("logica-y-estructuras-discretas"), name: "Lógica y Estructuras Discretas", grade: "", conditions: "", correlatividades: [], year: 1, color: "amber", type: "cuatrimestral", kind: "teorica" },
  { id: id("algoritmos-y-estructuras-de-datos"), name: "Algoritmos y Estructuras de Datos", grade: "", conditions: "", correlatividades: [], year: 1, color: "pink", type: "anual", kind: "teorico-practica" },
  { id: id("arquitectura-de-computadoras"), name: "Arquitectura de Computadoras", grade: "", conditions: "", correlatividades: [], year: 1, color: "sky", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("sistemas-y-procesos-de-negocio"), name: "Sistemas y Procesos de Negocio", grade: "", conditions: "", correlatividades: [], year: 1, color: "lime", type: "cuatrimestral", kind: "teorico-practica" },

  // ── 2° año ──
  { id: id("analisis-matematico-ii"), name: "Análisis Matemático II", grade: "", conditions: "", correlatividades: [id("analisis-matematico-i"), id("algebra-y-geometria-analitica")], year: 2, color: "violet", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("fisica-ii"), name: "Física II", grade: "", conditions: "", correlatividades: [id("analisis-matematico-i"), id("fisica-i")], year: 2, color: "emerald", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("ingenieria-y-sociedad"), name: "Ingeniería y Sociedad", grade: "", conditions: "", correlatividades: [], year: 2, color: "teal", type: "cuatrimestral", kind: "teorica" },
  { id: id("ingles-ii"), name: "Inglés II", grade: "", conditions: "", correlatividades: [id("ingles-i")], year: 2, color: "rose", type: "cuatrimestral", kind: "taller" },
  { id: id("sintaxis-y-semantica-de-los-lenguajes"), name: "Sintaxis y Semántica de los Lenguajes", grade: "", conditions: "", correlatividades: [id("logica-y-estructuras-discretas"), id("algoritmos-y-estructuras-de-datos")], year: 2, color: "amber", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("paradigmas-de-programacion"), name: "Paradigmas de Programación", grade: "", conditions: "", correlatividades: [id("logica-y-estructuras-discretas"), id("algoritmos-y-estructuras-de-datos")], year: 2, color: "pink", type: "anual", kind: "teorico-practica" },
  { id: id("sistemas-operativos"), name: "Sistemas Operativos", grade: "", conditions: "", correlatividades: [id("arquitectura-de-computadoras")], year: 2, color: "sky", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("analisis-de-sistemas-de-informacion"), name: "Análisis de Sistemas de Información", grade: "", conditions: "", correlatividades: [id("algoritmos-y-estructuras-de-datos"), id("sistemas-y-procesos-de-negocio")], year: 2, color: "lime", type: "cuatrimestral", kind: "teorico-practica" },

  // ── 3° año ──
  { id: id("probabilidad-y-estadistica"), name: "Probabilidad y Estadística", grade: "", conditions: "", correlatividades: [id("analisis-matematico-i"), id("algebra-y-geometria-analitica")], year: 3, color: "violet", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("economia"), name: "Economía", grade: "", conditions: "", correlatividades: [id("analisis-matematico-i"), id("algebra-y-geometria-analitica")], year: 3, color: "blue", type: "cuatrimestral", kind: "teorica" },
  { id: id("bases-de-datos"), name: "Bases de Datos", grade: "", conditions: "", correlatividades: [id("sintaxis-y-semantica-de-los-lenguajes"), id("analisis-de-sistemas-de-informacion"), id("logica-y-estructuras-discretas"), id("algoritmos-y-estructuras-de-datos")], year: 3, color: "emerald", type: "anual", kind: "teorico-practica" },
  { id: id("desarrollo-de-software"), name: "Desarrollo de Software", grade: "", conditions: "", correlatividades: [id("paradigmas-de-programacion"), id("analisis-de-sistemas-de-informacion"), id("logica-y-estructuras-discretas"), id("algoritmos-y-estructuras-de-datos")], year: 3, color: "rose", type: "anual", kind: "teorico-practica" },
  { id: id("comunicacion-de-datos"), name: "Comunicación de Datos", grade: "", conditions: "", correlatividades: [id("fisica-i"), id("arquitectura-de-computadoras")], year: 3, color: "sky", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("analisis-numerico"), name: "Análisis Numérico", grade: "", conditions: "", correlatividades: [id("analisis-matematico-ii"), id("analisis-matematico-i"), id("algebra-y-geometria-analitica")], year: 3, color: "zinc", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("diseno-de-sistemas-de-informacion"), name: "Diseño de Sistemas de Información", grade: "", conditions: "", correlatividades: [id("paradigmas-de-programacion"), id("analisis-de-sistemas-de-informacion"), id("ingles-i"), id("algoritmos-y-estructuras-de-datos"), id("sistemas-y-procesos-de-negocio")], year: 3, color: "lime", type: "anual", kind: "teorico-practica" },

  // ── 4° año ──
  { id: id("legislacion"), name: "Legislación", grade: "", conditions: "", correlatividades: [id("ingenieria-y-sociedad")], year: 4, color: "teal", type: "cuatrimestral", kind: "teorica" },
  { id: id("ingenieria-y-calidad-de-software"), name: "Ingeniería y Calidad de Software", grade: "", conditions: "", correlatividades: [id("bases-de-datos"), id("desarrollo-de-software"), id("diseno-de-sistemas-de-informacion"), id("sintaxis-y-semantica-de-los-lenguajes"), id("paradigmas-de-programacion")], year: 4, color: "indigo", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("redes-de-datos"), name: "Redes de Datos", grade: "", conditions: "", correlatividades: [id("sistemas-operativos"), id("comunicacion-de-datos")], year: 4, color: "sky", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("investigacion-operativa"), name: "Investigación Operativa", grade: "", conditions: "", correlatividades: [id("probabilidad-y-estadistica"), id("analisis-numerico")], year: 4, color: "violet", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("simulacion"), name: "Simulación", grade: "", conditions: "", correlatividades: [id("probabilidad-y-estadistica"), id("analisis-matematico-ii")], year: 4, color: "amber", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("tecnologias-para-la-automatizacion"), name: "Tecnologías para la Automatización", grade: "", conditions: "", correlatividades: [id("fisica-ii"), id("analisis-numerico"), id("analisis-matematico-ii")], year: 4, color: "fuchsia", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("administracion-de-sistemas-de-informacion"), name: "Administración de Sistemas de Información", grade: "", conditions: "", correlatividades: [id("economia"), id("diseno-de-sistemas-de-informacion"), id("analisis-de-sistemas-de-informacion")], year: 4, color: "lime", type: "cuatrimestral", kind: "teorico-practica" },

  // ── 5° año ──
  { id: id("inteligencia-artificial"), name: "Inteligencia Artificial", grade: "", conditions: "", correlatividades: [id("simulacion"), id("probabilidad-y-estadistica"), id("analisis-numerico")], year: 5, color: "pink", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("ciencia-de-datos"), name: "Ciencia de Datos", grade: "", conditions: "", correlatividades: [id("simulacion"), id("probabilidad-y-estadistica"), id("bases-de-datos")], year: 5, color: "blue", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("sistemas-de-gestion"), name: "Sistemas de Gestión", grade: "", conditions: "", correlatividades: [id("economia"), id("investigacion-operativa"), id("diseno-de-sistemas-de-informacion")], year: 5, color: "emerald", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("gestion-gerencial"), name: "Gestión Gerencial", grade: "", conditions: "", correlatividades: [id("legislacion"), id("administracion-de-sistemas-de-informacion"), id("economia")], year: 5, color: "teal", type: "cuatrimestral", kind: "teorica" },
  { id: id("seguridad-en-los-sistemas-de-informacion"), name: "Seguridad en los Sistemas de Información", grade: "", conditions: "", correlatividades: [id("redes-de-datos"), id("administracion-de-sistemas-de-informacion"), id("desarrollo-de-software"), id("comunicacion-de-datos")], year: 5, color: "sky", type: "cuatrimestral", kind: "teorico-practica" },
  { id: id("proyecto-final"), name: "Proyecto Final", grade: "", conditions: "", correlatividades: [id("ingenieria-y-calidad-de-software"), id("redes-de-datos"), id("administracion-de-sistemas-de-informacion"), id("ingles-ii"), id("desarrollo-de-software"), id("diseno-de-sistemas-de-informacion")], year: 5, color: "violet", type: "anual", kind: "teorico-practica" },
];

export const PLAN_TEMPLATES: PlanTemplate[] = [
  { key: "ing-sistemas", label: "Ingeniería en Sistemas de Información", subjects: ING_SISTEMAS },
];

export const PLAN_STORAGE_KEY = "mo_plan";
