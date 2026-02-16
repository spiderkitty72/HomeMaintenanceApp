import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench, LayoutDashboard, Package, ShieldCheck, Settings } from "lucide-react";
import { MobileNav } from "./MobileNav";

export async function Navbar() {
    const session = await auth();

    const NavItems = () => (
        <>
            <Link href="/dashboard" className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                <LayoutDashboard className="h-4 w-4 md:hidden" />
                <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/parts" className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                <Package className="h-4 w-4 md:hidden" />
                <span>Parts</span>
            </Link>
            {session && (session.user as any).role === "ADMIN" && (
                <Link href="/dashboard/admin" className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                    <ShieldCheck className="h-4 w-4 md:hidden" />
                    <span>Admin</span>
                </Link>
            )}
            <Link href="/dashboard/settings" className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                <Settings className="h-4 w-4 md:hidden" />
                <span>Settings</span>
            </Link>
        </>
    );

    return (
        <nav className="border-b bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Wrench className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl tracking-tight">MaintenanceApp</span>
                </Link>

                <div className="flex items-center space-x-1 sm:space-x-4">
                    {/* Desktop Navigation (Session Required) */}
                    {session && (
                        <div className="hidden md:flex items-center space-x-6">
                            <NavItems />
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <Button variant="ghost" size="sm">
                                    Sign Out
                                </Button>
                            </form>
                        </div>
                    )}

                    {!session && (
                        <div className="hidden md:block">
                            <Link href="/api/auth/signin">
                                <Button size="sm">Sign In</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Navigation */}
                    <MobileNav session={session} />
                </div>
            </div>
        </nav>
    );
}
