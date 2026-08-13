"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/*
 * El menú del teléfono: cursor «>», selección invertida (fondo tinta, texto
 * lima) y navegación con flechas + Enter, como se movía uno por el menú de un
 * Nokia. El mouse y el touch mueven el cursor igual que las flechas.
 */

export interface MenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  /** Texto chico a la derecha: una fecha, un precio, un estado. */
  meta?: string;
  /** Segunda línea, más apagada. */
  sub?: string;
  disabled?: boolean;
}

interface NokiaMenuProps {
  items: MenuItem[];
  /** Desactivar cuando la pantalla tiene un formulario que usa las flechas. */
  keyboardNav?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function NokiaMenu({ items, keyboardNav = true }: NokiaMenuProps) {
  const router = useRouter();
  const firstEnabled = items.findIndex((i) => !i.disabled);
  const [cursor, setCursor] = useState(firstEnabled === -1 ? 0 : firstEnabled);

  const select = useCallback(
    (item: MenuItem | undefined) => {
      if (!item || item.disabled) return;
      if (item.onSelect) {
        item.onSelect();
        return;
      }
      if (item.href) router.push(item.href);
    },
    [router]
  );

  const move = useCallback(
    (delta: number) => {
      setCursor((current) => {
        // Salta los deshabilitados; si no hay ninguno seleccionable, se queda.
        for (let step = 1; step <= items.length; step++) {
          const next =
            (current + delta * step + items.length * step) % items.length;
          if (!items[next]?.disabled) return next;
        }
        return current;
      });
    },
    [items]
  );

  useEffect(() => {
    if (!keyboardNav || items.length === 0) return;

    function handleKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Enter") {
        // Enter sobre un botón enfocado ya lo activa; no lo dupliquemos.
        if (document.activeElement?.tagName === "BUTTON") return;
        event.preventDefault();
        setCursor((current) => {
          select(items[current]);
          return current;
        });
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [keyboardNav, items, move, select]);

  if (items.length === 0) return null;

  return (
    <ul className="border-y-2 border-culpa-ink/20">
      {items.map((item, index) => {
        const active = index === cursor && !item.disabled;
        return (
          <li
            key={`${item.label}-${index}`}
            className="border-b-2 border-culpa-ink/10 last:border-b-0"
          >
            <button
              type="button"
              disabled={item.disabled}
              onMouseEnter={() => !item.disabled && setCursor(index)}
              onFocus={() => !item.disabled && setCursor(index)}
              onClick={() => select(item)}
              className={`w-full text-left px-3 py-3 flex items-start gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? "bg-culpa-ink text-culpa-lime" : "text-culpa-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`font-pixel text-sm leading-5 shrink-0 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              >
                &gt;
              </span>

              <span className="flex-1 min-w-0">
                <span className="font-pixel text-sm leading-5 block break-words">
                  {item.label}
                </span>
                {item.sub && (
                  <span
                    className={`font-ui text-xs block mt-1 ${
                      active ? "opacity-80" : "opacity-60"
                    }`}
                  >
                    {item.sub}
                  </span>
                )}
              </span>

              {item.meta && (
                <span className="font-pixel text-xs leading-5 shrink-0 pl-2">
                  {item.meta}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
