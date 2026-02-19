'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const PASTEL_PALETTE = [
    '#FFB7B2', // Pastel Red
    '#FFDAC1', // Pastel Orange
    '#E2F0CB', // Pastel Lime
    '#B5EAD7', // Pastel Mint
    '#C7CEEA', // Pastel Purple
    '#F0E6EF', // Lavender
    '#A0E7E5', // Tiffany Blueish
    '#FBE7C6', // Apricot
];

export async function applyPastelTheme() {
    const pillars = await prisma.pillar.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
    });

    // Update each pillar with a color from the palette
    for (let i = 0; i < pillars.length; i++) {
        const color = PASTEL_PALETTE[i % PASTEL_PALETTE.length];
        await prisma.pillar.update({
            where: { id: pillars[i].id },
            data: { colorHex: color }
        });
    }

    revalidatePath('/');
    revalidatePath('/calendar');
    revalidatePath('/tasks');
    return { success: true, count: pillars.length };
}
