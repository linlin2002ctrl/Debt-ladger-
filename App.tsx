import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Sparkles,
  ChevronRight,
  Search,
  Pencil,
  X,
  Save,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  Timer,
  Calendar,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Borrower, Transaction } from './types';
import { saveEncryptedData, loadRawData, hasData, clearData } from './services/storage';
import { encryptData, decryptData } from './utils/encryption';
import { calculateSummary, formatCurrency, formatDate } from './utils/calculations';
import AIChatModal from './components/AIChatModal';

// --- Sub-components ---

const StatCard = ({ title, value, sub, color }: { title: string, value: string, sub?: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
    <span className="text-gray-500 text-sm font-medium mb-1">{title}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
    {sub && <span className="text-gray-400 text-xs mt-2">{sub}</span>}
  </div>
);

const LockScreen = ({ 
  isSetupMode, 
  onUnlock, 
  onReset,
  isProcessing
}: { 
  isSetupMode: boolean; 
  onUnlock: (pin: string) => void;
  onReset: () => void;
  isProcessing: boolean;
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (isSetupMode) {
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      onUnlock(pin);
    } else {
      onUnlock(pin);
    }
  };

  if (showResetConfirm) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency Reset</h2>
          <p className="text-gray-600 mb-6">
            To protect your privacy, resetting your PIN will <span className="font-bold text-red-600">permanently delete all data</span>. This cannot be undone because the data is encrypted with your lost PIN.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={onReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Delete All Data & Reset
            </button>
            <button 
              onClick={() => setShowResetConfirm(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            {isSetupMode ? <ShieldCheck size={32} /> : <Lock size={32} />}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isSetupMode ? "Secure Your Ledger" : "Encrypted Vault"}
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {isSetupMode 
            ? "Create a PIN. This will be used to encrypt your data." 
            : "Enter PIN to decrypt and access your data."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={isSetupMode ? "Create PIN" : "Enter PIN"}
              className="w-full text-center text-2xl tracking-widest px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:ring-0 outline-none transition-colors"
              autoFocus
              disabled={isProcessing}
            />
          </div>

          {isSetupMode && (
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm PIN"
                className="w-full text-center text-2xl tracking-widest px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-600 focus:ring-0 outline-none transition-colors"
                disabled={isProcessing}
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 mt-2 flex justify-center"
          >
            {isProcessing ? "Processing..." : (isSetupMode ? "Encrypt & Start" : "Decrypt & Unlock")}
          </button>
        </form>

        {!isSetupMode && (
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="w-full text-center text-gray-400 text-xs mt-6 hover:text-gray-600"
          >
            Forgot PIN?
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function for status badge styling
const getStatusParams = (remainingBalance: number) => {
  if (remainingBalance <= 0) {
    return { 
      label: 'Paid Off', 
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
      icon: <CheckCircle2 size={12} strokeWidth={2.5} /> 
    };
  }
  return { 
    label: 'Active', 
    className: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: <Activity size={12} strokeWidth={2.5} /> 
  };
};

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);

  // App Data State
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [view, setView] = useState<'dashboard' | 'borrowers' | 'add' | 'details'>('dashboard');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Auto-lock Ref
  // Fix: Use ReturnType<typeof setTimeout> to handle timeout refs correctly in browser environment
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newInterest, setNewInterest] = useState(''); 
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState('');

  // Repayment State
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayNote, setRepayNote] = useState('');

  // Initialization: Check if data exists
  useEffect(() => {
    const exists = hasData();
    setIsSetupMode(!exists);
  }, []);

  // --- Auto Lock Logic ---
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isAuthenticated) {
      idleTimerRef.current = setTimeout(() => {
        handleLock();
      }, 5 * 60 * 1000); // 5 minutes
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetIdleTimer();
    
    events.forEach(event => window.addEventListener(event, handler));
    if (isAuthenticated) resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach(event => window.removeEventListener(event, handler));
    };
  }, [isAuthenticated, resetIdleTimer]);

  // --- Data Persistence (Encryption) ---
  useEffect(() => {
    const saveData = async () => {
      if (isAuthenticated && sessionPin) {
        try {
          const encrypted = await encryptData(borrowers, sessionPin);
          saveEncryptedData(encrypted);
        } catch (e) {
          console.error("Auto-save encryption failed", e);
        }
      }
    };
    // Debounce slightly or just save on change
    if (isAuthenticated) {
        saveData();
    }
  }, [borrowers, isAuthenticated, sessionPin]);


  const handleUnlockAttempt = async (inputPin: string) => {
    setIsAuthProcessing(true);
    // Allow UI to update
    await new Promise(r => setTimeout(r, 100));

    try {
      if (isSetupMode) {
        // New user: Initialize with empty array, but encrypted with this PIN
        setBorrowers([]);
        setSessionPin(inputPin);
        
        // Initial save to verify encryption works and set the "hasData" flag
        const initialEncrypt = await encryptData([], inputPin);
        saveEncryptedData(initialEncrypt);
        
        setIsAuthenticated(true);
      } else {
        // Existing user: Try to decrypt data
        const rawData = loadRawData();
        if (rawData) {
           const data = await decryptData(rawData, inputPin);
           setBorrowers(data);
           setSessionPin(inputPin);
           setIsAuthenticated(true);
        }
      }
    } catch (e) {
      alert("Incorrect PIN or Data Corruption.");
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setSessionPin(null);
    setView('dashboard');
  };

  const handleFactoryReset = () => {
    clearData();
    // Clear API keys
    localStorage.removeItem('user_gemini_api_key'); 
    setBorrowers([]);
    setIsAuthenticated(false);
    setIsSetupMode(true);
    window.location.reload();
  };

  const preventInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleAddBorrower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAmount || !newInterest) return;

    const principal = parseFloat(newAmount);
    const interest = parseFloat(newInterest);

    if (isNaN(principal) || principal <= 0) {
      alert("Principal amount must be greater than zero.");
      return;
    }

    if (isNaN(interest) || interest < 0) {
      alert("Interest amount cannot be negative.");
      return;
    }

    const newBorrower: Borrower = {
      id: crypto.randomUUID(),
      name: newName,
      fixedInterest: interest,
      startDate: newDate,
      transactions: [
        {
          id: crypto.randomUUID(),
          amount: principal,
          date: newDate,
          type: 'LOAN',
          note: newNote || undefined
        }
      ]
    };

    setBorrowers([...borrowers, newBorrower]);
    resetForm();
    setView('dashboard');
  };

  const handleAddRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowerId || !repayAmount) return;

    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Repayment amount must be greater than zero.");
      return;
    }

    const updatedBorrowers = borrowers.map(b => {
      if (b.id === selectedBorrowerId) {
        return {
          ...b,
          transactions: [
            ...b.transactions,
            {
              id: crypto.randomUUID(),
              amount: amount,
              date: repayDate,
              type: 'REPAYMENT' as const,
              note: repayNote || undefined
            }
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      }
      return b;
    });

    setBorrowers(updatedBorrowers);
    setRepayAmount('');
    setRepayDate(new Date().toISOString().split('T')[0]);
    setRepayNote('');
  };

  const startEditing = (borrower: Borrower) => {
    const initialLoan = borrower.transactions.find(t => t.type === 'LOAN');
    setNewName(borrower.name);
    setNewInterest(borrower.fixedInterest.toString());
    setNewAmount(initialLoan ? initialLoan.amount.toString() : '0');
    setNewDate(borrower.startDate); 
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowerId || !newName || !newAmount || !newInterest) return;

    const principal = parseFloat(newAmount);
    const interest = parseFloat(newInterest);

    if (isNaN(principal) || principal <= 0) {
      alert("Principal amount must be greater than zero.");
      return;
    }
    if (isNaN(interest) || interest < 0) {
      alert("Interest amount cannot be negative.");
      return;
    }

    const updatedBorrowers = borrowers.map(b => {
      if (b.id === selectedBorrowerId) {
        const updatedTransactions = b.transactions.map(t => {
          if (t.type === 'LOAN') {
            return { ...t, amount: principal }; 
          }
          return t;
        });

        const hasLoan = updatedTransactions.some(t => t.type === 'LOAN');
        if (!hasLoan) {
             updatedTransactions.push({
                id: crypto.randomUUID(),
                amount: principal,
                date: b.startDate, 
                type: 'LOAN'
             });
        }

        return {
          ...b,
          name: newName,
          fixedInterest: interest,
          transactions: updatedTransactions
        };
      }
      return b;
    });

    setBorrowers(updatedBorrowers);
    setIsEditing(false);
    resetForm();
  };

  const cancelEdit = () => {
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewAmount('');
    setNewInterest('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewNote('');
  };

  const deleteBorrower = (id: string) => {
    if (window.confirm("Are you sure you want to delete this borrower history?")) {
      setBorrowers(borrowers.filter(b => b.id !== id));
      setView('borrowers');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Borrower Name',
      'Start Date',
      'Fixed Interest',
      'Transaction Date',
      'Transaction Type',
      'Transaction Amount',
      'Note'
    ];

    const rows: string[] = [];
    rows.push(headers.join(','));

    borrowers.forEach(b => {
      const safeName = `"${b.name.replace(/"/g, '""')}"`;

      if (b.transactions.length === 0) {
        rows.push([safeName, b.startDate, b.fixedInterest, '', '', '', ''].join(','));
      } else {
        b.transactions.forEach(t => {
          const safeNote = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
          rows.push([
            safeName,
            b.startDate,
            b.fixedInterest,
            t.date,
            t.type,
            t.amount,
            safeNote
          ].join(','));
        });
      }
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lendledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLent = borrowers.reduce((acc, b) => acc + calculateSummary(b).principal, 0);
  const totalRepaid = borrowers.reduce((acc, b) => acc + calculateSummary(b).totalRepaid, 0);
  const totalInterest = borrowers.reduce((acc, b) => acc + calculateSummary(b).interestAccrued, 0);
  const totalOutstanding = borrowers.reduce((acc, b) => acc + calculateSummary(b).remainingBalance, 0);

  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId);
  const selectedSummary = selectedBorrower ? calculateSummary(selectedBorrower) : null;

  const chartData = borrowers.map(b => {
    const s = calculateSummary(b);
    return {
      name: b.name.split(' ')[0],
      Borrowed: s.principal,
      Repaid: s.totalRepaid,
      Balance: s.remainingBalance
    };
  });

  const filteredBorrowers = borrowers.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Render Authentication Check ---

  if (!isAuthenticated) {
    return <LockScreen 
      isSetupMode={isSetupMode} 
      onUnlock={handleUnlockAttempt} 
      onReset={handleFactoryReset} 
      isProcessing={isAuthProcessing}
    />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64">
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-4 z-10">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="text-xl font-bold text-gray-800">Debt Ledger</span>
        </div>
        
        <div className="space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setView('borrowers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'borrowers' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={20} /> Borrowers
          </button>
          <button 
            onClick={() => setView('add')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'add' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Plus size={20} /> New Loan
          </button>
        </div>

        <div className="mt-auto space-y-2">
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="w-full flex items-center gap-2 justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles size={18} />
            Ask Assistant
          </button>
          <button 
            onClick={handleLock}
            className="w-full flex items-center gap-2 justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-3 rounded-xl transition-colors text-sm font-medium"
          >
            <div className="flex items-center gap-2">
               <Timer size={16} className="text-gray-400" />
               <span>Lock Now</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center sticky top-0 z-20 border-b">
        <span className="font-bold text-lg text-gray-800">Debt Ledger</span>
        <div className="flex gap-2">
          <button onClick={handleLock} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Lock size={20} />
          </button>
          <button onClick={() => setIsAIModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
            <Sparkles size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
              <p className="text-gray-500">Track your lending portfolio performance</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Lent" value={formatCurrency(totalLent)} color="text-gray-900" />
              <StatCard title="Total Repaid" value={formatCurrency(totalRepaid)} color="text-emerald-600" />
              <StatCard title="Total Interest" value={formatCurrency(totalInterest)} color="text-indigo-600" sub="Fixed Amount" />
              <StatCard title="Outstanding Balance" value={formatCurrency(totalOutstanding)} color="text-rose-600" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-6">Portfolio Distribution</h3>
              <div className="h-64 w-full">
                {borrowers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="Borrowed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Balance" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No active loans</p>
                    <button onClick={() => setView('add')} className="text-indigo-600 text-sm mt-2 font-medium">Create one now</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Recent Borrowers</h3>
                <button onClick={() => setView('borrowers')} className="text-sm text-indigo-600 font-medium">View All</button>
              </div>
              <div className="divide-y divide-gray-50">
                {borrowers.slice(0, 5).map(b => (
                   <div key={b.id} onClick={() => { setSelectedBorrowerId(b.id); setView('details'); }} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                         {b.name.charAt(0)}
                       </div>
                       <div>
                         <p className="font-medium text-gray-900">{b.name}</p>
                         <p className="text-xs text-gray-500">Interest: {formatCurrency(b.fixedInterest || 0)}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-gray-900">{formatCurrency(calculateSummary(b).remainingBalance)}</p>
                       <p className="text-xs text-gray-500">Due</p>
                     </div>
                   </div>
                ))}
                {borrowers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No data found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BORROWER LIST VIEW */}
        {view === 'borrowers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">All Borrowers</h1>
                <button 
                  onClick={handleExportCSV}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Export to CSV"
                >
                  <Download size={20} />
                </button>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBorrowers.map(b => {
                const s = calculateSummary(b);
                const status = getStatusParams(s.remainingBalance);
                return (
                  <div key={b.id} onClick={() => { setSelectedBorrowerId(b.id); setView('details'); }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="text-gray-400" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{b.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 ${status.className}`}>
                             {status.icon} {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Since {formatDate(b.startDate)}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                        +{formatCurrency(b.fixedInterest || 0)} Interest
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Principal</p>
                        <p className="font-medium">{formatCurrency(s.principal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance Due</p>
                        <p className={`font-bold ${s.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(s.remainingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredBorrowers.length === 0 && borrowers.length > 0 && (
               <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                 <p>No borrowers match your search.</p>
                 <button onClick={() => setSearchQuery('')} className="text-indigo-600 font-medium text-sm mt-2">Clear search</button>
               </div>
            )}
             {borrowers.length === 0 && (
               <div className="text-center py-12 text-gray-400">
                 <p>No borrowers yet.</p>
               </div>
            )}
          </div>
        )}

        {/* ADD LOAN VIEW */}
        {view === 'add' && (
          <div className="max-w-xl mx-auto">
             <header className="mb-6 flex items-center gap-2">
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowDownLeft className="rotate-45" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Issue New Loan</h1>
            </header>

            <form onSubmit={handleAddBorrower} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Borrower Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Principal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">$</span>
                    <input 
                      type="number" 
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      onKeyDown={preventInvalidNumberInput}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 20000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Interest ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">$</span>
                    <input 
                      type="number" 
                      value={newInterest}
                      onChange={e => setNewInterest(e.target.value)}
                      onKeyDown={preventInvalidNumberInput}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 10000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                  placeholder="Add any details about this loan..."
                />
              </div>

              <div className="flex gap-3">
                 <button 
                  type="button" 
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors"
                 >
                   Clear Form
                 </button>
                 <button 
                  type="submit" 
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                 >
                   Confirm & Issue Loan
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAILS VIEW */}
        {view === 'details' && selectedBorrower && selectedSummary && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView('borrowers'); setIsEditing(false); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowDownLeft className="rotate-45" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedBorrower.name}</h1>
                    {(() => {
                      const status = getStatusParams(selectedSummary.remainingBalance);
                      return (
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${status.className}`}>
                            {status.icon} {status.label}
                         </span>
                      );
                    })()}
                  </div>
                  <p className="text-gray-500 text-sm">Loan started {formatDate(selectedBorrower.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => startEditing(selectedBorrower)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  title="Edit Borrower"
                >
                  <Pencil size={20} />
                </button>
                <button 
                  onClick={() => deleteBorrower(selectedBorrower.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  title="Delete Borrower"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </header>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                 <h3 className="font-bold text-lg text-gray-800">Edit Loan Details</h3>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Borrower Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Principal ($)</label>
                    <input 
                      type="number" 
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      onKeyDown={preventInvalidNumberInput}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Interest ($)</label>
                    <input 
                      type="number" 
                      value={newInterest}
                      onChange={e => setNewInterest(e.target.value)}
                      onKeyDown={preventInvalidNumberInput}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Principal</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(selectedSummary.principal)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Fixed Interest</p>
                    <p className="text-xl font-bold mt-1 text-indigo-600">+{formatCurrency(selectedSummary.interestAccrued)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Paid</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">-{formatCurrency(selectedSummary.totalRepaid)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white">
                    <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Remaining</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(selectedSummary.remainingBalance)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Repayment Form */}
                  <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet size={18} /> Record Repayment
                      </h3>
                      <form onSubmit={handleAddRepayment} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <input 
                              type="number" 
                              value={repayAmount}
                              onChange={e => setRepayAmount(e.target.value)}
                              onKeyDown={preventInvalidNumberInput}
                              min="0"
                              step="0.01"
                              className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                          <input 
                            type="date" 
                            value={repayDate}
                            onChange={e => setRepayDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Note (Optional)</label>
                          <input 
                            type="text" 
                            value={repayNote}
                            onChange={e => setRepayNote(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Bank Transfer"
                          />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors">
                          Add Payment
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[600px]">
                      <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-bold text-gray-800">History</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{selectedBorrower.transactions.length} Transactions</span>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar">
                        {(() => {
                           // Logic to group by date
                           const sorted = [...selectedBorrower.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                           const groups: Record<string, typeof selectedBorrower.transactions> = {};
                           sorted.forEach(t => {
                             if (!groups[t.date]) groups[t.date] = [];
                             groups[t.date].push(t);
                           });
                           
                           if (Object.keys(groups).length === 0) {
                             return <div className="p-8 text-center text-gray-400">No transactions yet.</div>;
                           }

                           return Object.keys(groups).map(date => (
                             <div key={date}>
                               <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 border-b border-gray-100 flex items-center gap-2">
                                 <Calendar size={12} />
                                 {formatDate(date)}
                               </div>
                               <div className="divide-y divide-gray-50">
                                 {groups[date].map(t => (
                                   <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                                     <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
                                          t.type === 'LOAN' 
                                            ? 'bg-white border-red-100 text-red-500' 
                                            : 'bg-white border-emerald-100 text-emerald-500'
                                       }`}>
                                         {t.type === 'LOAN' ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
                                       </div>
                                       <div>
                                         <p className={`text-sm font-bold ${t.type === 'LOAN' ? 'text-gray-900' : 'text-gray-900'}`}>
                                           {t.type === 'LOAN' ? 'Loan Given' : 'Payment Received'}
                                         </p>
                                         {t.note && (
                                           <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">
                                             {t.note}
                                           </p>
                                         )}
                                       </div>
                                     </div>
                                     <div className="text-right">
                                       <span className={`text-base font-bold font-mono ${t.type === 'LOAN' ? 'text-red-600' : 'text-emerald-600'}`}>
                                         {t.type === 'LOAN' ? '-' : '+'}{formatCurrency(t.amount)}
                                       </span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-30">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center ${view === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </button>
        <button onClick={() => setView('borrowers')} className={`flex flex-col items-center ${view === 'borrowers' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <Users size={20} />
          <span className="text-[10px] mt-1">People</span>
        </button>
        <button onClick={() => setView('add')} className={`flex flex-col items-center ${view === 'add' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className="bg-indigo-600 text-white p-2 rounded-full -mt-6 shadow-lg border-4 border-white">
            <Plus size={24} />
          </div>
        </button>
        <button className="flex flex-col items-center text-gray-400" onClick={() => setIsAIModalOpen(true)}>
          <Sparkles size={20} />
          <span className="text-[10px] mt-1">AI</span>
        </button>
      </div>

      <AIChatModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        borrowers={borrowers} 
      />
    </div>
  );
}