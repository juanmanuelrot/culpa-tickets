"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/nokia/phone-shell";
import {
  LcdButton,
  LcdError,
  LcdInput,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "VALIDATOR") {
        router.push("/validator");
      }
    } catch {
      setError("Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell leftKey={{ label: "Menu", href: "/" }}>
      <ScreenPad className="pt-8 pb-4 text-center">
        <Wordmark className="w-[52%] max-w-[200px] mx-auto" />
        {/* La pantalla de código de seguridad del celu, con otro nombre. */}
        <p className="font-pixel text-[0.7rem] uppercase tracking-[0.15em] mt-4">
          Codigo de seguridad
        </p>
      </ScreenPad>

      <form onSubmit={handleSubmit}>
        <ScreenPad className="space-y-3">
          <div>
            <PixelLabel className="mb-2">Correo</PixelLabel>
            <LcdInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <PixelLabel className="mb-2">Contraseña</PixelLabel>
            <LcdInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <LcdError>{error}</LcdError>}

          <LcdButton type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </LcdButton>

          <p className="font-ui text-xs text-culpa-ink/60 text-center">
            Acceso solo para staff.
          </p>
        </ScreenPad>
      </form>
    </PhoneShell>
  );
}
