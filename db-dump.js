const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    let output = "";
    const log = (msg) => { output += msg + "\n"; };

    log("USERS:");
    const users = await prisma.user.findMany();
    log(JSON.stringify(users, null, 2));

    log("\nGROUPS:");
    const groups = await prisma.group.findMany({
        include: { permissions: true }
    });
    log(JSON.stringify(groups, null, 2));

    log("\nMEMBERSHIPS:");
    const memberships = await prisma.groupMember.findMany({
        include: { user: true, group: true }
    });
    log(JSON.stringify(memberships, null, 2));

    fs.writeFileSync('dump-fixed.txt', output);
    console.log("Written to dump-fixed.txt");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
