import {
  BookOpen, Book, Atom, Calculator, Globe, Languages, Briefcase, GraduationCap,
  Code, Palette, Microscope, Music, Camera, Ruler, Trophy, Heart,
  DollarSign, Cpu, Trees, Building2, Utensils, Mountain, Plane, Sword,
  Paintbrush, ScrollText, FlaskConical, Bus, Backpack,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MateriaKind, UnitStatus } from "@/types/materias";

export const SUBJECT_COLORS = [
  { id: "violet",  dot: "bg-violet-400",  text: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-violet-500/25",  hex: "#a78bfa" },
  { id: "blue",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/25",    hex: "#60a5fa" },
  { id: "emerald", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", hex: "#34d399" },
  { id: "rose",    dot: "bg-rose-400",    text: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-500/25",    hex: "#fb7185" },
  { id: "amber",   dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/25",   hex: "#fbbf24" },
  { id: "zinc",    dot: "bg-zinc-400",    text: "text-zinc-400",    bg: "bg-zinc-500/15",    border: "border-zinc-500/25",    hex: "#a1a1aa" },
  { id: "pink",    dot: "bg-pink-400",    text: "text-pink-400",    bg: "bg-pink-500/15",    border: "border-pink-500/25",    hex: "#f472b6" },
  { id: "sky",     dot: "bg-sky-400",     text: "text-sky-400",     bg: "bg-sky-500/15",     border: "border-sky-500/25",     hex: "#38bdf8" },
  { id: "lime",    dot: "bg-lime-400",    text: "text-lime-400",    bg: "bg-lime-500/15",    border: "border-lime-500/25",    hex: "#84cc16" },
  { id: "teal",    dot: "bg-teal-400",    text: "text-teal-400",    bg: "bg-teal-500/15",    border: "border-teal-500/25",    hex: "#2dd4bf" },
  { id: "indigo",  dot: "bg-indigo-400",  text: "text-indigo-400",  bg: "bg-indigo-500/15",  border: "border-indigo-500/25",  hex: "#818cf8" },
  { id: "fuchsia", dot: "bg-fuchsia-400", text: "text-fuchsia-400", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/25", hex: "#d946ef" },
];

export const ICONS_MAP: Record<string, LucideIcon> = {
  BookOpen, Book, Atom, Calculator, Globe, Languages, Briefcase, GraduationCap,
  Code, Palette, Microscope, Music, Camera, Ruler, Trophy, Heart,
  DollarSign, Cpu, Trees, Building2, Utensils, Mountain, Plane, Sword,
  Paintbrush, ScrollText, FlaskConical, Bus, Backpack,
};

export const ICON_NAMES = Object.keys(ICONS_MAP);

export const MATERIA_KINDS: { id: MateriaKind; label: string; desc: string; long: string }[] = [
  { id: "taller",           label: "Taller",           desc: "Proyectual / práctico",   long: "Aprendés haciendo: proyectos, maquetas, trabajos prácticos integradores. Poca teoría expositiva." },
  { id: "teorica",          label: "Teórica",          desc: "Solo teoría y examen",    long: "Clases magistrales con examen final. El promedio de parciales define si promocionás o regularizás." },
  { id: "teorico-practica", label: "Teórico-Práctica", desc: "Teoría + trabajos",       long: "Mitad teoría, mitad práctica. Incluye TP, laboratorios o ejercitación en clase." },
];

export const STATUS_CYCLE: UnitStatus[] = ["pendiente", "en-clase", "aprendida"];

export const STATUS_META: Record<UnitStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  "pendiente": { label: "Pendiente", bg: "bg-zinc-500/10",    border: "border-zinc-500/20",    text: "text-zinc-400",    dot: "bg-zinc-400" },
  "en-clase":  { label: "En clase",  bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400" },
  "aprendida": { label: "Aprendida", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400" },
};

export const TAB_OPTIONS = [
  { id: "condiciones" as const,  label: "Condiciones" },
  { id: "asistencia" as const,   label: "Asistencia" },
  { id: "notas" as const,        label: "Notas" },
  { id: "correlativas" as const, label: "Correlativas" },
  { id: "temario" as const,      label: "Temario" },
];

export const YEARS = [
  { value: 1, label: "1° año" },
  { value: 2, label: "2° año" },
  { value: 3, label: "3° año" },
  { value: 4, label: "4° año" },
  { value: 5, label: "5° año" },
];

export const STORAGE_KEYS = {
  subjects: "mo_subjects",
  units: "mo_units",
} as const;
