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

    // Baseline: Any logged in user can manage their own standard resources
    // The individual server actions will enforce ownership/privacy
    const baselineResources = ["ASSET", "SERVICE", "FUEL", "PART"];
    if (baselineResources.includes(resource)) return true;

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
