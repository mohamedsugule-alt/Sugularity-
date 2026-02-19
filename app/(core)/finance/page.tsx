import { getFinanceStats, getTransactions, getBudgetCategories, getMonthlyBudgets, getYearlyStats } from '@/actions/finance';
import { FinanceDashboardClient } from '@/components/finance/FinanceDashboardClient';
import { BadgeDollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinancePage({
    searchParams
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const resolvedParams = await searchParams;
    const now = new Date();
    const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month) : now.getMonth() + 1;
    const currentYear = resolvedParams.year ? parseInt(resolvedParams.year) : now.getFullYear();

    const [stats, transactions, categories, budgets, yearlyStats] = await Promise.all([
        getFinanceStats(currentMonth, currentYear),
        getTransactions(5),
        getBudgetCategories(),
        getMonthlyBudgets(currentMonth, currentYear),
        getYearlyStats(currentYear)
    ]);

    // Sanitization for UI components (null -> undefined)
    const sanitizedAccounts = stats.accounts.map(a => ({
        ...a,
        colorHex: a.colorHex || undefined,
        icon: a.icon || undefined
    }));

    const sanitizedTransactions = transactions.map(t => ({
        ...t,
        category: t.category ? { ...t.category, colorHex: t.category.colorHex || undefined, icon: t.category.icon || undefined } : null,
        account: { ...t.account, colorHex: t.account.colorHex || undefined }
    }));

    const sanitizedCategories = categories.map(c => ({
        ...c,
        colorHex: c.colorHex || undefined,
        icon: c.icon || undefined
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BadgeDollarSign className="w-8 h-8 text-primary" />
                    Finance OS
                </h1>
                <p className="text-muted-foreground mt-1">
                    Track your wealth, manage expenses, and stick to budgets.
                </p>
            </div>

            <FinanceDashboardClient
                netWorth={stats.netWorth}
                monthlyBurn={stats.monthlyBurn}
                accounts={sanitizedAccounts}
                recentTransactions={sanitizedTransactions}
                categories={sanitizedCategories}
                budgets={budgets}
                spendingByCategory={stats.spendingByCategory}
                cashFlowData={stats.cashFlow}
                yearlyStats={yearlyStats}
                netWorthChange={stats.netWorthChange}
                burnChange={stats.burnChange}
                selectedMonth={currentMonth}
                selectedYear={currentYear}
            />
        </div>
    );
}
