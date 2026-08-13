import Image from "next/image";
import wordmark from "../../../public/culpa-wordmark.png";

/*
 * Piezas chicas y repetidas de la pantalla LCD. Todo acá asume fondo lima y
 * texto tinta: bordes duros de 2px, sombras sin blur, cero gradientes.
 */

/*
 * El logo, tal cual la gráfica: amarillo con la extrusión negra. El keyline
 * negro es lo que lo hace legible contra el lima, así que no se recolorea ni
 * se le agrega sombra encima.
 *
 * `className` controla el ancho (el logo ocupa el 100% de su contenedor), no
 * el tamaño de fuente.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`block select-none ${className}`}>
      <Image
        src={wordmark}
        alt="Culpa"
        priority
        sizes="(min-width: 768px) 400px, 100vw"
        className="w-full h-auto"
      />
    </span>
  );
}

/** Padding estándar del contenido de la pantalla. */
export function ScreenPad({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

/** Label pixelado chico, para encabezar bloques y campos. */
export function PixelLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-pixel text-[0.65rem] uppercase tracking-[0.15em] text-culpa-ink/70 ${className}`}
    >
      {children}
    </p>
  );
}

/** Caja con borde duro, el contenedor de datos de la pantalla. */
export function LcdBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-2 border-culpa-ink p-3 ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

/** El botón de acción: azul, borde duro y sombra desplazada que se hunde. */
export function LcdButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "font-pixel text-xs uppercase tracking-[0.1em] border-2 border-culpa-ink px-4 py-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0";
  const skin =
    variant === "primary"
      ? "bg-culpa-blue text-culpa-cream shadow-[3px_3px_0_var(--culpa-ink)] enabled:hover:shadow-[1px_1px_0_var(--culpa-ink)] enabled:hover:translate-x-0.5 enabled:hover:translate-y-0.5"
      : "bg-transparent text-culpa-ink hover:bg-culpa-ink/10";

  return <button className={`${base} ${skin} ${className}`} {...props} />;
}

/** Input de la pantalla: sin relleno, borde duro, texto tinta. */
export function LcdInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-culpa-lime/40 border-2 border-culpa-ink text-culpa-ink font-ui text-base px-3 py-3 placeholder:text-culpa-ink/40 focus:outline-none focus:bg-culpa-lime/80 focus:shadow-[3px_3px_0_var(--culpa-ink)] transition-shadow ${className}`}
      {...props}
    />
  );
}

/** Mensaje de error, en alerta sobre la pantalla. */
export function LcdError({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-culpa-alert bg-culpa-alert/10 px-3 py-2">
      <p className="font-ui text-sm text-culpa-ink text-center">{children}</p>
    </div>
  );
}

/** «CARGANDO» con el bloque parpadeando, como un teléfono pensando. */
export function LcdLoading({ label = "Cargando" }: { label?: string }) {
  return (
    <p className="font-pixel text-xs uppercase tracking-[0.15em] text-culpa-ink/70 flex items-center gap-1">
      {label}
      <span className="blink" aria-hidden="true">
        _
      </span>
    </p>
  );
}
