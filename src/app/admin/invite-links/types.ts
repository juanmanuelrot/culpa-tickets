// Shape of /api/admin/events as the invite sections consume it.
export interface EventWithTypes {
  id: string;
  name: string;
  ticketTypes: Array<{ id: string; name: string; isOffered: boolean }>;
}
