import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, scheduleData } = await request.json();

        if (!name || !scheduleData) {
            return NextResponse.json({ error: 'Name and schedule data are required' }, { status: 400 });
        }

        // Rate Limit: 10 saves per minute to prevent DB spam
        const { rateLimit } = await import('@/app/lib/ratelimit');
        const limit = await rateLimit(`save:${session.user.email}`, 10, "60 s");
        if (!limit.success) {
            return NextResponse.json({ error: "Too many saves. Please wait a moment." }, { status: 429 });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create saved schedule
        const savedSchedule = await prisma.savedSchedule.create({
            data: {
                userId: user.id,
                name,
                scheduleData
            }
        });

        return NextResponse.json({
            success: true,
            schedule: {
                id: savedSchedule.id,
                name: savedSchedule.name,
                createdAt: savedSchedule.createdAt
            }
        });

    } catch (error) {
        console.error('Error saving schedule:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json({
            error: 'Failed to save schedule',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
