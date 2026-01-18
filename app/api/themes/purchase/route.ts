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

        // Free themes don't need purchasing
        if (theme.price === 0) {
            return NextResponse.json({ error: 'Theme is already free' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already purchased
        const purchasedThemes = user.unlockedThemes || ['classic-blue'];
        if (purchasedThemes.includes(themeId)) {
            return NextResponse.json({ error: 'Theme already purchased' }, { status: 400 });
        }

        // Check token balance
        const currentTokens = user.tokens || 0;
        if (currentTokens < theme.price) {
            return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
        }

        // Deduct tokens and add theme
        const newBalance = currentTokens - theme.price;
        const newPurchasedThemes = [...purchasedThemes, themeId];

        await prisma.user.update({
            where: { id: userId },
            data: {
                tokens: newBalance,
                unlockedThemes: newPurchasedThemes
            }
        });

        return NextResponse.json({
            success: true,
            newBalance,
            purchasedThemes: newPurchasedThemes
        });

    } catch (error) {
        console.error('Theme purchase error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
