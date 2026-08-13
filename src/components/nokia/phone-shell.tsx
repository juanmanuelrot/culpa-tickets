"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClock } from "@/lib/date";

/*
 * El shell del teléfono.
 *
 * En desktop se dibuja el celular completo: cuerpo azul, pantalla LCD lima
 * redondeada de alto fijo, y el contenido scrollea adentro.
 * En mobile el cuerpo desaparece y la pantalla ocupa el viewport entero, así
 * no se pierde ni un píxel de ancho: el celular del usuario ES el Nokia.
 */

export interface SoftKey {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PhoneShellProps {
  children: React.ReactNode;
  /** Softkey izquierdo. Por defecto «Menu», que va al inicio. */
  leftKey?: SoftKey | null;
  /** Softkey derecho. Por defecto «Back», que vuelve atrás. */
  rightKey?: SoftKey | null;
}

function SignalBars() {
  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="0" y="8" width="3" height="3" />
      <rect x="4.3" y="5.5" width="3" height="5.5" />
      <rect x="8.6" y="2.75" width="3" height="8.25" />
      <rect x="12.9" y="0" width="3" height="11" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="0.75" y="0.75" width="12.5" height="8.5" />
      <path d="M0.75 0.75 L7 5.5 L13.25 0.75" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M0.75 0.75 h13.5 v8.5 h-13.5 z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="15.5" y="3" width="2.5" height="4" />
      <rect x="2.5" y="2.5" width="2.5" height="5" />
      <rect x="6" y="2.5" width="2.5" height="5" />
      <rect x="9.5" y="2.5" width="2.5" height="5" />
    </svg>
  );
}

function StatusBar() {
  // El reloj arranca vacío para no romper la hidratación: el servidor y el
  // navegador nunca coinciden al minuto. Se llena en cuanto monta.
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 text-culpa-ink shrink-0">
      <div className="flex items-center gap-2">
        <SignalBars />
        <EnvelopeIcon />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-pixel text-xs tabular-nums w-[3.4em] text-right">
          {clock ?? ""}
        </span>
        <BatteryIcon />
      </div>
    </div>
  );
}

function SoftKeyButton({
  softKey,
  align,
}: {
  softKey: SoftKey;
  align: "left" | "right";
}) {
  const router = useRouter();

  function handleClick() {
    if (softKey.onClick) {
      softKey.onClick();
      return;
    }
    if (softKey.href) {
      router.push(softKey.href);
      return;
    }
    router.back();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`font-ui font-bold text-base text-culpa-ink px-2 py-1 hover:opacity-60 active:translate-y-px transition-opacity ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {softKey.label}
    </button>
  );
}

/** Las teclas del celu, dibujadas debajo de la pantalla. Solo decorativas. */
function Keypad() {
  return (
    <div className="hidden md:flex items-center justify-center gap-5 pt-4">
      <div className="w-10 h-5 rounded-b-full bg-culpa-blue-dark/70" />
      <div className="w-11 h-11 rounded-full bg-culpa-blue-dark/70 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-culpa-blue" />
      </div>
      <div className="w-10 h-5 rounded-b-full bg-culpa-blue-dark/70" />
    </div>
  );
}

export function PhoneShell({ children, leftKey, rightKey }: PhoneShellProps) {
  const left: SoftKey | null =
    leftKey === undefined ? { label: "Menu", href: "/" } : leftKey;
  const right: SoftKey | null =
    rightKey === undefined ? { label: "Back" } : rightKey;

  return (
    <div className="min-h-[100dvh] bg-culpa-night flex justify-center md:items-center md:py-10 md:px-4">
      <div className="w-full md:w-auto md:bg-culpa-blue md:rounded-[2.75rem] md:p-5 md:pb-5 md:shadow-[0_40px_90px_-25px_rgba(43,58,216,0.55)]">
        {/* Auricular y marca, sobre la pantalla — solo en desktop */}
        <div className="hidden md:flex flex-col items-center gap-2 pb-4">
          <div className="w-14 h-1.5 rounded-full bg-culpa-blue-dark/70" />
          <span className="font-pixel text-[0.6rem] tracking-[0.35em] text-culpa-cream/70">
            CULPA
          </span>
        </div>

        <div className="lcd-texture relative overflow-hidden flex flex-col bg-culpa-lime text-culpa-ink h-[100dvh] md:h-[660px] md:w-[400px] md:rounded-[1.25rem]">
          <StatusBar />

          <div className="relative z-20 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {(left || right) && (
            <div className="relative z-20 shrink-0 border-t-2 border-culpa-ink/25 px-3 py-2 flex items-center justify-between">
              {left ? (
                <SoftKeyButton softKey={left} align="left" />
              ) : (
                <span />
              )}
              {right ? (
                <SoftKeyButton softKey={right} align="right" />
              ) : (
                <span />
              )}
            </div>
          )}
        </div>

        <Keypad />
      </div>
    </div>
  );
}
