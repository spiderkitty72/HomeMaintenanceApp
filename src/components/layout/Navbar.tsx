import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export async function Navbar() {
    const session = await auth();

    return (
        <nav className="border-b bg-card">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Wrench className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl tracking-tight">MaintenanceApp</span>
                </Link>

                <div className="flex items-center space-x-4">
                    {session ? (
                        <>
                            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/dashboard/parts" className="text-sm font-medium hover:text-primary transition-colors">
                                Parts
                            </Link>
                            {(session.user as any).role === "ADMIN" && (
                                <Link href="/dashboard/admin" className="text-sm font-medium hover:text-primary transition-colors">
                                    Admin
                                </Link>
                            )}
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
