const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Prisma Client Models:');
console.log(Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

async function test() {
    try {
        console.log('Testing access to partPurchase...');
        console.log('partPurchase count:', await prisma.partPurchase.count());
        console.log('Testing access to partPurchaseItem...');
        console.log('partPurchaseItem count:', await prisma.partPurchaseItem.count());
    } catch (e) {
        console.error('Error during test:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
