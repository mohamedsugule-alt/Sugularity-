'use client';

import { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { createTransaction, createBudgetCategory, updateTransaction } from '@/actions/finance';
import { toast } from 'sonner';

type AddTransactionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    accounts: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    initialData?: any; // Using any to avoid complex type duplication for now.
};

export function AddTransactionModal({ isOpen, onClose, accounts, categories: initialCategories, initialData }: AddTransactionModalProps) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Sync with initialData or reset on open
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setType(initialData.type);
                setAmount(initialData.amount.toString());
                setDescription(initialData.description);
                setAccountId(initialData.account.id);
                setCategoryId(initialData.category?.id || '');
                setDate(new Date(initialData.date).toISOString().split('T')[0]);
            } else {
                setType('expense');
                setAmount('');
                setDescription('');
                setAccountId(accounts[0]?.id || '');
                setCategoryId('');
                setDate(new Date().toISOString().split('T')[0]);
                setIsCreatingCategory(false);
                setNewCategoryName('');
            }
        }
    }, [isOpen, initialData, accounts]);


    // Note: In a real app we'd update this list optimistically or refetch
    // For now we assume the prop is fresh or we don't update local list immediately on create
    // We'll simplisticly handle new category creation inside submit or separately

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalCategoryId = categoryId;

            // Handle ad-hoc category creation
            if (isCreatingCategory && newCategoryName) {
                const newCat = await createBudgetCategory(newCategoryName, type);
                finalCategoryId = newCat.id;
            }

            if (initialData?.id) {
                await updateTransaction(initialData.id, {
                    amount: parseFloat(amount),
                    description,
                    type,
                    date: new Date(date),
                    accountId: accountId || undefined, // Account moves? complex logic in backend I handled
                    categoryId: finalCategoryId || null
                });
                toast.success('Transaction updated');
            } else {
                await createTransaction({
                    amount: parseFloat(amount),
                    description,
                    type,
                    date: new Date(date),
                    accountId,
                    categoryId: finalCategoryId || undefined
                });
                toast.success('Transaction added');
            }

            onClose();
            // Reset form
            setAmount('');
            setDescription('');
            setNewCategoryName('');
            setIsCreatingCategory(false);
        } catch (error) {
            toast.error('Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md p-6 bg-background border border-border rounded-2xl shadow-2xl animate-in zoom-in-95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-6 text-foreground">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Toggle */}
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-background shadow-sm text-rose-500' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-background shadow-sm text-emerald-500' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <ArrowDownRight className="w-4 h-4" />
                            Income
                        </button>
                    </div>

                    {/* Amount & Date Row */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-muted border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === 'income' ? "e.g. Salary, Freelance" : "e.g. Starbucks, Netflix"}
                            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            >
                                <option value="" disabled>Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                            {isCreatingCategory ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="New Category"
                                        className="w-full bg-muted border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingCategory(false)}
                                        className="p-2 hover:bg-muted-foreground/10 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={categoryId}
                                    onChange={(e) => {
                                        if (e.target.value === 'NEW') setIsCreatingCategory(true);
                                        else setCategoryId(e.target.value);
                                    }}
                                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Uncategorized</option>
                                    {initialCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                    <option value="NEW" className="font-semibold text-primary">+ Create New</option>
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-muted rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || accounts.length === 0}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Transaction')}
                        </button>
                    </div>
                    {accounts.length === 0 && (
                        <p className="text-xs text-center text-rose-500">You must add an account first.</p>
                    )}
                </form>
            </div>
        </div>
    );
}
