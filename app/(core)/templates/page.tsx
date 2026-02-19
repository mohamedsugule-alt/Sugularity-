import { getTemplates, seedBuiltInTemplates } from '@/actions/templates';
import { getPillars } from '@/actions/core';
import { TemplatesClient } from '@/components/templates/TemplatesClient';
import { LayoutTemplate } from 'lucide-react';

export default async function TemplatesPage() {
    // Seed built-in templates if needed
    await seedBuiltInTemplates();

    const [templates, pillars] = await Promise.all([
        getTemplates(),
        getPillars(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <LayoutTemplate className="w-8 h-8 text-primary" />
                    Templates
                </h1>
                <p className="text-muted-foreground mt-1">
                    Pre-built projects, rituals, and goal kits to get started fast.
                </p>
            </div>

            <TemplatesClient templates={templates} pillars={pillars} />
        </div>
    );
}
