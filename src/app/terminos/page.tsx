"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="h-full overflow-y-auto scroll-panel">
      <div className="p-5 sm:p-8 max-w-2xl mx-auto space-y-6">
        <Link href="/ajustes" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-70" style={{ color: "var(--c-text-muted)" }}>
          <ArrowLeft size={14} /> Volver a ajustes
        </Link>

        <div className="rounded-3xl p-6 border space-y-4 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)" }}>
              <Shield size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--c-text)" }}>Términos y condiciones</h1>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Última actualización: mayo 2026</p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl p-5 border space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>1. Uso de la aplicación</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            MyOrganización es una herramienta personal de gestión académica. Al usarla, aceptás los presentes términos.
            La app está diseñada para uso individual y no debe utilizarse con fines comerciales.
          </p>
        </section>

        <section className="rounded-2xl p-5 border space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>2. Almacenamiento de datos</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Los datos se almacenan localmente en tu navegador y, si iniciás sesión con Google, se sincronizan en nuestros servidores
            para que no pierdas información al cambiar de dispositivo. No compartimos tus datos con terceros.
          </p>
        </section>

        <section className="rounded-2xl p-5 border space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>3. Responsabilidad</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            MyOrganización es una herramienta de apoyo. No nos hacemos responsables por decisiones académicas basadas en la información
            registrada en la app. Verificá siempre con tu institución educativa los requisitos de cursada.
          </p>
        </section>

        <section className="rounded-2xl p-5 border space-y-3 anim-slide-up" style={{ background: "var(--c-glass)", borderColor: "var(--c-border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>4. Cambios</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Estos términos pueden actualizarse en el futuro. Los cambios serán notificados dentro de la aplicación.
          </p>
        </section>

        <p className="text-xs text-center pb-4" style={{ color: "var(--c-text-muted)" }}>
          &copy; {new Date().getFullYear()} MyOrganización &mdash; Desarrollado por Villegas
        </p>
      </div>
    </div>
  );
}
