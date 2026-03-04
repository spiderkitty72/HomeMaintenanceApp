"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AssetType, TrackingMethod } from "@/lib/constants";
import { ensurePermission, checkPermission } from "@/lib/permissions";

const AssetSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.string(),
    trackingMethod: z.string(),
    details: z.string().optional(), // JSON string
    image: z.string().optional(),
    sharedUserIds: z.array(z.string()).optional(),
});

export async function createAsset(data: z.infer<typeof AssetSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("CREATE", "ASSET");

    try {
        const { sharedUserIds, ...assetData } = data;
        const asset = await prisma.asset.create({
            data: {
                ...assetData,
                userId: session.user.id,
                sharedWith: {
                    create: sharedUserIds?.map((userId) => ({
                        userId,
                        permission: "READ", // Default permission
                    })) || [],
                },
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
            owner: {
                select: {
                    name: true,
                    email: true,
                },
            },
            sharedWith: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            schedules: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getAllAssetsSystem() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return await prisma.asset.findMany({
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            sharedWith: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function updateAssetAccess(id: string, ownerId: string, sharedUserIds: string[]) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Update owner
            await tx.asset.update({
                where: { id },
                data: { userId: ownerId },
            });

            // Update shares
            await tx.assetShare.deleteMany({
                where: { assetId: id },
            });

            await tx.assetShare.createMany({
                data: sharedUserIds.map((userId) => ({
                    assetId: id,
                    userId,
                    permission: "READ",
                })),
            });
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/admin");
        revalidatePath(`/dashboard/asset/${id}`);
        return { success: true };
    } catch (error) {
        console.error("UPDATE_ASSET_ACCESS_ERROR:", error);
        throw error;
    }
}

export async function deleteAsset(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const asset = await prisma.asset.findUnique({
        where: { id },
    });

    if (!asset) throw new Error("Asset not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && asset.userId !== session.user.id) {
        throw new Error("Unauthorized to delete this asset");
    }

    await prisma.asset.delete({
        where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin");
}

export async function updateAsset(id: string, data: z.infer<typeof AssetSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Ensure user owns or handles the asset
    const existingAsset = await prisma.asset.findUnique({
        where: { id },
    });

    const isAdmin = (session.user as any).role === "ADMIN";
    const isOwner = existingAsset?.userId === session.user.id;
    const hasPermission = await checkPermission("EDIT", "ASSET");

    if (!existingAsset || (!isOwner && !isAdmin && !hasPermission)) {
        throw new Error("Unauthorized to update this asset");
    }

    try {
        const { sharedUserIds, ...assetData } = data;

        // Use a transaction to ensure atomic update and sharing sync
        const asset = await prisma.$transaction(async (tx) => {
            // Update the asset data
            const updated = await tx.asset.update({
                where: { id },
                data: assetData,
            });

            if (sharedUserIds !== undefined) {
                // Remove old shares
                await tx.assetShare.deleteMany({
                    where: { assetId: id },
                });

                // Create new shares
                await tx.assetShare.createMany({
                    data: sharedUserIds.map((userId) => ({
                        assetId: id,
                        userId,
                        permission: "READ",
                    })),
                });
            }

            return updated;
        });

        revalidatePath("/dashboard");
        revalidatePath(`/dashboard/asset/${id}`);
        return asset;
    } catch (error) {
        console.error("UPDATE_ASSET_ERROR:", error);
        throw error;
    }
}
