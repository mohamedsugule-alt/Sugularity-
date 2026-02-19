'use client';

import { useState } from 'react';
import { applyTemplate } from '@/actions/templates';
import {
    LayoutTemplate,
    FolderKanban,
    Repeat,
    Package,
    Heart,
    Briefcase,
    DollarSign,
    GraduationCap,
    Users,
    Home,
    X,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type Template = {
    id: string;
    name: string;
    type: string;
    category: string;
    description: string | null;
    templateData: string;
    isBuiltIn: boolean;
};

type Pillar = {
    id: string;
    name: string;
    colorHex: string;
};

const CATEGORY_ICONS: Record<string, any> = {
    health: Heart,
    career: Briefcase,
    finance: DollarSign,
    learning: GraduationCap,
    family: Users,
    lifeAdmin: Home,
};

const CATEGORY_COLORS: Record<string, string> = {
    health: 'text-emerald-500 bg-emerald-500/10',
    career: 'text-blue-500 bg-blue-500/10',
    finance: 'text-yellow-500 bg-yellow-500/10',
    learning: 'text-purple-500 bg-purple-500/10',
    family: 'text-pink-500 bg-pink-500/10',
    lifeAdmin: 'text-cyan-500 bg-cyan-500/10',
};

const TYPE_ICONS: Record<string, any> = {
    project: FolderKanban,
    ritual: Repeat,
    goalKit: Package,
};

export function TemplatesClient({
    templates,
    pillars,
}: {
    templates: Template[];
    pillars: Pillar[];
}) {
    const [filterType, setFilterType] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [applyConfig, setApplyConfig] = useState({
        pillarId: '',
        customName: '',
        includeOptional: true,
    });
    const [isApplying, setIsApplying] = useState(false);
    const [result, setResult] = useState<any>(null);

    const filteredTemplates = templates.filter((t) => {
        if (filterType && t.type !== filterType) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        return true;
    });

    const groupedTemplates: Record<string, Template[]> = {};
    for (const t of filteredTemplates) {
        if (!groupedTemplates[t.category]) groupedTemplates[t.category] = [];
        groupedTemplates[t.category].push(t);
    }

    const handleApply = async () => {
        if (!selectedTemplate || !applyConfig.pillarId) return;

        setIsApplying(true);
        try {
            const res = await applyTemplate(selectedTemplate.id, {
                pillarId: applyConfig.pillarId,
                customNames: applyConfig.customName ? { project: applyConfig.customName, ritual: applyConfig.customName, goal: applyConfig.customName } : undefined,
                includeOptional: applyConfig.includeOptional,
            });
            setResult(res);
            toast.success('Template applied!');
        } catch (error) {
            toast.error('Failed to apply template');
        } finally {
            setIsApplying(false);
        }
    };

    const getPreview = (template: Template) => {
        try {
            const data = JSON.parse(template.templateData);
            if (template.type === 'project') {
                return (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>{data.milestones?.length || 0} milestones</p>
                        <p>{data.tasks?.length || 0} tasks</p>
                    </div>
                );
            }
            if (template.type === 'ritual') {
                return (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>{data.cadenceType} • {data.targetPerCycle}x target</p>
                        <p>{data.starterTasks?.length || 0} starter tasks</p>
                    </div>
                );
            }
            if (template.type === 'goalKit') {
                return (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Goal + Quarterly Objective</p>
                        <p>{data.project ? '+ Project' : ''} {data.ritual ? '+ Ritual' : ''}</p>
                    </div>
                );
            }
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="project">Projects</option>
                    <option value="ritual">Rituals</option>
                    <option value="goalKit">Goal Kits</option>
                </select>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All Categories</option>
                    <option value="health">Health</option>
                    <option value="career">Career</option>
                    <option value="finance">Finance</option>
                    <option value="learning">Learning</option>
                    <option value="family">Family</option>
                    <option value="lifeAdmin">Life Admin</option>
                </select>
            </div>

            {/* Templates by Category */}
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
                const CategoryIcon = CATEGORY_ICONS[category] || LayoutTemplate;
                const colorClass = CATEGORY_COLORS[category] || 'text-muted-foreground bg-muted';

                return (
                    <div key={category}>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 capitalize">
                            <span className={`p-1.5 rounded-lg ${colorClass}`}>
                                <CategoryIcon className="w-4 h-4" />
                            </span>
                            {category === 'lifeAdmin' ? 'Life Admin' : category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryTemplates.map((template) => {
                                const TypeIcon = TYPE_ICONS[template.type] || LayoutTemplate;
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setApplyConfig({ pillarId: '', customName: '', includeOptional: true });
                                            setResult(null);
                                        }}
                                        className="glass-panel rounded-xl p-4 text-left hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <TypeIcon className="w-5 h-5 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground capitalize">{template.type}</span>
                                        </div>
                                        <h3 className="font-semibold">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}
                                        <div className="mt-3 pt-2 border-t border-border/30">
                                            {getPreview(template)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Apply Modal */}
            {selectedTemplate && !result && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Apply Template</h3>
                            <button onClick={() => setSelectedTemplate(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="font-medium">{selectedTemplate.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Pillar *</label>
                                <select
                                    value={applyConfig.pillarId}
                                    onChange={(e) => setApplyConfig({ ...applyConfig, pillarId: e.target.value })}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Select pillar...</option>
                                    {pillars.map((pillar) => (
                                        <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Custom Name (optional)</label>
                                <input
                                    type="text"
                                    value={applyConfig.customName}
                                    onChange={(e) => setApplyConfig({ ...applyConfig, customName: e.target.value })}
                                    placeholder={selectedTemplate.name}
                                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="includeOptional"
                                    checked={applyConfig.includeOptional}
                                    onChange={(e) => setApplyConfig({ ...applyConfig, includeOptional: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <label htmlFor="includeOptional" className="text-sm">
                                    Include optional tasks
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="flex-1 py-2 bg-muted/50 hover:bg-muted rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={!applyConfig.pillarId || isApplying}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    Apply Template
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {result && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Template Applied!</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mb-6">
                            {result.goal && <p>1 goal created</p>}
                            {result.projects?.length > 0 && <p>{result.projects.length} project(s) created</p>}
                            {result.rituals?.length > 0 && <p>{result.rituals.length} ritual(s) created</p>}
                            {result.tasks?.length > 0 && <p>{result.tasks.length} task(s) created</p>}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedTemplate(null);
                                setResult(null);
                            }}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
