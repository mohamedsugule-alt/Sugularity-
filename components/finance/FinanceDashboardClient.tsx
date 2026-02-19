'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, ArrowUpRight, ArrowDownRight, Wallet, ChevronLeft, ChevronRight, AlertTriangle, FileText, Download, Pencil, Trash2 } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { Area, AreaChart, BarChart, Bar, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { createTransaction, exportTransactions, deleteTransaction, deleteAccount } from '@/actions/finance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BudgetModal } from './BudgetModal';
import { AddAccountModal } from './AddAccountModal';
import { AddTransactionModal } from './AddTransactionModal';

type Budget = {
    categoryId: string;
    limitAmount: number;
};

// Stray code removed.
type Account = {
    id: string;
    name: string;
    type: string;
    balance: number;
    colorHex?: string;
};

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: string;
    date: Date;
    account: Account;
    category?: { id: string; name: string; colorHex?: string } | null;
    project?: { title: string } | null;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function FinanceDashboardClient({
    netWorth,
    monthlyBurn,
    accounts,
    recentTransactions,
    categories = [],
    budgets = [],
    spendingByCategory = [],
    cashFlowData = [],
    yearlyStats = [],
    netWorthChange = 0,
    burnChange = 0,
    selectedMonth,
    selectedYear
}: {
    netWorth: number;
    monthlyBurn: number;
    accounts: Account[];
    recentTransactions: Transaction[];
    categories?: { id: string; name: string; type: string; colorHex?: string }[];
    budgets?: Budget[];
    spendingByCategory?: { name: string; value: number; color: string; categoryId: string | null }[];
    cashFlowData?: { name: string; income: number; expense: number }[];
    yearlyStats?: { name: string; income: number; expense: number }[];
    netWorthChange?: number;
    burnChange?: number;
    selectedMonth: number;
    selectedYear: number;
}) {
    const router = useRouter();
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isPending, setIsPending] = useState(false); // Using simple state for visual feedback until route change
    const [displayMonth, setDisplayMonth] = useState(selectedMonth);
    const [displayYear, setDisplayYear] = useState(selectedYear);
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        setDisplayMonth(selectedMonth);
        setDisplayYear(selectedYear);
        setIsPending(false);
    }, [selectedMonth, selectedYear]);

    // ... (Navigation handlers remain same) ...

    // Date Navigation
    const currentDate = new Date(displayYear, displayMonth - 1, 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const handleMonthSelect = (monthIndex: number) => {
        const newMonth = monthIndex + 1;
        if (newMonth === displayMonth && displayYear === selectedYear) return;

        setDisplayMonth(newMonth);
        setIsPending(true);
        router.push(`/finance?month=${newMonth}&year=${displayYear}`);
    };

    const handleYearChange = (direction: 'prev' | 'next') => {
        const newYear = direction === 'prev' ? displayYear - 1 : displayYear + 1;
        setDisplayYear(newYear);
        setIsPending(true);
        router.push(`/finance?month=${displayMonth}&year=${newYear}`);
    };



    // Real Category Data (Already Enriched from Server)
    const categoryData = spendingByCategory && spendingByCategory.length > 0
        ? spendingByCategory
        : [
            // Fallback for empty state to look nice
            { name: 'No Expenses Yet', value: 1, color: '#27272a' }
        ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleExport = async () => {
        try {
            toast.loading('Generating report...');
            const data = await exportTransactions(displayYear, viewMode === 'monthly' ? displayMonth : undefined);

            if (!data || data.length === 0) {
                toast.dismiss();
                toast.error('No transactions found to export.');
                return;
            }

            // Generate CSV
            const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account'];
            const rows = data.map(tx => [
                new Date(tx.date).toLocaleDateString(),
                `"${tx.description.replace(/"/g, '""')}"`,
                tx.amount.toFixed(2),
                tx.type,
                `"${(tx.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
                `"${tx.account.name.replace(/"/g, '""')}"`
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `statement_${viewMode}_${displayYear}${viewMode === 'monthly' ? `_${displayMonth}` : ''}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss();
            toast.success('Report downloaded');
        } catch (e) {
            toast.dismiss();
            toast.error('Failed to export report');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Visual Date Navigator */}
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-2 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Year Controls */}
                <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg">
                    <button
                        onClick={() => handleYearChange('prev')}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-bold min-w-[3rem] text-center">{selectedYear}</span>
                    <button
                        onClick={() => handleYearChange('next')}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Month Strip */}
                <div className={`flex-1 w-full overflow-x-auto ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-1 min-w-max px-2">
                        {months.map((m, i) => {
                            const isSelected = displayMonth === i + 1;
                            return (
                                <button
                                    key={m}
                                    onClick={() => handleMonthSelect(i)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                                        ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }
                                    `}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Net Worth */}
                {/* Net Worth */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Net Worth</p>
                        <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(netWorth)}</h2>
                        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${netWorthChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {netWorthChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{netWorthChange >= 0 ? '+' : ''}{netWorthChange.toFixed(1)}%</span>
                            <span className="text-muted-foreground font-normal ml-1">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Burn */}
                {/* Net Worth */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Burn</p>
                        <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(monthlyBurn)}</h2>
                        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${burnChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {burnChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            <span>{burnChange >= 0 ? '+' : ''}{burnChange.toFixed(1)}%</span>
                            <span className="text-muted-foreground font-normal ml-1">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {/* Quick Actions */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl flex flex-col justify-center gap-3">
                    <button
                        suppressHydrationWarning
                        onClick={() => setShowAddTransaction(true)}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-5 h-5" />
                        Add Transaction
                    </button>
                    <button
                        suppressHydrationWarning
                        onClick={() => setShowAddAccount(true)}
                        className="w-full py-3 bg-muted/50 text-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-muted transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Account
                    </button>
                    <button
                        suppressHydrationWarning
                        onClick={() => setShowBudgetModal(true)}
                        className="w-full py-3 bg-muted/50 text-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-muted transition-all"
                    >
                        <CreditCard className="w-5 h-5" />
                        Set Budgets
                    </button>
                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-muted/50 text-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-muted transition-all border border-transparent hover:border-primary/20"
                    >
                        <FileText className="w-5 h-5" />
                        Download {viewMode === 'monthly' ? 'Statement' : 'Yearly Report'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Income vs Expense Chart */}
                <div className="lg:col-span-2 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            {viewMode === 'monthly' ? 'Monthly Cash Flow' : 'Yearly Overview'}
                        </h3>
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setViewMode('yearly')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'yearly' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={viewMode === 'monthly' ? cashFlowData : yearlyStats}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spending Breakdown */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl">
                    <h3 className="font-semibold mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Spending Split
                    </h3>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold">{formatCurrency(monthlyBurn)}</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="mt-4 space-y-2">
                        {categoryData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="font-medium">{monthlyBurn > 0 ? Math.round((item.value / monthlyBurn) * 100) : 0}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Budgets Row */}
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Monthly Budgets
                    </h3>
                    <button
                        onClick={() => setShowBudgetModal(true)}
                        className="text-xs text-primary hover:underline"
                    >
                        Manage Budgets
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.length === 0 ? (
                        <p className="text-muted-foreground text-sm col-span-full text-center py-4">No budgets set. Click "Manage Budgets" to start.</p>
                    ) : (
                        budgets.map(budget => {
                            const cat = categories.find(c => c.id === budget.categoryId);
                            const spentItem = spendingByCategory.find(s => s.categoryId === budget.categoryId);
                            const spent = spentItem?.value || 0;
                            const percentage = Math.min((spent / budget.limitAmount) * 100, 100);
                            const isOver = spent > budget.limitAmount;
                            const barColor = isOver ? '#f43f5e' : (cat?.colorHex || '#10b981');

                            return (
                                <div key={budget.categoryId} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            {isOver && <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
                                            <span className="font-medium">{cat?.name || 'Unknown'}</span>
                                        </div>
                                        <span className={isOver ? 'text-rose-500 font-bold' : 'text-muted-foreground'}>
                                            {formatCurrency(spent)} <span className="text-muted-foreground/50">/ {formatCurrency(budget.limitAmount)}</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                        />
                                    </div>
                                    <p className="text-xs text-right text-muted-foreground">{Math.round((spent / budget.limitAmount) * 100)}%</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Recent Transactions & Accounts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Recent Transactions</h3>
                        <button className="text-xs text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {recentTransactions.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet.</p>
                        ) : (
                            recentTransactions.map(tx => (
                                <div key={tx.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(tx.date), 'MMM d')} • {tx.account.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingTransaction(tx);
                                                    setShowAddTransaction(true);
                                                }}
                                                className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Delete transaction?')) {
                                                        await deleteTransaction(tx.id);
                                                        toast.success('Deleted');
                                                        router.refresh();
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Accounts List */}
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Accounts</h3>
                        <button
                            onClick={() => {
                                setEditingAccount(null);
                                setShowAddAccount(true);
                            }}
                            className="text-xs text-primary hover:underline"
                        >
                            Add Account
                        </button>
                    </div>
                    <div className="space-y-3">
                        {accounts.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">No accounts linked.</p>
                        ) : (
                            accounts.map(acc => (
                                <div key={acc.id} className="p-4 border border-border/50 rounded-lg flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            {acc.type === 'bank' ? <Wallet className="w-5 h-5 opacity-70" /> : <CreditCard className="w-5 h-5 opacity-70" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{acc.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(acc.balance)}</p>
                                            {acc.type === 'credit' && <p className="text-xs text-rose-500">Debt</p>}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingAccount(acc);
                                                    setShowAddAccount(true);
                                                }}
                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Delete account "${acc.name}"? This will delete all associated transactions.`)) {
                                                        await deleteAccount(acc.id);
                                                        toast.success('Account deleted');
                                                        router.refresh();
                                                    }
                                                }}
                                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={() => setShowAddTransaction(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center md:hidden hover:scale-110 active:scale-95 transition-all"
                aria-label="Add Transaction"
            >
                <Plus className="w-8 h-8" />
            </button>

            <AddAccountModal
                isOpen={showAddAccount}
                onClose={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                }}
                initialData={editingAccount}
            />

            <AddTransactionModal
                isOpen={showAddTransaction}
                onClose={() => {
                    setShowAddTransaction(false);
                    setEditingTransaction(null);
                }}
                accounts={accounts}
                categories={categories}
                initialData={editingTransaction}
            />

            <BudgetModal
                isOpen={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                categories={categories}
                currentBudgets={budgets} // Will need to pass this prop
            />
        </div>
    );
}
