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

                    {/* Mobile Navigation (Always Visible) */}
                    <div className="md:hidden">
                        <Sheet>
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
                                            <NavItems />
                                            <div className="pt-6 border-t mt-auto">
                                                <form
                                                    action={async () => {
                                                        "use server";
                                                        await signOut();
                                                    }}
                                                >
                                                    <Button variant="outline" size="lg" className="w-full justify-start space-x-3 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                        <LogOut className="h-5 w-5" />
                                                        <span className="font-semibold">Sign Out</span>
                                                    </Button>
                                                </form>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">Sign in to manage your assets and service records.</p>
                                            <Link href="/api/auth/signin" className="block">
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
                </div>
            </div>
        </nav>
    );
}
