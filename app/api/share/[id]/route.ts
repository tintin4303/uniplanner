import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const shared = await prisma.sharedSchedule.findUnique({
            where: { id }
        });

        if (!shared) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: shared.scheduleData,
            name: shared.name
        });

    } catch (error) {
        console.error('Share API GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch schedule' },
            { status: 500 }
        );
    }
}
