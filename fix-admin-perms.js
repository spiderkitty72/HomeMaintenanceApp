const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const RESOURCES = ["ASSET", "SERVICE", "FUEL", "PART"];
    const ACTIONS = ["CREATE", "EDIT", "DELETE", "VIEW"];

    console.log("Searching for Administrators group...");
    const adminGroups = await prisma.group.findMany({
        where: {
            name: {
                contains: "Admin"
            }
        }
    });

    if (adminGroups.length === 0) {
        console.log("No Administrator group found.");
        return;
    }

    for (const group of adminGroups) {
        console.log(`Ensuring full permissions for group: ${group.name} (${group.id})`);

        const existingPerms = await prisma.permission.findMany({
            where: { groupId: group.id }
        });

        const permsToCreate = [];
        for (const res of RESOURCES) {
            for (const action of ACTIONS) {
                const exists = existingPerms.find(p => p.action === action && p.resource === res);
                if (!exists) {
                    permsToCreate.push({
                        groupId: group.id,
                        action,
                        resource: res
                    });
                }
            }
        }

        if (permsToCreate.length > 0) {
            console.log(`Adding ${permsToCreate.length} missing permissions...`);
            await prisma.permission.createMany({
                data: permsToCreate
            });
            console.log("Permissions added successfully.");
        } else {
            console.log("Group already has all permissions.");
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
