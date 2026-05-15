const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting data migration...");
    const users = await prisma.user.findMany({ include: { parts: true } });
    for (const user of users) {
        if (user.parts.length > 0) {
            console.log(`Processing user: ${user.name || user.email}`);
            let system = await prisma.inventorySystem.findFirst({
                where: { userId: user.id }
            });
            
            if (!system) {
                system = await prisma.inventorySystem.create({
                    data: {
                        name: "Default Inventory",
                        userId: user.id
                    }
                });
                console.log(`  Created Default Inventory System: ${system.id}`);
            }

            let migratedParts = 0;
            for (const part of user.parts) {
                await prisma.inventoryItem.upsert({
                    where: {
                        inventorySystemId_partId: {
                            inventorySystemId: system.id,
                            partId: part.id
                        }
                    },
                    update: {
                        quantityOnHand: part.quantityOnHand
                    },
                    create: {
                        inventorySystemId: system.id,
                        partId: part.id,
                        quantityOnHand: part.quantityOnHand
                    }
                });
                migratedParts++;
            }
            console.log(`  Migrated ${migratedParts} parts into inventory system.`);
        }
    }
    console.log("Migration complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
