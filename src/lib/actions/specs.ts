"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function ensureAuth() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session.user.id;
}

export async function getSpecTypes() {
    await ensureAuth();
    return await prisma.assetSpecType.findMany({
        where: {
            isActive: true,
        },
        orderBy: { name: "asc" },
    });
}

/**
 * System-wide retrieval for Admin management
 */
export async function getAllSpecTypesSystem() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.assetSpecType.findMany({
        include: {
            user: {
                select: { name: true, email: true }
            },
            _count: {
                select: { specs: true }
            }
        },
        orderBy: { name: "asc" },
    });
}

export async function updateSpecType(id: string, name: string, unit: string | null) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const updated = await prisma.assetSpecType.update({
        where: { id },
        data: { name, unit },
    });

    revalidatePath("/dashboard/admin");
    return updated;
}

export async function toggleSpecTypeStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.assetSpecType.update({
        where: { id },
        data: { isActive },
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/asset");
}

export async function addSpecType(name: string, unit: string | null) {
    const userId = await ensureAuth();
    return await prisma.assetSpecType.create({
        data: {
            userId,
            name,
            unit,
        },
    });
}

export async function getAssetSpecs(assetId: string) {
    return await prisma.assetSpec.findMany({
        where: { assetId },
        include: {
            specType: true,
        },
        orderBy: {
            specType: {
                name: "asc",
            },
        },
    });
}

export async function upsertAssetSpec(assetId: string, specTypeId: string, value: string) {
    await ensureAuth(); // Basic check

    // Check if it exists
    const existing = await prisma.assetSpec.findUnique({
        where: {
            assetId_specTypeId: {
                assetId,
                specTypeId,
            },
        },
    });

    if (existing) {
        await prisma.assetSpec.update({
            where: { id: existing.id },
            data: { value },
        });
    } else {
        await prisma.assetSpec.create({
            data: {
                assetId,
                specTypeId,
                value,
            },
        });
    }

    revalidatePath(`/dashboard/asset/${assetId}`);
}

export async function deleteAssetSpec(id: string, assetId: string) {
    await ensureAuth();
    await prisma.assetSpec.delete({
        where: { id },
    });
    revalidatePath(`/dashboard/asset/${assetId}`);
}
