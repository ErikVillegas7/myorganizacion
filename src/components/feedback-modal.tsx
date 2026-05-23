"use client";

import { useState } from "react";
import { X, Send, MessageSquareText } from "lucide-react";

const FEEDBACK_EMAIL = "inmersiastudio@gmail.com";

import type { SoundType } from "@/lib/use-sound";

export function FeedbackModal({ onClose, playSound }: { onClose: () => void; playSound: (s: SoundType) => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    playSound("tap");
    setSending(true);
    const subject = encodeURIComponent("Feedback MyOrganización");
    const body = encodeURIComponent(message.trim() + "\n\n---\nEnviado desde MyOrganización");
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`, "_blank");
    setSent(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 anim-slide-up border overflow-hidden"
        style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}
      >
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/[0.06] transition-all" style={{ color: "var(--c-text-muted)" }}>
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/15">
            <MessageSquareText size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--c-text)" }}>Compartinos tu idea</p>
            <p className="text-[11px] font-medium" style={{ color: "var(--c-text-muted)" }}>¿Qué te gustaría mejorar?</p>
          </div>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <Send size={20} className="text-emerald-400" />
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>¡Gracias!</p>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Se abrió tu cliente de correo para enviar el mensaje.</p>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Escribí tu comentario, sugerencia o idea..."
              rows={4}
              className="w-full rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none resize-none transition-all"
              style={{ background: "var(--c-glass)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--c-text-muted)" }}>
              Se abrirá tu correo para enviarlo a {FEEDBACK_EMAIL}
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={onClose}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all hover:bg-white/[0.04]"
                style={{ border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={!message.trim() || sending}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: "var(--c-border-2)", color: "var(--c-text)" }}>
                <Send size={15} /> Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
