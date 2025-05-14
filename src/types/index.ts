
export interface Ticket {
  id: string;
  numbers: number[];
  status: 'active' | 'expired' | 'winning';
  createdAt: string; // ISO string for date
  buyerName?: string;
  buyerPhone?: string;
}

export interface Draw {
  id: string;
  name?: string; // Optional name for the draw
  numbers: number[]; // 5 numbers for admin draw
  createdAt: string; // ISO string for date
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Storing a hash is better, but for simplicity, this might store plain if not careful.
  role: 'cliente' | 'vendedor'; // Changed 'comprador' to 'cliente'
  createdAt: string; // ISO string for date
}
