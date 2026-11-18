"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wrench, Menu, LogOut, LogIn, Settings, Bug, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { AboutDialog } from "./AboutDialog";
import { isActivePath, REPORT_BUG_URL, visibleNavItems } from "./nav-items";

interface MobileNavProps {
    isSignedIn: boolean;
    isAdmin: boolean;
}

const itemClass = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function MobileNav({ isSignedIn, isAdmin }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const pathname = usePathname();
    // Every link and action below closes the menu itself.

    const linkClass = (href: string) =>
        cn(itemClass, isActivePath(pathname, href) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground");

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
                    <SheetHeader className="text-left border-b pb-4 mb-4">
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <Wrench className="h-5 w-5 text-primary" />
                            <span>MaintenanceApp</span>
                        </SheetTitle>
                    </SheetHeader>
                    {isSignedIn ? (
                        <div className="flex flex-col gap-1">
                            {visibleNavItems(isAdmin).map(({ href, label, icon: Icon }) => (
                                <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </Link>
                            ))}

                            <div className="my-3 border-t" />

                            <Link href="/dashboard/settings" className={linkClass("/dashboard/settings")} onClick={() => setOpen(false)}>
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                            <button
                                type="button"
                                className={cn(itemClass, "text-muted-foreground hover:bg-accent/50 hover:text-foreground text-left")}
                                onClick={() => {
                                    setOpen(false);
                                    setAboutOpen(true);
                                }}
                            >
                                <Info className="h-4 w-4" />
                                <span>About</span>
                            </button>
                            <a
                                href={REPORT_BUG_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(itemClass, "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}
                                onClick={() => setOpen(false)}
                            >
                                <Bug className="h-4 w-4" />
                                <span>Report a bug</span>
                            </a>
                            <button
                                type="button"
                                className={cn(itemClass, "text-red-600 hover:bg-red-500/10 text-left")}
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sign out</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Sign in to manage your assets and service records.</p>
                            <Link href="/login" className="block" onClick={() => setOpen(false)}>
                                <Button size="lg" className="w-full justify-start gap-3">
                                    <LogIn className="h-5 w-5" />
                                    <span>Sign In</span>
                                </Button>
                            </Link>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        </div>
    );
}
