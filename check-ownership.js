const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkOwnership() {
    try {
        const specTypes = await prisma.assetSpecType.findMany({
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        console.log("--- AssetSpecType Ownership ---");
        specTypes.forEach(st => {
            console.log(`SpecType: ${st.name}, User: ${st.user?.name || "N/A"} (${st.user?.email || "N/A"}), UserId: ${st.userId}`);
        });

        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true }
        });
        console.log("\n--- Users in Database ---");
        users.forEach(u => {
            console.log(`User: ${u.name}, Email: ${u.email}, ID: ${u.id}`);
        });

    } catch (e) {
        console.error("Error checking ownership:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkOwnership();
