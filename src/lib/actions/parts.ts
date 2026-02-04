"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensurePermission } from "@/lib/permissions";

const PartSchema = z.object({
    name: z.string().min(2, "Name is required"),
    partNumber: z.string().optional(),
    manufacturer: z.string().optional(),
    compatibleType: z.string().optional(),
    assetIds: z.array(z.string()).optional(),
    defaultCost: z.coerce.number().min(0).default(0),
    unitOfMeasure: z.string().min(1, "Unit of measure is required").default("pcs"),
    quantityOnHand: z.coerce.number().default(0),
});

export async function createPart(data: z.infer<typeof PartSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("CREATE", "PART");

    const { assetIds, ...partData } = data;

    // @ts-ignore
    const part = await prisma.part.create({
        data: {
            ...partData,
            userId: session.user.id,
            compatibilities: {
                create: assetIds?.map(assetId => ({
                    assetId
                })) || []
            }
        },
    });

    revalidatePath("/dashboard/parts");
    return part;
}

export async function getParts() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    // Return parts owned by user or shared via groups
    // For now, simplicity: parts owned by the user
    // @ts-ignore
    return await prisma.part.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            compatibilities: {
                include: {
                    asset: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function updatePart(id: string, data: z.infer<typeof PartSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("EDIT", "PART");

    const { assetIds, ...partData } = data;

    const part = await prisma.part.update({
        where: { id },
        data: {
            ...partData,
            compatibilities: {
                deleteMany: {},
                create: assetIds?.map(assetId => ({
                    assetId
                })) || []
            }
        },
    });

    revalidatePath("/dashboard/parts");
    return part;
}

export async function deletePart(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("DELETE", "PART");

    await prisma.part.delete({
        where: { id },
    });

    revalidatePath("/dashboard/parts");
}

export async function assignPartToAsset(partId: string, assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("EDIT", "PART");

    await prisma.assetPartCompatibility.create({
        data: {
            partId,
            assetId,
        },
    });

    revalidatePath("/dashboard/parts");
    revalidatePath(`/dashboard/asset/${assetId}`);
}

export async function unassignPartFromAsset(partId: string, assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    await ensurePermission("EDIT", "PART");

    await prisma.assetPartCompatibility.delete({
        where: {
            assetId_partId: {
                assetId,
                partId,
            },
        },
    });

    revalidatePath("/dashboard/parts");
    revalidatePath(`/dashboard/asset/${assetId}`);
}

export async function getCompatibleParts(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    // Parts specific to this asset OR global parts with the same compatibleType
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { type: true },
    });

    if (!asset) return [];

    // @ts-ignore
    return await prisma.part.findMany({
        where: {
            userId: session.user.id,
            OR: [
                {
                    compatibilities: {
                        some: {
                            assetId,
                        },
                    },
                },
                {
                    compatibleType: asset.type,
                },
            ],
        },
        orderBy: {
            name: "asc",
        },
    });
}
