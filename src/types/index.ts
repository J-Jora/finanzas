export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  date: string;
  description?: string | null;
  type: TransactionType;
  is_synced: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}
