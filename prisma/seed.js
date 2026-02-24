const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const password = "maintenance";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            name: "Admin User",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    // Create an "Administrator" group with all permissions
    const adminGroup = await prisma.group.upsert({
        where: { name: "Administrators" },
        update: {},
        create: {
            name: "Administrators",
            description: "Full system access",
        },
    });

    // Add admin user to the Administrators group
    await prisma.groupMember.upsert({
        where: {
            groupId_userId: {
                groupId: adminGroup.id,
                userId: user.id,
            },
        },
        update: {},
        create: {
            groupId: adminGroup.id,
            userId: user.id,
        },
    });

    // Create grid of all permissions for Admin group
    const resources = ["ASSET", "SERVICE", "FUEL", "PART"];
    const actions = ["CREATE", "EDIT", "DELETE", "VIEW"];

    for (const resource of resources) {
        for (const action of actions) {
            await prisma.permission.upsert({
                where: {
                    groupId_action_resource: {
                        groupId: adminGroup.id,
                        action,
                        resource,
                    },
                },
                update: {},
                create: {
                    groupId: adminGroup.id,
                    action,
                    resource,
                },
            });
        }
    }

    console.log("Seeding complete: Admin user, Administrators group, and full permissions created.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
