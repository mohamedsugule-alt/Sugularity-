'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// JOB APPLICATION ACTIONS
// ============================================

// Note: JobStage type and JOB_STAGES constant moved to JobTrackerClient.tsx
// to avoid 'use server' export restrictions

const VALID_STAGES = ['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected'] as const;
type JobStageInternal = typeof VALID_STAGES[number];

// Helper to get connected ritual
async function getJobHuntingRitualId() {
    const settings = await prisma.userSettings.findFirst();
    return settings?.jobHuntingRitualId;
}

// Sync job application to ritual progress
async function syncJobRitual(ritualId: string) {
    const ritual = await prisma.ritual.findUnique({
        where: { id: ritualId },
        include: { cycleRecords: { orderBy: { cycleStart: 'desc' }, take: 1 } }
    });

    if (!ritual || ritual.status !== 'active') return;

    // Find current cycle start
    const now = new Date();
    // Assuming weekly cycle starts on Monday or Sunday depending on ritual logic.
    // For simplicity, we'll use the 'currentCycleStart' from ritual info if available, or fallback to start of week.
    let cycleStart = ritual.currentCycleStart;

    // Check if ritual cycle is stale (older than 7 days) - this is a rough check
    // Ideally this should use the proper cycle engine logic, but for this quick sync:
    if (now.getTime() - cycleStart.getTime() > 7 * 24 * 60 * 60 * 1000) {
        // Cycle is old, we might need to rely on the proper engine to roll it.
        // For now, let's just count applications in the last 7 days as a proxy if we can't fully manage cycles here.
        cycleStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Count jobs where appliedDate >= cycleStart
    const appliedCount = await prisma.jobApplication.count({
        where: {
            appliedDate: { gte: cycleStart },
            stage: { not: 'wishlist' } // Anything not in wishlist counts as applied/active
        }
    });

    // Update Ritual
    await prisma.ritual.update({
        where: { id: ritualId },
        data: { currentCycleCount: appliedCount }
    });
}

export async function linkJobHuntingRitual(ritualId: string) {
    const settings = await prisma.userSettings.findFirst();
    if (settings) {
        await prisma.userSettings.update({
            where: { id: settings.id },
            data: { jobHuntingRitualId: ritualId }
        });
    } else {
        await prisma.userSettings.create({
            data: { jobHuntingRitualId: ritualId }
        });
    }
    revalidatePath('/career/job-tracker');
}

export async function getLinkedRitual() {
    const ritualId = await getJobHuntingRitualId();
    if (!ritualId) return null;
    return prisma.ritual.findUnique({ where: { id: ritualId } });
}

export async function getJobApplications() {
    return prisma.jobApplication.findMany({
        orderBy: [
            { stage: 'asc' },
            { lastActivityAt: 'desc' },
        ],
    });
}

export async function getJobApplicationsByStage() {
    const jobs = await prisma.jobApplication.findMany({
        orderBy: { lastActivityAt: 'desc' },
    });

    // Group by stage
    const grouped: Record<JobStageInternal, typeof jobs> = {
        wishlist: [],
        applied: [],
        screening: [],
        interview: [],
        offer: [],
        rejected: [],
    };

    for (const job of jobs) {
        const stage = job.stage as JobStageInternal;
        if (grouped[stage]) {
            grouped[stage].push(job);
        }
    }

    return grouped;
}


// ============================================
// ANALYTICS & UTILS
// ============================================

export async function fetchCompanyLogo(companyName: string): Promise<string | null> {
    try {
        // Simple heuristic: try to guess domain or use clearbit's autocomplete API (mocked here by direct guessing)
        // For a real app, we might use a proper enrichment API.
        // For now, let's try a direct logo fetch from clearbit using the name as domain if it looks like one, or searching.
        // Actually, simplest 'free' way is assuming company name + .com or using an image search.
        // Clearbit Logo API is: https://logo.clearbit.com/spotify.com

        // Naive clean: "Spotify Inc." -> "spotify"
        const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const domain = `${cleanName}.com`;

        // verification fetch
        const url = `https://logo.clearbit.com/${domain}`;
        const res = await fetch(url, { method: 'HEAD' });

        if (res.ok) {
            return url;
        }
        return null;
    } catch (e) {
        return null; // Fail silently
    }
}

export async function analyzeJobPerformance() {
    const jobs = await prisma.jobApplication.findMany({
        orderBy: { appliedDate: 'desc' }
    });

    // 1. Funnel (Conversion Rates)
    const stages = ['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected'];
    const counts = stages.reduce((acc, stage) => {
        acc[stage] = jobs.filter(j => j.stage === stage).length;
        return acc;
    }, {} as Record<string, number>);

    // "Passed Through" counts (approximate, assuming linear progression)
    // Applied = Applied + Screening + Interview + Offer + Rejected
    // Screening = Screening + Interview + Offer
    // Interview = Interview + Offer
    // Offer = Offer
    const funnel = {
        applied: counts.applied + counts.screening + counts.interview + counts.offer + counts.rejected,
        screening: counts.screening + counts.interview + counts.offer,
        interview: counts.interview + counts.offer,
        offer: counts.offer,
    };

    const rates = {
        applicationToScreen: funnel.applied > 0 ? Math.round((funnel.screening / funnel.applied) * 100) : 0,
        screenToInterview: funnel.screening > 0 ? Math.round((funnel.interview / funnel.screening) * 100) : 0,
        interviewToOffer: funnel.interview > 0 ? Math.round((funnel.offer / funnel.interview) * 100) : 0,
    };

    // 2. Velocity (Applications per Week)
    const weeks: Record<string, number> = {};
    const now = new Date();

    // Init last 8 weeks
    for (let i = 0; i < 8; i++) {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10); // Simple key, effectively grouping by approx week buckets would be better but this is for chart
        // Let's use Week Number for better grouping
        const weekNum = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);
        weeks[`W${weekNum}`] = 0;
    }

    jobs.forEach(job => {
        if (job.appliedDate) {
            const d = new Date(job.appliedDate);
            const weekNum = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);
            const key = `W${weekNum}`;
            if (weeks[key] !== undefined) weeks[key]++;
            else weeks[key] = 1; // For older weeks
        }
    });

    const velocity = Object.entries(weeks).map(([name, value]) => ({ name, value })).reverse(); // Oldest first

    // 3. Staleness (Active jobs with no update in 14 days)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const staleJobs = jobs.filter(j =>
        ['applied', 'screening'].includes(j.stage) &&
        j.lastActivityAt < twoWeeksAgo
    );

    return {
        counts,
        funnel,
        rates,
        velocity,
        staleCount: staleJobs.length,
        totalActive: jobs.filter(j => !['wishlist', 'rejected'].includes(j.stage)).length
    };
}

export async function createJobApplication(data: {
    company: string;
    role: string;
    stage?: string;
    salary?: string;
    location?: string;
    jobLink?: string;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    appliedDate?: Date;
    logoUrl?: string; // Manual override
}) {
    // Attempt auto-logo if not provided
    let logoUrl = data.logoUrl;
    if (!logoUrl) {
        logoUrl = await fetchCompanyLogo(data.company) || undefined;
    }

    const job = await prisma.jobApplication.create({
        data: {
            company: data.company,
            role: data.role,
            stage: data.stage || 'wishlist',
            salary: data.salary || null,
            location: data.location || null,
            jobLink: data.jobLink || null,
            notes: data.notes || null,
            contactName: data.contactName || null,
            contactEmail: data.contactEmail || null,
            appliedDate: (data.stage === 'applied') ? new Date() : (data.appliedDate || null),
            logoUrl: logoUrl,
            // Init history
            history: JSON.stringify([{ stage: data.stage || 'wishlist', date: new Date().toISOString() }]),
        },
    });

    if (job.stage !== 'wishlist' && job.appliedDate) {
        const ritualId = await getJobHuntingRitualId();
        if (ritualId) await syncJobRitual(ritualId);
    }

    revalidatePath('/career/job-tracker');
    return job;
}

export async function updateJobApplication(
    id: string,
    data: Partial<{
        company: string;
        role: string;
        stage: string;
        salary: string | null;
        location: string | null;
        jobLink: string | null;
        notes: string | null;
        contactName: string | null;
        contactEmail: string | null;
        appliedDate: Date | null;
        logoUrl: string | null;
    }>
) {
    // If company changed and no logo provided, try to fetch new one
    let newLogoUrl = data.logoUrl;
    if (data.company && !data.logoUrl) {
        // Only fetch if we don't have one or company changed (optimally we'd check previous, but this is fine)
        newLogoUrl = await fetchCompanyLogo(data.company) || null;
    }

    // Retrieve current job to manage history if stage changes
    const currentJob = await prisma.jobApplication.findUnique({ where: { id } });
    let history = currentJob?.history ? JSON.parse(currentJob.history) : [];

    if (data.stage && data.stage !== currentJob?.stage) {
        history.push({ stage: data.stage, date: new Date().toISOString() });
    }

    const job = await prisma.jobApplication.update({
        where: { id },
        data: {
            ...data,
            logoUrl: newLogoUrl !== undefined ? newLogoUrl : undefined, // Only update if determined
            history: JSON.stringify(history),
            lastActivityAt: new Date(),
        },
    });

    revalidatePath('/career/job-tracker');
    return job;
}

export async function moveJobToStage(id: string, newStage: string) {
    const currentJob = await prisma.jobApplication.findUnique({ where: { id } });
    if (!currentJob) throw new Error("Job not found");

    let history: any[] = [];
    if (currentJob.history) {
        try {
            history = JSON.parse(currentJob.history as string);
        } catch (e) {
            history = [];
        }
    }
    history.push({ stage: newStage, date: new Date().toISOString() });

    const job = await prisma.jobApplication.update({
        where: { id },
        data: {
            stage: newStage,
            history: JSON.stringify(history),
            lastActivityAt: new Date(),
            ...(newStage === 'applied' && !currentJob.appliedDate && {
                appliedDate: new Date(),
            }),
        },
    });

    const ritualId = await getJobHuntingRitualId();
    if (ritualId && newStage !== 'wishlist') {
        await syncJobRitual(ritualId);
    }

    revalidatePath('/career/job-tracker');
    return job;
}


export async function deleteJobApplication(id: string) {
    await prisma.jobApplication.delete({ where: { id } });
    revalidatePath('/career/job-tracker');
}



