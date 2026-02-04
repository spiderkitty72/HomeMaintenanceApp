"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const GroupSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
});

export async function getGroups() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.group.findMany({
        include: {
            members: {
                include: {
                    user: true,
                },
            },
            permissions: true,
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function createGroup(data: z.infer<typeof GroupSchema>) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const group = await prisma.group.create({
        data,
    });

    revalidatePath("/dashboard/admin");
    return group;
}

export async function updateGroup(groupId: string, data: z.infer<typeof GroupSchema>) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const group = await prisma.group.update({
        where: { id: groupId },
        data,
    });

    revalidatePath("/dashboard/admin");
    return group;
}

export async function deleteGroup(groupId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.group.delete({
        where: { id: groupId },
    });

    revalidatePath("/dashboard/admin");
}

export async function addMemberToGroup(groupId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const member = await prisma.groupMember.create({
        data: {
            groupId,
            userId,
        },
    });

    revalidatePath("/dashboard/admin");
    return member;
}

export async function removeMemberFromGroup(groupId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.groupMember.delete({
        where: {
            groupId_userId: {
                groupId,
                userId,
            },
        },
    });

    revalidatePath("/dashboard/admin");
}

export async function setGroupPermissions(groupId: string, permissions: { action: string, resource: string }[]) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Replace all permissions for simplicity in this version
    await prisma.$transaction([
        prisma.permission.deleteMany({ where: { groupId } }),
        prisma.permission.createMany({
            data: permissions.map(p => ({
                groupId,
                action: p.action,
                resource: p.resource,
            })),
        }),
    ]);

    revalidatePath("/dashboard/admin");
}
