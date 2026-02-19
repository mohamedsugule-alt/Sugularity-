import { useState, useEffect, useTransition } from 'react';
import { X, Save, DollarSign, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { setCategoryBudget, createBudgetCategory, updateBudgetCategory, deleteBudgetCategory } from '@/actions/finance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Category = {
    id: string;
    name: string;
    type: string;
};

type Budget = {
    categoryId: string;
    limitAmount: number;
};

type BudgetModalProps = {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    currentBudgets: Budget[];
};

export function BudgetModal({ isOpen, onClose, categories, currentBudgets }: BudgetModalProps) {
    const router = useRouter();
    const [limits, setLimits] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreating, startTransition] = useTransition();

    // Editing State
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        const initialLimits: Record<string, string> = {};
        currentBudgets.forEach(b => {
            initialLimits[b.categoryId] = b.limitAmount.toString();
        });
        setLimits(initialLimits);
    }, [currentBudgets, isOpen]);

    if (!isOpen) return null;

    const handleUpdateCategory = async (id: string) => {
        if (!editingName.trim()) return;
        try {
            await updateBudgetCategory(id, editingName);
            toast.success('Category renamed');
            setEditingCategoryId(null);
            router.refresh();
        } catch (error) {
            toast.error('Failed to update category');
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Delete category "${name}"? This might affect transactions.`)) return;
        try {
            await deleteBudgetCategory(id);
            toast.success('Category deleted');
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        try {
            const promises = Object.entries(limits).map(([catId, amount]) => {
                const numAmount = parseFloat(amount);
                if (isNaN(numAmount)) return Promise.resolve();
                return setCategoryBudget(catId, numAmount, currentMonth, currentYear);
            });

            await Promise.all(promises);
            toast.success('Budgets updated successfully');
            router.refresh();
            onClose();
        } catch (error) {
            toast.error('Failed to save budgets');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        startTransition(async () => {
            try {
                // Create as 'expense' by default for budget modal
                await createBudgetCategory(newCategoryName, 'expense');
                toast.success('Category created');
                setNewCategoryName('');
                router.refresh();
            } catch (e) {
                toast.error('Failed to create category');
            }
        });
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-lg p-6 bg-card border border-border rounded-xl shadow-xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Monthly Budgets</h2>
                        <p className="text-sm text-muted-foreground">Manage categories and limits.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Create New Category */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name..."
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <button
                        onClick={handleCreateCategory}
                        disabled={isCreating || !newCategoryName.trim()}
                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {expenseCategories.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">No expense categories yet.</p>
                    ) : (
                        expenseCategories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg group">
                                <div className="flex-1">
                                    {editingCategoryId === cat.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="bg-card border border-primary/50 rounded px-2 py-0.5 text-sm w-full focus:outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateCategory(cat.id);
                                                    if (e.key === 'Escape') setEditingCategoryId(null);
                                                }}
                                            />
                                            <button onClick={() => handleUpdateCategory(cat.id)} className="text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingCategoryId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{cat.name}</p>
                                            <button
                                                onClick={() => {
                                                    setEditingCategoryId(cat.id);
                                                    setEditingName(cat.name);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-primary transition-all"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-2 text-muted-foreground text-xs">$</span>
                                    <input
                                        type="number"
                                        value={limits[cat.id] || ''}
                                        onChange={(e) => setLimits(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                        placeholder="0"
                                        className="w-full bg-card border border-border rounded-md pl-6 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="pt-4 mt-4 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 hover:bg-muted rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Budgets'}
                    </button>
                </div>
            </div>
        </div>
    );
}
