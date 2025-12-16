import { Borrower, LoanSummary } from '../types';

export const calculateSummary = (borrower: Borrower): LoanSummary => {
  const now = new Date();
  const start = new Date(borrower.startDate);
  
  // Calculate days elapsed
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  let principal = 0;
  let totalRepaid = 0;

  borrower.transactions.forEach(t => {
    if (t.type === 'LOAN') {
      principal += t.amount;
    } else if (t.type === 'REPAYMENT') {
      totalRepaid += t.amount;
    }
  });

  // Interest Logic: User manually enters the total interest amount.
  // We simply add this fixed amount to the principal to get the total due.
  const interestAccrued = borrower.fixedInterest || 0;
  
  const totalDue = principal + interestAccrued;
  const remainingBalance = totalDue - totalRepaid;

  return {
    principal,
    totalRepaid,
    interestAccrued,
    totalDue,
    remainingBalance,
    daysElapsed
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0, // Simplified for whole numbers often used in this context
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};