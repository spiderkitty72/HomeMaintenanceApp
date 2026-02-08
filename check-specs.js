const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSpecs() {
    try {
        const specTypesCount = await prisma.assetSpecType.count();
        const specsCount = await prisma.assetSpec.count();

        console.log("--- Database Spec Check ---");
        console.log("AssetSpecType count:", specTypesCount);
        console.log("AssetSpec count:", specsCount);

        if (specsCount > 0) {
            const sampleSpecs = await prisma.assetSpec.findMany({
                take: 5,
                include: {
                    asset: { select: { name: true } },
                    specType: { select: { name: true } }
                }
            });
            console.log("\nSample Specs:");
            sampleSpecs.forEach(s => {
                console.log(`Asset: ${s.asset.name}, Spec: ${s.specType.name}, Value: ${s.value}`);
            });
        }
    } catch (e) {
        console.error("Error checking database:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecs();
