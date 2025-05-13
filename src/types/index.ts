export interface Ticket {
  id: string;
  numbers: number[];
  status: 'active' | 'expired' | 'winning';
  createdAt: string; // ISO string for date
}
