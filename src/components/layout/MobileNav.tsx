"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wrench, Menu, LayoutDashboard, Package, ShieldCheck, LogOut, Settings } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "next-auth/react";

interface MobileNavProps {
    session: any;
}

export function MobileNav({ session }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close the menu when the pathname changes
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    const isAdmin = session?.user?.role === "ADMIN";

    return (
        <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent/50 active:scale-95 transition-all">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[350px] p-6">
                    <SheetHeader className="text-left border-b pb-4 mb-6">
                        <SheetTitle className="flex items-center space-x-2 text-xl font-bold">
                            <Wrench className="h-5 w-5 text-primary" />
                            <span>MaintenanceApp</span>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-6">
                        {session ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    href="/dashboard/parts"
                                    className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <Package className="h-4 w-4" />
                                    <span>Parts</span>
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/dashboard/admin"
                                        className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
                                        onClick={() => setOpen(false)}
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>Admin</span>
                                    </Link>
                                )}
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Settings</span>
                                </Link>

                                <div className="pt-6 border-t mt-auto">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full justify-start space-x-3 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="font-semibold">Sign Out</span>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Sign in to manage your assets and service records.</p>
                                <Link href="/api/auth/signin" className="block" onClick={() => setOpen(false)}>
                                    <Button size="lg" className="w-full justify-start space-x-3">
                                        <LogOut className="h-5 w-5 rotate-180" />
                                        <span>Sign In</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
