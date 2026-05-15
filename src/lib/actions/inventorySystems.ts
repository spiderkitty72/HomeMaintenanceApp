"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const InventorySystemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  userId: z.string().min(1, "Owner is required"),
  sharedWith: z.array(z.object({
    userId: z.string(),
    permission: z.enum(["VIEW", "MANAGE"]),
  })).optional(),
});

// Helper: get the current user's access level for a given system
export async function getSystemAccessLevel(systemId: string): Promise<"OWNER" | "MANAGE" | "VIEW" | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const system = await prisma.inventorySystem.findUnique({
    where: { id: systemId },
    include: { sharedWith: true },
  });

  if (!system) return null;
  if (system.userId === userId || (session.user as any).role === "ADMIN") return "OWNER";

  const access = system.sharedWith.find((a) => a.userId === userId);
  if (!access) return null;
  return access.permission as "MANAGE" | "VIEW";
}

export async function createInventorySystem(data: z.infer<typeof InventorySystemSchema>) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const { sharedWith, ...systemData } = data;

  const system = await prisma.inventorySystem.create({
    data: {
      name: systemData.name,
      userId: systemData.userId,
      sharedWith: sharedWith && sharedWith.length > 0
        ? { create: sharedWith }
        : undefined,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/parts");
  return system;
}

// Returns all systems the current user owns OR has been granted access to
export async function getInventorySystems() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.inventorySystem.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { sharedWith: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      sharedWith: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAllInventorySystems() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await prisma.inventorySystem.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      sharedWith: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { items: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function updateInventorySystem(
  id: string,
  name: string,
  sharedWith?: { userId: string; permission: "VIEW" | "MANAGE" }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.inventorySystem.findUnique({ where: { id } });
  if (!existing) throw new Error("Inventory system not found");

  const isAdmin = (session.user as any).role === "ADMIN";
  const isOwner = existing.userId === session.user.id;
  if (!isAdmin && !isOwner) throw new Error("Unauthorized");

  // Replace the sharedWith list atomically
  const system = await prisma.inventorySystem.update({
    where: { id },
    data: {
      name,
      sharedWith: sharedWith !== undefined
        ? {
            deleteMany: {},
            create: sharedWith,
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard/asset/[id]", "layout");
  return system;
}

export async function deleteInventorySystem(id: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.inventorySystem.delete({ where: { id } });

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/parts");
}

// Only owners/MANAGE users can add parts to a system
export async function addPartToSystem(systemId: string, partId: string) {
  const access = await getSystemAccessLevel(systemId);
  if (!access || access === "VIEW") throw new Error("Unauthorized: insufficient access");

  const item = await prisma.inventoryItem.upsert({
    where: { inventorySystemId_partId: { inventorySystemId: systemId, partId } },
    update: {},
    create: { inventorySystemId: systemId, partId, quantityOnHand: 0 },
  });

  revalidatePath("/dashboard/parts");
  return item;
}

// Only owners/MANAGE users can manually adjust stock quantities
export async function updateStock(systemId: string, partId: string, quantity: number) {
  const access = await getSystemAccessLevel(systemId);
  if (!access || access === "VIEW") throw new Error("Unauthorized: insufficient access");

  const item = await prisma.inventoryItem.update({
    where: { inventorySystemId_partId: { inventorySystemId: systemId, partId } },
    data: { quantityOnHand: quantity },
  });

  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard/admin");
  return item;
}

export async function removePartFromSystem(systemId: string, partId: string) {
  const access = await getSystemAccessLevel(systemId);
  if (!access || access === "VIEW") throw new Error("Unauthorized: insufficient access");

  await prisma.inventoryItem.delete({
    where: {
      inventorySystemId_partId: {
        inventorySystemId: systemId,
        partId,
      },
    },
  });

  revalidatePath("/dashboard/parts");
  revalidatePath("/dashboard/admin");
}

export async function getInventoryItems(systemId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Ensure the user has at least VIEW access
  const access = await getSystemAccessLevel(systemId);
  if (!access) return [];

  return await prisma.inventoryItem.findMany({
    where: { inventorySystemId: systemId },
    include: { part: true },
  });
}
