const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
    const all = await p.assetSpecType.findMany({
        include: {
            user: { select: { email: true } },
            _count: { select: { specs: true } }
        }
    });
    console.log('Total Spec Types:', all.length);
    all.forEach((t, i) => {
        console.log(`${i + 1}. "${t.name}" | Active: ${t.isActive} | Owner: ${t.user.email} | Used: ${t._count.specs} times`);
    });
}
check().finally(() => p.$disconnect());
