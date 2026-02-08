const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDuplicateAssets() {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                _count: {
                    select: { specs: true }
                },
                owner: { select: { name: true, email: true } }
            },
            orderBy: { name: "asc" }
        });

        console.log("--- Asset List and Spec Counts ---");
        assets.forEach(a => {
            console.log(`Asset: ${a.name} (ID: ${a.id}), Owner: ${a.owner?.name}, Specs count: ${a._count.specs}`);
        });

    } catch (e) {
        console.error("Error checking assets:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicateAssets();
