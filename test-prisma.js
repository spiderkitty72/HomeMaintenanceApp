const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
    try {
        const parts = await prisma.part.findMany({
            include: {
                compatibilities: true
            }
        });
        console.log("SUCCESS: Part.compatibilities exists. Count:", parts.length);
    } catch (e) {
        console.error("FAILURE:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
