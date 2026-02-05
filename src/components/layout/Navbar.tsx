import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench, Menu, LayoutDashboard, Package, ShieldCheck, LogOut } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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
        </>
    );

    return (
        <nav className="border-b bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Wrench className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl tracking-tight">MaintenanceApp</span>
                </Link>

                <div className="flex items-center space-x-4">
                    {session ? (
                        <>
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-6">
                                <NavItems />
                                <form
                                    action={async () => {
                                        "use server";
                                        await signOut();
                                    }}
                                >
                                    <Button variant="ghost" size="sm" className="hidden md:flex">
                                        Sign Out
                                    </Button>
                                </form>
                            </div>

                            {/* Mobile Navigation */}
                            <div className="md:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="md:hidden">
                                            <Menu className="h-6 w-6" />
                                            <span className="sr-only">Toggle navigation menu</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                                        <SheetHeader className="text-left border-b pb-4 mb-4">
                                            <SheetTitle className="flex items-center space-x-2">
                                                <Wrench className="h-5 w-5 text-primary" />
                                                <span>MaintenanceApp</span>
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="flex flex-col space-y-4">
                                            <NavItems />
                                            <div className="pt-4 border-t">
                                                <form
                                                    action={async () => {
                                                        "use server";
                                                        await signOut();
                                                    }}
                                                >
                                                    <Button variant="outline" size="sm" className="w-full justify-start space-x-2">
                                                        <LogOut className="h-4 w-4" />
                                                        <span>Sign Out</span>
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </>
                    ) : (
                        <Link href="/api/auth/signin">
                            <Button size="sm">Sign In</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
