"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getExportData() {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const assets = await (prisma.asset as any).findMany({
        include: {
            owner: true,
            serviceRecords: {
                include: {
                    parts: {
                        include: {
                            part: true
                        }
                    }
                },
                orderBy: { date: "desc" }
            },
            fuelRecords: {
                orderBy: { date: "desc" }
            },
            specs: {
                include: {
                    specType: true
                }
            }
        },
        orderBy: { name: "asc" }
    });

    const parts = await prisma.part.findMany({
        orderBy: { name: "asc" }
    });

    return { assets, parts };
}
