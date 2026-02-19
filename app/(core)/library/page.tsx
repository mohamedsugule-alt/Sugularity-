import { getResources } from '@/actions/resources';
import { LibraryClient } from '@/components/library/LibraryClient';
import { BookOpen } from 'lucide-react';

export default async function LibraryPage() {
    const resources = await getResources();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-primary" />
                    Library
                </h1>
                <p className="text-muted-foreground mt-1">
                    Your personal knowledge base. Dump ideas, store PDFs, and keep references.
                </p>
            </div>

            <LibraryClient initialResources={resources as any} />
        </div>
    );
}
