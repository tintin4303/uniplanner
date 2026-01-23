import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get the saved schedule
        const savedSchedule = await prisma.savedSchedule.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!savedSchedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        return NextResponse.json({
            schedule: savedSchedule
        });

    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete the saved schedule (only if it belongs to the user)
        const deletedSchedule = await prisma.savedSchedule.deleteMany({
            where: {
                id,
                userId: user.id
            }
        });

        if (deletedSchedule.count === 0) {
            return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Schedule deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting schedule:', error);
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
