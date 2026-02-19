'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// Accounts
// ==========================================

export async function getAccounts() {
    return await prisma.financeAccount.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function createAccount(data: { name: string; type: string; balance: number; colorHex?: string }) {
    await prisma.financeAccount.create({
        data: {
            name: data.name,
            type: data.type,
            balance: data.balance,
            colorHex: data.colorHex
        }
    });
    revalidatePath('/finance');
}

export async function updateAccountBalance(id: string, newBalance: number) {
    await prisma.financeAccount.update({
        where: { id },
        data: { balance: newBalance }
    });
    revalidatePath('/finance');
}

export async function updateAccount(id: string, data: { name?: string; type?: string; balance?: number; colorHex?: string }) {
    await prisma.financeAccount.update({
        where: { id },
        data
    });
    revalidatePath('/finance');
}

export async function deleteAccount(id: string) {
    // Optional: Check for transactions and delete them or warn?
    // For now, cascade delete acts if configured in DB, or we delete account and let transactions hang (bad) or delete first.
    // Prisma transaction recommended.

    await prisma.$transaction(async (tx) => {
        await tx.transaction.deleteMany({ where: { accountId: id } });
        await tx.financeAccount.delete({ where: { id } });
    });

    revalidatePath('/finance');
}

// ==========================================
// Transactions
// ==========================================

export async function getTransactions(limit = 20) {
    return await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        include: {
            account: true,
            category: true,
            project: { select: { title: true } },
            ritual: { select: { title: true } },
            goal: { select: { title: true } }
        }
    });
}

export async function createTransaction(data: {
    amount: number;
    description: string;
    date: Date;
    type: string;
    accountId: string;
    categoryId?: string;
    projectId?: string;
    ritualId?: string;
    goalId?: string;
}) {
    // 1. Create Transaction
    const tx = await prisma.transaction.create({
        data: {
            amount: data.amount,
            description: data.description,
            date: data.date,
            type: data.type,
            accountId: data.accountId,
            categoryId: data.categoryId,
            projectId: data.projectId,
            ritualId: data.ritualId,
            goalId: data.goalId
        }
    });

    // 2. Update Account Balance
    const account = await prisma.financeAccount.findUnique({ where: { id: data.accountId } });
    if (account) {
        // Income adds to balance, Expense/Transfer removes (simplified)
        // Adjust logic based on account type? For now simple math.
        let adjustment = 0;
        if (data.type === 'income') adjustment = data.amount;
        if (data.type === 'expense') adjustment = -data.amount;
        if (data.type === 'transfer') adjustment = -data.amount; // Outbound transfer assumed

        await prisma.financeAccount.update({
            where: { id: data.accountId },
            data: { balance: account.balance + adjustment }
        });
    }

    revalidatePath('/finance');
    return tx;
}

export async function updateTransaction(id: string, data: Partial<{
    amount: number;
    description: string;
    date: Date;
    type: string;
    categoryId: string | null;
    projectId: string | null;
    ritualId: string | null;
    goalId: string | null;
    accountId: string;
}>) {
    const original = await prisma.transaction.findUnique({ where: { id } });
    if (!original) throw new Error("Transaction not found");

    // Revert balance impact of original
    const account = await prisma.financeAccount.findUnique({ where: { id: original.accountId } });

    if (account && (data.amount !== undefined || data.type !== undefined)) {
        // 1. Revert Old
        let revertAdjustment = 0;
        if (original.type === 'income') revertAdjustment = -original.amount;
        if (original.type === 'expense') revertAdjustment = original.amount;
        if (original.type === 'transfer') revertAdjustment = original.amount;

        // 2. Apply New (or Old if unchanged)
        const newAmount = data.amount !== undefined ? data.amount : original.amount;
        const newType = data.type || original.type;

        let newAdjustment = 0;
        if (newType === 'income') newAdjustment = newAmount;
        if (newType === 'expense') newAdjustment = -newAmount;
        if (newType === 'transfer') newAdjustment = -newAmount;

        const netChange = revertAdjustment + newAdjustment;

        if (netChange !== 0) {
            await prisma.financeAccount.update({
                where: { id: account.id },
                data: { balance: { increment: netChange } }
            });
        }
    }

    // TODO: Handle Account Transfer (if accountId changed) - Skipping for now as UI doesn't allow changing account easily

    const updated = await prisma.transaction.update({
        where: { id },
        data: {
            amount: data.amount,
            description: data.description,
            date: data.date,
            type: data.type,
            categoryId: data.categoryId,
            projectId: data.projectId,
            ritualId: data.ritualId,
            goalId: data.goalId
        }
    });

    revalidatePath('/finance');
    return updated;
}

export async function deleteTransaction(id: string) {
    const original = await prisma.transaction.findUnique({ where: { id } });
    if (!original) return;

    // Revert balance
    const account = await prisma.financeAccount.findUnique({ where: { id: original.accountId } });
    if (account) {
        let revertAdjustment = 0;
        if (original.type === 'income') revertAdjustment = -original.amount;
        if (original.type === 'expense') revertAdjustment = original.amount;
        if (original.type === 'transfer') revertAdjustment = original.amount;

        await prisma.financeAccount.update({
            where: { id: account.id },
            data: { balance: { increment: revertAdjustment } }
        });
    }

    await prisma.transaction.delete({ where: { id } });
    revalidatePath('/finance');
}

// ==========================================
// Dashboard Stats
// ==========================================

export async function getFinanceStats(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 1); // First day of next month
    const startOfLastMonth = new Date(targetYear, targetMonth - 2, 1);
    const endOfLastMonth = new Date(targetYear, targetMonth - 1, 1);

    const accounts = await prisma.financeAccount.findMany();
    const netWorth = accounts.reduce((sum, acc) => {
        if (acc.type === 'credit') return sum - acc.balance;
        return sum + acc.balance;
    }, 0);

    // Get all transactions for cash flow chart
    const monthlyTransactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: startOfMonth,
                lt: endOfMonth
            }
        }
    });

    // Calculate Cash Flow (Weekly)
    const cashFlow = [
        { name: 'Week 1', income: 0, expense: 0 },
        { name: 'Week 2', income: 0, expense: 0 },
        { name: 'Week 3', income: 0, expense: 0 },
        { name: 'Week 4', income: 0, expense: 0 },
        { name: 'Week 5', income: 0, expense: 0 },
    ];

    monthlyTransactions.forEach(tx => {
        const day = tx.date.getDate();
        const weekIndex = Math.floor((day - 1) / 7); // 0-4
        if (weekIndex < 5) {
            if (tx.type === 'income') {
                cashFlow[weekIndex].income += tx.amount;
            } else {
                cashFlow[weekIndex].expense += tx.amount;
            }
        }
    });

    // Metrics for Comparisons
    const currentStatus = await prisma.transaction.groupBy({
        by: ['type'],
        where: { date: { gte: startOfMonth, lt: endOfMonth } },
        _sum: { amount: true }
    });

    const income = currentStatus.find(s => s.type === 'income')?._sum.amount || 0;
    const expenses = currentStatus.find(s => s.type === 'expense')?._sum.amount || 0;

    const previousStatus = await prisma.transaction.groupBy({
        by: ['type'],
        where: { date: { gte: startOfLastMonth, lt: endOfLastMonth } },
        _sum: { amount: true }
    });

    const lastMonthExpenses = previousStatus.find(s => s.type === 'expense')?._sum.amount || 0;

    // Calculate Changes
    // 1. Burn Comparison (vs Last Month)
    let burnChange = 0;
    if (lastMonthExpenses > 0) {
        burnChange = ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    } else if (expenses > 0) {
        burnChange = 100;
    }

    // 2. Net Worth Growth (Estimated based on this month's flow)
    const netFlow = income - expenses;
    const prevNetWorth = netWorth - netFlow;
    let netWorthChange = 0;
    if (prevNetWorth !== 0) {
        netWorthChange = (netFlow / prevNetWorth) * 100;
    }

    // Category Breakdown
    const categoryStats = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
            type: 'expense',
            date: {
                gte: startOfMonth,
                lt: endOfMonth
            },
            categoryId: { not: null }
        },
        _sum: {
            amount: true
        }
    });

    // Enrich with Category Data (Name & Color)
    const categories = await prisma.budgetCategory.findMany();
    const spendingByCategory = categoryStats.map(stat => {
        const cat = categories.find(c => c.id === stat.categoryId);
        return {
            categoryId: stat.categoryId,
            name: cat?.name || 'Uncategorized',
            value: stat._sum.amount || 0,
            color: cat?.colorHex || '#94a3b8'
        };
    }).sort((a, b) => b.value - a.value);

    return {
        netWorth,
        netWorthChange,
        monthlyBurn: expenses,
        burnChange,
        accounts,
        spendingByCategory,
        cashFlow
    };
}

export async function getYearlyStats(year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: startOfYear,
                lt: endOfYear
            }
        }
    });

    const yearlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        income: 0,
        expense: 0
    }));

    transactions.forEach(tx => {
        const monthIndex = tx.date.getMonth(); // 0-11
        const type = tx.type.toLowerCase().trim();
        if (type === 'income') {
            yearlyData[monthIndex].income += tx.amount;
        } else if (type === 'expense') {
            yearlyData[monthIndex].expense += tx.amount;
        }
    });

    return yearlyData;
}



export async function exportTransactions(year: number, month?: number) {
    const startDate = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);

    const endDate = month
        ? new Date(year, month, 1)
        : new Date(year + 1, 0, 1);

    return await prisma.transaction.findMany({
        where: {
            date: {
                gte: startDate,
                lt: endDate
            }
        },
        include: {
            account: { select: { name: true } },
            category: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
    });
}

// ==========================================
// Categories
// ==========================================

export async function getBudgetCategories() {
    return await prisma.budgetCategory.findMany({
        orderBy: { sortOrder: 'asc' }
    });
}

export async function createBudgetCategory(name: string, type: string, colorHex?: string) {
    const last = await prisma.budgetCategory.findFirst({ orderBy: { sortOrder: 'desc' } });

    return await prisma.budgetCategory.create({
        data: {
            name,
            type,
            colorHex: colorHex || '#94a3b8',
            sortOrder: (last?.sortOrder || 0) + 1
        }
    });
}

export async function updateBudgetCategory(id: string, name: string) {
    await prisma.budgetCategory.update({
        where: { id },
        data: { name }
    });
    revalidatePath('/finance');
}

export async function deleteBudgetCategory(id: string) {
    // Determine if we should cascade or error. 
    // For now, we will attempt to delete. If transactions exist, we might need a better strategy,
    // but the user requirement is just "delete".
    // We'll wrap in try/catch in the UI, but here we just execute.
    // If strict relation exists, this might fail.

    // Optional: Unlink transactions first?
    await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null }
    });

    // Delete associated budgets
    await prisma.budget.deleteMany({
        where: { categoryId: id }
    });

    await prisma.budgetCategory.delete({ where: { id } });
    revalidatePath('/finance');
}

// ==========================================
// Budgets
// ==========================================

export async function getMonthlyBudgets(month: number, year: number) {
    return await prisma.budget.findMany({
        where: { month, year },
        include: { category: true }
    });
}

export async function setCategoryBudget(categoryId: string, amount: number, month: number, year: number) {
    const existing = await prisma.budget.findFirst({
        where: { categoryId, month, year }
    });

    if (existing) {
        // Update
        return await prisma.budget.update({
            where: { id: existing.id },
            data: { limitAmount: amount }
        });
    } else {
        // Create
        return await prisma.budget.create({
            data: {
                categoryId,
                month,
                year,
                limitAmount: amount
            }
        });
    }
}
