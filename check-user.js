const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = "joshua.james.nell@gmail.com";
    console.log(`Checking user: ${email}`);
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            groups: {
                include: {
                    group: {
                        include: {
                            permissions: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log("User not found.");
        return;
    }

    console.log(`Role: ${user.role}`);
    console.log(`Groups (${user.groups.length}):`);
    user.groups.forEach(m => {
        console.log(`- ${m.group.name} (ID: ${m.group.id})`);
        console.log(`  Perms: ${m.group.permissions.map(p => `${p.action}:${p.resource}`).join(', ')}`);
    });

    // Manually simulate checkPermission
    const hasEdit = user.role === "ADMIN" || user.groups.some(m => m.group.permissions.some(p => p.action === "EDIT" && p.resource === "SERVICE"));
    const hasDelete = user.role === "ADMIN" || user.groups.some(m => m.group.permissions.some(p => p.action === "DELETE" && p.resource === "SERVICE"));

    console.log(`Effective canEdit(SERVICE): ${hasEdit}`);
    console.log(`Effective canDelete(SERVICE): ${hasDelete}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
