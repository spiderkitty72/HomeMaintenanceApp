"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function nextInvoiceNumber(fromUserId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { fromUserId } });
    return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function createInvoice(
    serviceRecordId: string,
    inventorySystemId: string,
    notes?: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const [serviceRecord, inventorySystem] = await Promise.all([
        prisma.serviceRecord.findUnique({
            where: { id: serviceRecordId },
            include: {
                asset: true,
                parts: {
                    where: { inventorySystemId },
                    include: { part: true },
                },
            },
        }),
        prisma.inventorySystem.findUnique({ where: { id: inventorySystemId } }),
    ]);

    if (!serviceRecord) throw new Error("Service record not found");
    if (!inventorySystem) throw new Error("Inventory system not found");
    if (serviceRecord.parts.length === 0) throw new Error("No parts from this inventory system in the service record");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && inventorySystem.userId !== session.user.id) {
        throw new Error("Only the inventory system owner can create invoices");
    }

    const toUserId = serviceRecord.asset.userId;
    const fromUserId = session.user.id;

    if (fromUserId === toUserId) throw new Error("Cannot invoice yourself");

    const existing = await prisma.invoice.findFirst({
        where: { serviceRecordId, inventorySystemId, fromUserId },
    });
    if (existing) throw new Error("Invoice already exists for this service record and inventory system");

    const invoiceNumber = await nextInvoiceNumber(fromUserId);

    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber,
            fromUserId,
            toUserId,
            serviceRecordId,
            inventorySystemId,
            notes: notes || null,
            lineItems: {
                create: serviceRecord.parts.map(p => ({
                    partId: p.partId,
                    partName: p.part.name,
                    quantity: p.quantity,
                    unitCost: p.costPerUnit,
                })),
            },
        },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/service/${serviceRecordId}`);
    return invoice;
}

export async function getInvoices() {
    const session = await auth();
    if (!session?.user?.id) return { sent: [], received: [] };

    const [sent, received] = await Promise.all([
        prisma.invoice.findMany({
            where: { fromUserId: session.user.id },
            include: {
                toUser: { select: { id: true, name: true, email: true } },
                serviceRecord: { select: { id: true, summary: true, date: true } },
                inventorySystem: { select: { id: true, name: true } },
                lineItems: true,
            },
            orderBy: { issuedAt: "desc" },
        }),
        prisma.invoice.findMany({
            where: { toUserId: session.user.id },
            include: {
                fromUser: { select: { id: true, name: true, email: true } },
                serviceRecord: { select: { id: true, summary: true, date: true } },
                inventorySystem: { select: { id: true, name: true } },
                lineItems: true,
            },
            orderBy: { issuedAt: "desc" },
        }),
    ]);

    return { sent, received };
}

export async function getInvoice(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } },
            serviceRecord: {
                select: {
                    id: true,
                    summary: true,
                    date: true,
                    asset: { select: { id: true, name: true } },
                },
            },
            inventorySystem: { select: { id: true, name: true } },
            lineItems: true,
        },
    });

    if (!invoice) throw new Error("Invoice not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && invoice.fromUserId !== session.user.id && invoice.toUserId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    return invoice;
}

export async function markInvoicePaid(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error("Invoice not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && invoice.fromUserId !== session.user.id) {
        throw new Error("Only the issuer can mark an invoice as paid");
    }

    const updated = await prisma.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);
    return updated;
}

export async function markInvoiceUnpaid(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error("Invoice not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && invoice.fromUserId !== session.user.id) {
        throw new Error("Only the issuer can change invoice status");
    }

    const updated = await prisma.invoice.update({
        where: { id },
        data: { status: "UNPAID", paidAt: null },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${id}`);
    return updated;
}

export async function deleteInvoice(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error("Invoice not found");

    const isAdmin = (session.user as any).role === "ADMIN";
    if (!isAdmin && invoice.fromUserId !== session.user.id) {
        throw new Error("Only the issuer can delete an invoice");
    }

    const serviceRecordId = invoice.serviceRecordId;
    await prisma.invoice.delete({ where: { id } });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/service/${serviceRecordId}`);
}

// Returns inventory systems owned by the current user whose parts appear in this service record,
// along with whether an invoice already exists for each.
export async function getInvoicableSystemsForServiceRecord(serviceRecordId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const parts = await prisma.servicePart.findMany({
        where: {
            serviceRecordId,
            inventorySystemId: { not: null },
            inventorySystem: { userId: session.user.id },
        },
        include: {
            inventorySystem: { select: { id: true, name: true } },
        },
        distinct: ["inventorySystemId"],
    });

    if (parts.length === 0) return [];

    const systemIds = parts.map(p => p.inventorySystemId!);
    const existingInvoices = await prisma.invoice.findMany({
        where: { serviceRecordId, inventorySystemId: { in: systemIds }, fromUserId: session.user.id },
        select: { id: true, invoiceNumber: true, inventorySystemId: true, status: true },
    });

    const invoiceMap = new Map(existingInvoices.map(i => [i.inventorySystemId, i]));

    return parts.map(p => ({
        system: p.inventorySystem!,
        existingInvoice: invoiceMap.get(p.inventorySystemId!) ?? null,
    }));
}
