"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const CreateUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    role: z.enum(["ADMIN", "USER"]),
    password: z.string().min(6),
});

export async function getUsers() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.user.findMany({
        include: {
            groups: {
                include: {
                    group: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function getUsersPublic() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await prisma.user.findMany({
        where: {
            NOT: {
                id: session.user.id,
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function createUser(data: z.infer<typeof CreateUserSchema>) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
            role: data.role,
            password: hashedPassword,
        },
    });

    revalidatePath("/dashboard/admin");
    return user;
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    if (session.user.id === userId) {
        throw new Error("Cannot delete yourself");
    }

    await prisma.user.delete({
        where: { id: userId },
    });

    revalidatePath("/dashboard/admin");
}

export async function updateUser(userId: string, data: Partial<z.infer<typeof CreateUserSchema>>) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            email: data.email,
            name: data.name,
            role: data.role,
        },
    });

    revalidatePath("/dashboard/admin");
    return user;
}

export async function updateSelf(data: { name?: string; email?: string }) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            email: data.email,
        },
    });

    revalidatePath("/dashboard/settings");
    return updated;
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.password) {
        throw new Error("User not found or has no password set");
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { success: true };
}

export async function adminResetPassword(userId: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { success: true };
}
