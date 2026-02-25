// ============================================
// SHARED TYPE DEFINITIONS
// Central type file — all types use proper union literals
// ============================================

// --- Union Type Primitives ---

export type TaskStatus = 'active' | 'scheduled' | 'blocked' | 'someday' | 'done' | 'archived';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type ProjectStatus = 'active' | 'completed' | 'archived';
export type RitualCadence = 'daily' | 'weekly' | 'monthly';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type DailyPlanStatus = 'open' | 'closed';
export type AutomationSeverity = 'info' | 'warning' | 'critical';
export type AutomationName =
    | 'weeklyReview'
    | 'dailyReview'
    | 'inboxThreshold'
    | 'coldCleanup'
    | 'rolloverTriage'
    | 'bankruptcy'
    | 'capacityWarning'
    | 'meetingHeavy'
    | 'stalledProject'
    | 'ritualNudge'
    | 'scheduleOutcomes'
    | 'brokenLink';

// --- Core Entity Types ---

export interface Pillar {
    id: string;
    name: string;
    colorHex: string;
    icon: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
}

/** @deprecated Use Pillar */
export type Area = Pillar;

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    estimateMinutes: number | null;
    energyLevel: EnergyLevel;
    dueDate: Date | null;
    scheduledDate: Date | null;
    rolloverCount: number;
    committedDate: Date | null;
    lastTouchedAt?: Date;
    blockedReason?: string | null;
    calendarLinkBroken?: boolean;
    createdAt: Date;
    notes: string | null;
    // Relations — current naming
    pillar?: { id: string; name: string; colorHex: string } | null;
    project?: { id: string; title: string } | null;
    ritual?: { id: string; title: string } | null;
    // Relations — backward compat aliases
    area?: { id: string; name: string; colorHex: string } | null;
    stream?: { id: string; title: string } | null;
}

export interface Project {
    id: string;
    title: string;
    description: string | null;
    status: ProjectStatus;
    startDate: Date | null;
    deadline: Date | null;
    /** @deprecated Use deadline */
    targetDate?: Date | null;
    pillarId: string;
    /** @deprecated Use pillarId */
    areaId?: string;
    goalId: string | null;
    coverImage: string | null;
    createdAt: Date;
    lastActivityAt?: Date;
    completedAt?: Date | null;
    pillar?: Pillar | null;
    /** @deprecated Use pillar */
    area?: Pillar | null;
    tasks?: Task[];
    milestones?: Milestone[];
}

export interface Ritual {
    id: string;
    title: string;
    description: string | null;
    status: string;
    cadenceType: RitualCadence;
    targetPerCycle: number;
    currentCycleCount: number;
    currentCycleStart: Date;
    /** @deprecated Use currentCycleStart */
    cycleStartDate?: Date;
    pillarId: string;
    /** @deprecated Use pillarId */
    areaId?: string;
    goalId: string | null;
    coverImage: string | null;
    daysOfWeek: string | null;
    createdAt: Date;
    pillar?: Pillar | null;
    /** @deprecated Use pillar */
    area?: Pillar | null;
}

/** @deprecated Use Ritual */
export type Stream = Ritual;

export interface Goal {
    id: string;
    title: string;
    description: string | null;
    horizon?: string;
    status: GoalStatus;
    startDate: Date | null;
    targetDate: Date | null;
    pillarId: string;
    /** @deprecated Use pillarId */
    areaId?: string;
    createdAt: Date;
    pillar?: Pillar | null;
    /** @deprecated Use pillar */
    area?: Pillar | null;
    projects?: Project[];
    rituals?: Ritual[];
    /** @deprecated Use rituals */
    streams?: Ritual[];
    quarterlyObjectives?: QuarterlyObjective[];
    // Health data (from getGoalsWithHealth)
    health?: 'on_track' | 'watch' | 'at_risk';
    progressEstimate?: number;
    reasons?: string[];
}

export interface QuarterlyObjective {
    id: string;
    title: string;
    quarter: string;
    year?: number;
    status: string;
    description?: string | null;
    goalId: string;
    createdAt: Date;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string | null;
    targetDate: Date | null;
    status?: string;
    isComplete?: boolean;
    sortOrder?: number;
    projectId: string;
    createdAt: Date;
    completedAt?: Date | null;
}

// --- Daily Planning Types ---

export interface DailyOutcome {
    id: string;
    title: string;
    isComplete: boolean;
    project?: { id: string; title: string } | null;
    ritual?: { id: string; title: string } | null;
    /** @deprecated Use ritual */
    stream?: { id: string; title: string } | null;
    estimateMinutes?: number;
    sortOrder: number;
}

export interface DailyPlan {
    id: string;
    date: Date;
    outcomes?: string | null;
    dailyOutcomes: DailyOutcome[];
    committedTaskIds: string | null;
    status: DailyPlanStatus;
    closedAt: Date | null;
}

// --- Dashboard Types ---

export interface DashboardStats {
    totalActiveTasks: number;
    overdueTasks: number;
    todayScheduled: number;
    inboxCount: number;
    activeProjects: number;
    /** @deprecated Use activeRituals */
    activeStreams?: number;
    activeRituals?: number;
    recentCompleted: number;
}

export interface EnhancedDashboardStats extends DashboardStats {
    completionRate: number;
    streakDays: number;
    coldTaskCount: number;
    weeklyCompletions: number[];
    todayScheduledMinutes: number;
    completedCount: number;
    remainingCount: number;
    activeTasks: number;
}

export interface ProjectHealth {
    healthy?: Project[];
    warning?: Project[];
    critical?: Project[];
    atRisk?: Array<{ id: string; title: string; health?: string }>;
    watch?: Array<{ id: string; title: string; health?: string }>;
}

export interface DashboardProps {
    stats: DashboardStats | EnhancedDashboardStats;
    pillars?: Pillar[];
    /** @deprecated Use pillars */
    areas?: Pillar[];
    inboxItems: InboxItem[];
    projectsHealth: ProjectHealth;
    upcomingMilestones: Milestone[];
    ritualsBehind?: Ritual[];
    /** @deprecated Use ritualsBehind */
    streamsBehind?: Ritual[];
    coldTasks: Task[];
    triageTasks: Task[];
    settings: UserSettings;
    allTasks?: Task[];
    accounts?: { id: string; name: string }[];
    financeCategories?: { id: string; name: string }[];
    streakData?: { streak: number; sparkline: number[] };
    showWelcome?: boolean;
}

// --- Inbox Types ---

export interface InboxItem {
    id: string;
    title: string;
    notes: string | null;
    createdAt: Date;
    processedAt: Date | null;
    energyLevel?: EnergyLevel | null;
    scheduledDate?: Date | null;
    snoozedUntil?: Date | null;
}

// --- Finance Types ---

export interface FinanceAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isActive: boolean;
    colorHex?: string;
    icon?: string;
}

export interface FinanceTransaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    date: Date;
    accountId: string;
    categoryId: string | null;
    account?: FinanceAccount;
    category?: { id: string; name: string } | null;
}

// --- Settings Types ---

export interface UserSettings {
    id: string;
    dailyCapacityHours: number;
    defaultEstimateMin: number;
    requireEstimate: boolean;
    workDayStart: string;
    workDayEnd: string;
    coldTaskDays: number;
    staleProjectDays: number;
    backlogActiveLimit: number;
    backlogColdLimit: number;
    backlogProjectLimit: number;
    showColdInToday: boolean;
    calendarMode: string;
    dashboardCoverImage: string | null;
    aiProvider: string;
    aiModel: string;
    aiEndpoint: string;
    aiApiKey: string;
    aiContextWindow: number;
    aiTemperature: number;
}

// --- Archive Types ---

export interface ArchiveRecord {
    id: string;
    title: string;
    notes?: string | null;
    originalTaskId?: string | null;
    entityType?: string;
    entityData?: string | null;
    pillarId?: string | null;
    pillarName?: string | null;
    /** @deprecated Use pillarId */
    areaId?: string | null;
    projectId?: string | null;
    projectName?: string | null;
    ritualId?: string | null;
    ritualName?: string | null;
    /** @deprecated Use ritualId */
    streamId?: string | null;
    goalId?: string | null;
    goalName?: string | null;
    estimateMinutes?: number | null;
    energyLevel?: EnergyLevel | null;
    rolloverCount?: number;
    completionNote?: string | null;
    completedAt: Date;
    createdAt?: Date;
}

// --- Triage Types ---

export type TriageDecision =
    | { type: 'schedule'; scheduledDate: Date }
    | { type: 'defer'; reason: string; reviewOn: Date }
    | { type: 'blocked'; reason: string }
    | { type: 'someday' }
    | { type: 'archive' }
    | { type: 'delete' };

// --- Automation Types ---

export interface AutomationPrompt {
    name: AutomationName;
    title: string;
    message: string;
    triggerReason: string;
    actions: Array<{
        label: string;
        action: 'accept' | 'decline' | 'snooze' | 'resolve';
        href?: string;
    }>;
    severity: AutomationSeverity;
}

// --- RAG Types ---

export interface RagChunk {
    id: string;
    entityType: string;
    entityId: string;
    content: string;
    metadata?: string | null;
    updatedAt?: Date;
    score?: number;
    preview?: string;
}

// --- Ritual Entry ---

export interface RitualEntry {
    id: string;
    ritualId: string;
    date: Date;
    status: 'completed' | 'missed' | 'skipped';
}

// --- Focus Session ---

export interface FocusSession {
    id: string;
    taskId: string | null;
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
    notes: string | null;
}
