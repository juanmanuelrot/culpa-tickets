"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/nokia/phone-shell";
import {
  LcdBox,
  LcdButton,
  LcdError,
  LcdInput,
  PixelLabel,
  ScreenPad,
  Wordmark,
} from "@/components/nokia/ui";
import { formatClock, formatDayDot, formatEventDateTime } from "@/lib/date";

interface InviteInfo {
  eventName: string;
  eventDate: string;
  ticketType: string;
  expired: boolean;
  fullyUsed: boolean;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

  useEffect(() => {
    fetch(`/api/public/free-invite?token=${token}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setInviteInfo(data); });
  }, [token]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/public/free-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al reclamar la invitación");
        return;
      }

      const eventParams = inviteInfo
        ? `&eventName=${encodeURIComponent(inviteInfo.eventName)}&eventDate=${encodeURIComponent(inviteInfo.eventDate)}`
        : "";
      const successUrl = `/event/${data.eventSlug}/checkout/success?ticketId=${data.ticketId}&free=true${eventParams}`;
      router.push(successUrl);
    } catch {
      setError("Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell leftKey={{ label: "Menu", href: "/" }}>
      <ScreenPad className="pt-6 pb-2 text-center">
        <Wordmark className="w-[52%] max-w-[200px] mx-auto" />
      </ScreenPad>

      {/* La invitación llega como llegaba todo: un mensaje nuevo. */}
      <ScreenPad className="py-2 text-center">
        <p className="font-pixel text-[0.7rem] uppercase tracking-[0.15em] inline-flex items-center gap-2">
          <span className="blink" aria-hidden="true">
            ✉
          </span>
          1 mensaje nuevo
        </p>
        <p className="font-ui text-sm text-culpa-ink/70 mt-2">
          Te invitaron. Poné tus datos y la entrada es tuya.
        </p>
      </ScreenPad>

      {inviteInfo?.eventName && (
        <ScreenPad className="pt-2">
          <LcdBox className="bg-culpa-ink text-culpa-lime border-culpa-ink">
            {inviteInfo.eventDate && (
              <p className="font-pixel text-2xl leading-none">
                {formatDayDot(inviteInfo.eventDate)}
              </p>
            )}
            <p className="font-pixel text-xs mt-2 leading-relaxed">
              {inviteInfo.eventName}
            </p>
            <p className="font-pixel text-[0.65rem] mt-2 opacity-80">
              {inviteInfo.ticketType}
            </p>
            {inviteInfo.eventDate && (
              <>
                <p className="font-pixel text-[0.65rem] mt-2 opacity-80">
                  OPEN DOORS {formatClock(inviteInfo.eventDate)}
                </p>
                <p className="font-ui text-[0.7rem] mt-2 opacity-70">
                  {formatEventDateTime(inviteInfo.eventDate)}
                </p>
              </>
            )}
          </LcdBox>
        </ScreenPad>
      )}

      <form onSubmit={handleClaim}>
        <ScreenPad className="space-y-3">
          <div>
            <PixelLabel className="mb-2">Nombre completo</PixelLabel>
            <LcdInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <PixelLabel className="mb-2">Correo</PixelLabel>
            <LcdInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <LcdError>{error}</LcdError>}

          <LcdButton type="submit" disabled={loading} className="w-full">
            {loading ? "Reclamando..." : "Reclamar entrada"}
          </LcdButton>

          <p className="font-ui text-xs text-culpa-ink/60 text-center pb-4">
            Te mandamos el QR a ese mail.
          </p>
        </ScreenPad>
      </form>
    </PhoneShell>
  );
}
