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
    const userId = await ensureAuth();
    return await prisma.assetSpecType.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
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
