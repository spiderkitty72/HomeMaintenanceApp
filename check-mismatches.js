const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkMismatches() {
    try {
        const specs = await prisma.assetSpec.findMany({
            include: {
                asset: { select: { name: true, userId: true } },
                specType: { select: { name: true, userId: true } }
            }
        });

        console.log("--- AssetSpec Association Check ---");
        specs.forEach(s => {
            const mismatch = s.asset.userId !== s.specType.userId;
            console.log(`Asset: ${s.asset.name} (User: ${s.asset.userId}), Spec: ${s.specType.name} (User: ${s.specType.userId}), Mismatch: ${mismatch}`);
        });

    } catch (e) {
        console.error("Error checking mismatches:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMismatches();
