"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, visibleNavItems } from "./nav-items";

export function DesktopNav({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex items-center gap-1">
            {visibleNavItems(isAdmin).map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
