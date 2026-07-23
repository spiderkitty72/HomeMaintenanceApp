const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
    try {
        const systems = await prisma.inventorySystem.findMany({
            include: {
                user: true,
                _count: { select: { items: true } }
            }
        });
        console.log("Systems:", systems.map(s => ({ id: s.id, name: s.name, userId: s.userId, itemCount: s._count.items })));

        const items = await prisma.inventoryItem.findMany({
            include: {
                part: true,
                inventorySystem: true
            }
        });
        console.log("Inventory Items count:", items.length);
        if (items.length > 0) {
            console.log("First item:", {
                id: items[0].id,
                inventorySystemId: items[0].inventorySystemId,
                partId: items[0].partId,
                quantity: items[0].quantityOnHand,
                partName: items[0].part.name
            });
        }
    } catch (e) {
        console.error("FAILURE:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
