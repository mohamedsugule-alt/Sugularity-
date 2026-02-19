import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        // Validate type (basic check)
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            return NextResponse.json({ success: false, error: 'File must be an image or PDF' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename and prepend timestamp
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        // Write file
        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ success: true, url: `/uploads/${filename}` });
    } catch (e) {
        console.error('Upload error:', e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
