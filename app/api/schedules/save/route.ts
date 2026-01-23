import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
