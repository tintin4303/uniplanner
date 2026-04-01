
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("--- USERS ---");
    users.forEach(u => {
        console.log(`User: ${u.email} | ID: ${u.id}`);
        console.log(`  isPro: ${u.isPro}`);
        console.log(`  stripeSubscriptionId: ${u.stripeSubscriptionId}`);
        console.log(`  stripeCurrentPeriodEnd: ${u.stripeCurrentPeriodEnd}`);
        console.log(`  tokens: ${u.tokens}`);
        console.log("----------------");
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
