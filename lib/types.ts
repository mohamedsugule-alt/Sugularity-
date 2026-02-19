// ============================================
// SHARED TYPE DEFINITIONS
// Central type file replacing ad-hoc `any` types
// ============================================

// --- Core Entity Types ---

export interface Area {
    id: string;
    name: string;
    colorHex: string;
    icon: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
}

export interface Task {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number | null;
    energyLevel: string;
    dueDate: Date | null;
    scheduledDate: Date | null;
    rolloverCount: number;
    committedDate: Date | null;
    createdAt: Date;
    notes: string | null;
    area?: { id: string; name: string; colorHex: string };
    project?: { id: string; title: string } | null;
    stream?: { id: string; title: string } | null;
}

export interface Project {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startDate: Date | null;
    targetDate: Date | null;
    areaId: string;
    goalId: string | null;
    coverImage: string | null;
    createdAt: Date;
    area?: Area;
    tasks?: Task[];
    milestones?: Milestone[];
}

export interface Stream {
    id: string;
    title: string;
    description: string | null;
    status: string;
    cadenceType: string;
    targetPerCycle: number;
    currentCycleCount: number;
    cycleStartDate: Date;
    areaId: string;
    goalId: string | null;
    coverImage: string | null;
    daysOfWeek: string | null;
    createdAt: Date;
    area?: Area;
}

export interface Goal {
    id: string;
    title: string;
    description: string | null;
    horizon: string;
    status: string;
    startDate: Date | null;
    targetDate: Date | null;
    areaId: string;
    createdAt: Date;
    area?: Area;
    projects?: Project[];
    streams?: Stream[];
    quarterlyObjectives?: QuarterlyObjective[];
}

export interface QuarterlyObjective {
    id: string;
    title: string;
    quarter: string;
    year: number;
    status: string;
    goalId: string;
    createdAt: Date;
}

export interface Milestone {
    id: string;
    title: string;
    targetDate: Date | null;
    isComplete: boolean;
    projectId: string;
    createdAt: Date;
}

// --- Daily Planning Types ---

export interface DailyOutcome {
    id: string;
    title: string;
    isComplete: boolean;
    project?: { id: string; title: string } | null;
    stream?: { id: string; title: string } | null;
    estimateMinutes?: number;
    sortOrder: number;
}

export interface DailyPlan {
    id: string;
    date: Date;
    outcomes: string | null;
    dailyOutcomes: DailyOutcome[];
    committedTaskIds: string | null;
    status: string;
    closedAt: Date | null;
}

// --- Dashboard Types ---

export interface DashboardStats {
    totalActiveTasks: number;
    overdueTasks: number;
    todayScheduled: number;
    inboxCount: number;
    activeProjects: number;
    activeStreams: number;
    recentCompleted: number;
}

export interface EnhancedDashboardStats extends DashboardStats {
    completionRate: number;
    streakDays: number;
    coldTaskCount: number;
    weeklyCompletions: number[];
}

export interface ProjectHealth {
    healthy: Project[];
    warning: Project[];
    critical: Project[];
}

export interface DashboardProps {
    stats: DashboardStats | EnhancedDashboardStats;
    areas: Area[];
    inboxItems: InboxItem[];
    projectsHealth: ProjectHealth;
    upcomingMilestones: Milestone[];
    streamsBehind: Stream[];
    coldTasks: Task[];
    triageTasks: Task[];
    settings: UserSettings;
    allTasks?: Task[];
    accounts?: { id: string; name: string }[];
    financeCategories?: { id: string; name: string }[];
}

// --- Inbox Types ---

export interface InboxItem {
    id: string;
    title: string;
    notes: string | null;
    createdAt: Date;
    processedAt: Date | null;
}

// --- Finance Types ---

export interface FinanceAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isActive: boolean;
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
    // AI Settings
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
    entityType: string;
    entityData: string | null;
    areaId: string | null;
    projectId: string | null;
    streamId: string | null;
    completedAt: Date;
}
