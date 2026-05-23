"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Target, Users, Lightbulb, Code } from "lucide-react";

export default function SobrePage() {
  return (
    <div className="h-full overflow-y-auto scroll-panel">
      <div className="p-5 sm:p-8 max-w-2xl mx-auto space-y-6">
        <Link href="/ajustes" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-70" style={{ color: "var(--c-text-muted)" }}>
          <ArrowLeft size={14} /> Volver a ajustes
        </Link>

        <div className="rounded-3xl p-6 border text-center space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
            <Heart size={28} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)" }}>Sobre MyOrganización</h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: "var(--c-text-muted)" }}>
            Una app simple para organizar tu carrera universitaria: materias, correlatividades, notas, asistencia, calendario y hábitos.
          </p>
        </div>

        <div className="rounded-2xl p-5 border space-y-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
            <Target size={16} className="text-emerald-400" /> ¿Qué buscamos?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            MyOrganización nace de la necesidad de tener un lugar único donde gestionar el avance de la carrera universitaria. 
            Sabemos lo difícil que es llevar el control de correlatividades, notas, trabajos prácticos y asistencia sin una herramienta pensada para eso.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Queremos que estudiantes de cualquier carrera puedan visualizar su plan de estudios, saber qué materias pueden cursar, 
            registrar sus notas y condiciones, y no perderse ningún detalle en el camino.
          </p>
        </div>

        <div className="rounded-2xl p-5 border space-y-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--c-text)" }}>
            <Lightbulb size={16} className="text-amber-400" /> Características
          </h2>
          <ul className="space-y-2.5 text-sm" style={{ color: "var(--c-text-muted)" }}>
            {[
              "Plan de estudios con correlatividades visuales",
              "Gestión de condiciones: TPs grupales, cuestionarios, exámenes",
              "Registro de asistencia con umbral personalizable",
              "Calendario de eventos con recordatorios",
              "Seguimiento de hábitos diarios",
              "Sincronización con cuenta de Google",
              "Modo oscuro y claro",
              "Planes de estudio precargados",
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-medium">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-5 border text-center space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <Code size={20} className="mx-auto text-violet-400" />
          <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
            Desarrollado por Villegas
          </p>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            &copy; {new Date().getFullYear()} MyOrganización &mdash; Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
