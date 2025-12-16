export type TransactionType = 'LOAN' | 'REPAYMENT';

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO String
  type: TransactionType;
  note?: string;
}

export interface Borrower {
  id: string;
  name: string;
  fixedInterest: number; // Fixed amount (e.g., 10000) instead of percentage
  transactions: Transaction[];
  startDate: string; // ISO String
  notes?: string;
}

export interface LoanSummary {
  principal: number;
  totalRepaid: number;
  interestAccrued: number;
  totalDue: number;
  remainingBalance: number;
  daysElapsed: number;
}