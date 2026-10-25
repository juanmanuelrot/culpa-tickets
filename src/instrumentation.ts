// Next llama a register() una vez al levantar el server. Acá arrancan los
// crons; solo en producción, para que un `next dev` con la DB local no mande
// mails de verdad.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { Cron } = await import("croner");
  const { runCartReminders } = await import("@/lib/cart-reminders-job");

  // Cada 15 minutos. `protect` saltea una vuelta si la anterior sigue corriendo.
  new Cron("*/15 * * * *", { protect: true }, async () => {
    try {
      const sent = await runCartReminders();
      if (sent > 0) console.log(`Cart reminders: ${sent} sent`);
    } catch (error) {
      console.error("Cart reminders job failed:", error);
    }
  });
}
