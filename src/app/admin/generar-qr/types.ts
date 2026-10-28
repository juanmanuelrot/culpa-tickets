// Shape of /api/admin/events as the Generar QR form consumes it.
export interface EventWithTypes {
  id: string;
  name: string;
  ticketTypes: Array<{
    id: string;
    name: string;
    isOffered: boolean;
    price: number;
    currency: string;
  }>;
}
