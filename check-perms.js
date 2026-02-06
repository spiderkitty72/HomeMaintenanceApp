const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
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

    console.log("USERS DATA:");
    users.forEach(u => {
        console.log(`- ${u.email} [Role: ${u.role}]`);
        u.groups.forEach(m => {
            console.log(`  Group: ${m.group.name}`);
            console.log(`  Perms: ${m.group.permissions.map(p => `${p.action}:${p.resource}`).join(', ')}`);
        });
    });

    const allGroups = await prisma.group.findMany({
        include: { permissions: true }
    });
    console.log("\nALL GROUPS:");
    allGroups.forEach(g => {
        console.log(`- ${g.name}`);
        console.log(`  Perms: ${g.permissions.map(p => `${p.action}:${p.resource}`).join(', ')}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
