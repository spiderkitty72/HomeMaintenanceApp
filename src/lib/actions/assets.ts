"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssetType, TrackingMethod } from "@/lib/constants";
import { ensurePermission } from "@/lib/permissions";

const AssetSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.string(),
    trackingMethod: z.string(),
    details: z.string().optional(), // JSON string
    currentUsage: z.number().default(0),
    image: z.string().optional(),
});

export async function createAsset(data: z.infer<typeof AssetSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("CREATE", "ASSET");

    try {
        const asset = await prisma.asset.create({
            data: {
                ...data,
                userId: session.user.id,
            },
        });

        revalidatePath("/dashboard");
        return asset;
    } catch (error) {
        console.error("CREATE_ASSET_ERROR:", error);
        throw error;
    }
}

export async function getAssets() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    return await prisma.asset.findMany({
        where: {
            OR: [
                { userId: session.user.id },
                { sharedWith: { some: { userId: session.user.id } } },
            ],
        },
        include: {
            sharedWith: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function deleteAsset(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("DELETE", "ASSET");

    // Ensure user owns the asset
    const asset = await prisma.asset.findUnique({
        where: { id },
    });

    if (!asset || asset.userId !== session.user.id) {
        throw new Error("Unauthorized to delete this asset");
    }

    await prisma.asset.delete({
        where: { id },
    });

    revalidatePath("/dashboard");
}
