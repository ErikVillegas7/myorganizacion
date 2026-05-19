"use client";

import { useCallback, useRef, useEffect } from "react";
import { useSettings } from "./use-settings";

export type SoundType = "pop" | "tap" | "success" | "click";

type WindowWithLegacyAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useSound() {
  const [settings] = useSettings();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Only initialize AudioContext after user interaction to respect browser policies,
    // but here we just prepare the ref. We'll instantiate on demand.
    return () => {
      if (audioCtxRef.current?.state !== "closed") {
        audioCtxRef.current?.close();
      }
    };
  }, []);

  const play = useCallback((type: SoundType) => {
    if (settings.soundEnabled !== true) return;
    
    try {
      if (!audioCtxRef.current) {
        const AudioContextConstructor =
          window.AudioContext || (window as WindowWithLegacyAudio).webkitAudioContext;
        if (!AudioContextConstructor) return;
        audioCtxRef.current = new AudioContextConstructor();
      }
      const ctx = audioCtxRef.current;
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case "pop":
          // Sonido de burbuja/pop sutil
          osc.type = "sine";
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case "tap":
          // Sonido de tap/click apagado
          osc.type = "triangle";
          osc.frequency.setValueAtTime(300, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        case "click":
          // Sonido más agudo para interacciones de UI
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        case "success":
          // Acorde alegre muy corto
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
          gain.gain.setValueAtTime(0.2, now + 0.08);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          
          osc.start(now);
          osc.stop(now + 0.2);
          break;
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, [settings.soundEnabled]);

  return play;
}
