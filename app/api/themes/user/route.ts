import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Default to classic-blue if no themes data
        const purchased = user.unlockedThemes || ['classic-blue'];
        const active = user.activeTheme || 'classic-blue';

        return NextResponse.json({
            purchased,
            active
        });

    } catch (error) {
        console.error('Get user themes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
