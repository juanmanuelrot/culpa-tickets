// All dates in this app belong to a single audience in Uruguay.
// Everything is displayed and entered in Montevideo time, regardless of
// where the server runs or where the viewer/admin's browser is located.
export const MONTEVIDEO_TZ = "America/Montevideo";

type DateInput = Date | string;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

// Full, human form for the most important date: the event itself.
// e.g. "martes, 30 de junio de 2026, 22:00"
export function formatEventDateTime(input: DateInput): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: MONTEVIDEO_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(input));
}

// Date + time, no weekday. Generic displays, expiries, scan timestamps.
export function formatDateTime(input: DateInput): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: MONTEVIDEO_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(input));
}

// Flyer form: the date as it appears on Culpa's artwork. e.g. "24.08"
// Derived from the ISO form rather than a "2-digit" Intl skeleton: with the
// default best-fit matcher, ICU is free to hand back "8" instead of "08", and
// the artwork always pads.
export function formatDayDot(input: DateInput): string {
  const [, month, day] = utcToLocalInput(input).slice(0, 10).split("-");
  return `${day}.${month}`;
}

// Just the clock, for the phone's status bar and door times. e.g. "00:00"
export function formatClock(input: DateInput): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: MONTEVIDEO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(input));
}

// Compact form for dense admin lists. e.g. "30 jun, 22:00"
export function formatDateShort(input: DateInput): string {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: MONTEVIDEO_TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(input));
}

// Offset (in ms) between Montevideo wall-clock time and UTC for a given
// instant: (wall time read as if it were UTC) - (actual UTC instant).
// Montevideo is currently a fixed -03:00, but this stays correct if that
// ever changes.
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some engines emit "24" for midnight

  const wallAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return wallAsUtc - date.getTime();
}

// Converts a <input type="datetime-local"> value ("2026-06-30T22:00"),
// which carries no timezone, into the correct UTC Date by interpreting it
// as Montevideo wall-clock time.
export function localInputToUtc(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = (timePart || "00:00").split(":").map(Number);

  // First guess: pretend the wall time is already UTC, then shift by the
  // zone's offset to land on the real instant.
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const offset = tzOffsetMs(guess, MONTEVIDEO_TZ);
  const utc = new Date(guess.getTime() - offset);

  // Refine once in case the guess and the result straddle an offset change.
  const offset2 = tzOffsetMs(utc, MONTEVIDEO_TZ);
  if (offset2 !== offset) {
    return new Date(guess.getTime() - offset2);
  }
  return utc;
}

// Reverse of localInputToUtc: produces a datetime-local-compatible string
// ("2026-06-30T22:00") in Montevideo time, for pre-filling edit forms.
export function utcToLocalInput(input: DateInput): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MONTEVIDEO_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(toDate(input));

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  let hour = map.hour;
  if (hour === "24") hour = "00";

  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}
