
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = "nyunt.workuse@gmail.com"; // Assuming this is the testing user based on tokens
    const user = await prisma.user.update({
        where: { email },
        data: {
            isPro: true,
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });
    console.log(`✅ MANUALLY updated ${user.email} to PRO.`);
    console.log(`  isPro: ${user.isPro}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
