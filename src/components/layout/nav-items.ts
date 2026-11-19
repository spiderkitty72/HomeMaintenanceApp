import { LayoutDashboard, Package, FileText, ShieldCheck, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };

/** Main sections, shown the same way in the desktop bar and the mobile menu. */
export const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/parts", label: "Parts", icon: Package },
    { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
    { href: "/dashboard/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

export const REPORT_BUG_URL = "https://github.com/spiderkitty72/HomeMaintenanceApp/issues";

export function visibleNavItems(isAdmin: boolean) {
    return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

export function isActivePath(pathname: string, href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/asset") || pathname.startsWith("/dashboard/service") || pathname.startsWith("/dashboard/fuel");
    return pathname === href || pathname.startsWith(href + "/");
}
