import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scheduleData, name } = body;

        if (!scheduleData) {
            return NextResponse.json({ error: 'Missing schedule data' }, { status: 400 });
        }

        // Create the public share link
        const shared = await prisma.sharedSchedule.create({
            data: {
                scheduleData: scheduleData,
                name: name || "Untitled Schedule"
            }
        });

        return NextResponse.json({
            success: true,
            id: shared.id
        });

    } catch (error) {
        console.error('Share API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate share link' },
            { status: 500 }
        );
    }
}
