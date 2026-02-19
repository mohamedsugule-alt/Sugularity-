'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Banknote } from 'lucide-react';
import { createAccount, updateAccount } from '@/actions/finance';
import { toast } from 'sonner';

type Account = {
    id: string;
    name: string;
    type: string;
    balance: number;
    colorHex?: string;
};

type AddAccountModalProps = {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Account | null;
};

export function AddAccountModal({ isOpen, onClose, initialData }: AddAccountModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('checking');
    const [balance, setBalance] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type);
            setBalance(initialData.balance.toString());
        } else {
            setName('');
            setType('checking');
            setBalance('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData) {
                await updateAccount(initialData.id, {
                    name,
                    type,
                    balance: parseFloat(balance) || 0
                });
                toast.success('Account updated');
            } else {
                await createAccount({
                    name,
                    type,
                    balance: parseFloat(balance) || 0
                });
                toast.success('Account created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(initialData ? 'Failed to update account' : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-xl animate-in zoom-in-95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-1">{initialData ? 'Edit Account' : 'Add Account'}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    {initialData ? 'Update account details.' : 'Track a new bank account, credit card, or cash wallet.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Account Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Chase Sapphire, Main Checking"
                            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Account Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['checking', 'credit', 'cash'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${type === t
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                                        }`}
                                >
                                    {t === 'checking' && <Wallet className="w-5 h-5" />}
                                    {t === 'credit' && <CreditCard className="w-5 h-5" />}
                                    {t === 'cash' && <Banknote className="w-5 h-5" />}
                                    <span className="text-xs capitalize font-medium">{t}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">{initialData ? 'Balance (Modify manually)' : 'Current Balance'}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {initialData ? 'Updating this overrides the calculated balance.' : (type === 'credit' ? 'Enter positive number for debt.' : 'Current available balance.')}
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-muted rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
