import { prisma } from "./prisma";
import { auth } from "@/auth";

export type PermissionAction = "CREATE" | "EDIT" | "DELETE" | "VIEW";
export type PermissionResource = "ASSET" | "SERVICE" | "FUEL" | "PART";

/**
 * Checks if the current user has permission to perform an action on a resource.
 * ADMIN role always returns true.
 */
export async function checkPermission(action: PermissionAction, resource: PermissionResource) {
    const session = await auth();
    const user = session?.user as any;

    if (!user?.id) return false;

    // ADMIN role bypasses everything
    if (user.role === "ADMIN") return true;

    // Baseline permissions for all authenticated users:
    // Every user can CREATE new records and VIEW resources.
    // Group permissions are primarily for shared EDIT and DELETE access.
    if (action === "CREATE" || action === "VIEW") return true;

    // Find all permissions for the user's groups
    const permissions = await prisma.permission.findFirst({
        where: {
            group: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            action,
            resource,
        },
    });

    return !!permissions;
}

/**
 * Middleware style check that throws an error if permission is denied.
 */
export async function ensurePermission(action: PermissionAction, resource: PermissionResource) {
    const allowed = await checkPermission(action, resource);
    if (!allowed) {
        throw new Error(`Permission Denied: You do not have permission to ${action} ${resource}s.`);
    }
}

/**
 * Whether the current user may see an asset and its records: admins, the owner,
 * and users the asset is shared with.
 */
export async function canAccessAsset(assetId: string) {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return false;
    if (user.role === "ADMIN") return true;

    const count = await prisma.asset.count({
        where: {
            id: assetId,
            OR: [
                { userId: user.id },
                { sharedWith: { some: { userId: user.id } } },
            ],
        },
    });
    return count > 0;
}

/**
 * Throws unless the current user may access the asset.
 */
export async function ensureAssetAccess(assetId: string) {
    if (!(await canAccessAsset(assetId))) {
        throw new Error("Unauthorized: you do not have access to this asset");
    }
}
