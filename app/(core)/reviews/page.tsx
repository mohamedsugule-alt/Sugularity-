import { getWeeklyReviewData, getLastReview } from '@/actions/humanNature';
import { WeeklyReviewClient } from '@/components/reviews/WeeklyReviewClient';
import { ClipboardCheck } from 'lucide-react';

export default async function ReviewsPage() {
    const [reviewData, lastReview] = await Promise.all([
        getWeeklyReviewData(),
        getLastReview('weekly'),
    ]);

    const lastReviewDate = lastReview
        ? new Date(lastReview.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
        })
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <ClipboardCheck className="w-8 h-8 text-primary" />
                    Weekly Review
                </h1>
                <p className="text-muted-foreground mt-1">
                    Reset clarity. Plan the week ahead.
                    {lastReviewDate && (
                        <span className="ml-2 text-sm">
                            Last review: {lastReviewDate}
                        </span>
                    )}
                </p>
            </div>

            <WeeklyReviewClient
                initialData={reviewData}
                lastReview={lastReview}
            />
        </div>
    );
}
