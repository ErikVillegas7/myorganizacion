export type UnitStatus = "pendiente" | "en-clase" | "aprendida";
export type SubjectType = "cuatrimestral" | "anual";
export type MateriaKind = "taller" | "teorica" | "teorico-practica";

export type Subject = {
  id: string;
  name: string;
  icon?: string;
  grade: string;
  grades?: (number | null)[];
  finalGrade?: number | null;
  regularGrade?: number;
  promotionGrade?: number;
  conditions: string;
  manualCondition?: "Abandono";
  quizRequired?: boolean;
  quizRequiredCount?: number;
  quizRequiredGrade?: number | null;
  quizGrades?: (number | null)[];
  groupWorkRequired?: boolean;
  groupWorkRequiredCount?: number;
  groupWorkRequiredGrade?: number | null;
  groupWorkGrades?: (number | null)[];
  color?: string;
  type?: SubjectType;
  kind?: MateriaKind;
  evaluations?: number;
  clasesTotal?: number;
  clasesAsistidas?: number;
  umbralAsistencia?: number;
  correlatividades?: string[];
  year?: number;
  regularidadFecha?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type Unit = {
  id: string;
  subjectId: string;
  title: string;
  status: UnitStatus;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type TabId = "condiciones" | "asistencia" | "notas" | "correlativas" | "temario";
