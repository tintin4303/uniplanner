import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { getThemeById } from '@/app/lib/themes';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { themeId } = await req.json();

        if (!themeId) {
            return NextResponse.json({ error: 'Theme ID required' }, { status: 400 });
        }

        // Validate theme exists
        const theme = getThemeById(themeId);
        if (!theme) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        const userId = (session.user as any).id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Free themes can always be activated, otherwise check ownership
        if (theme.price > 0) {
            const purchasedThemes = user.unlockedThemes || ['classic-blue'];
            if (!purchasedThemes.includes(themeId)) {
                return NextResponse.json({ error: 'Theme not purchased' }, { status: 400 });
            }
        }

        // Set active theme
        await prisma.user.update({
            where: { id: userId },
            data: {
                activeTheme: themeId
            }
        });

        return NextResponse.json({
            success: true,
            active: themeId
        });

    } catch (error) {
        console.error('Activate theme error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
