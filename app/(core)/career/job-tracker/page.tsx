import { getJobApplicationsByStage } from '@/actions/jobs';
import { JobTrackerClient } from '@/components/career/JobTrackerClient';
import { Briefcase } from 'lucide-react';

export default async function JobTrackerPage() {
    const jobsByStage = await getJobApplicationsByStage();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/20 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-violet-500/20">
                        <Briefcase className="w-8 h-8 text-violet-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                            Job Tracker
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track your job applications from wishlist to offer
                        </p>
                    </div>
                </div>
            </div>

            <JobTrackerClient initialJobs={jobsByStage} />
        </div>
    );
}
