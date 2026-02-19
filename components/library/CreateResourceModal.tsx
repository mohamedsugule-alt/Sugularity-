'use client';

import { useState } from 'react';
import { X, Upload, FileText, Link, Loader2 } from 'lucide-react';
import { createResource } from '@/actions/resources';
import { toast } from 'sonner';

type CreateResourceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
};

export function CreateResourceModal({ isOpen, onClose, onCreated }: CreateResourceModalProps) {
    const [activeTab, setActiveTab] = useState<'note' | 'file' | 'link'>('note');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let filePath = undefined;

            if (activeTab === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();

                if (!data.success) throw new Error(data.error);
                filePath = data.url;
            }

            await createResource({
                title,
                type: activeTab === 'file' ? 'pdf' : activeTab,
                content: activeTab === 'note' ? content : undefined,
                url: activeTab === 'link' ? url : undefined,
                filePath,
            });

            toast.success('Resource created successfully');
            onCreated();
            onClose();
        } catch (error) {
            toast.error('Failed to create resource');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Add to Library</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('note')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'note' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <FileText className="w-4 h-4" /> Note
                    </button>
                    <button
                        onClick={() => setActiveTab('file')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Upload className="w-4 h-4" /> Upload PDF
                    </button>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'link' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Link className="w-4 h-4" /> Link
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Resource Title"
                        />
                    </div>

                    {activeTab === 'note' && (
                        <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-medium mb-1">Content</label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full flex-1 min-h-[300px] bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                placeholder="Type your notes here... (Markdown supported)"
                            />
                        </div>
                    )}

                    {activeTab === 'file' && (
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                required
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-10 h-10 text-muted-foreground" />
                                <span className="font-medium text-primary">Click to upload PDF</span>
                                <span className="text-xs text-muted-foreground">
                                    {file ? file.name : "Maximum file size: 10MB"}
                                </span>
                            </label>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">URL</label>
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="https://..."
                            />
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 hover:bg-muted rounded-lg text-sm font-medium">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : 'Save Resource'}
                    </button>
                </div>
            </div>
        </div>
    );
}
