import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";
import { SettingsMenu } from "./SettingsMenu";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Navbar() {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    return (
        <nav className="border-b bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-primary" />
                        <span className="font-bold text-xl tracking-tight">MaintenanceApp</span>
                    </Link>
                    {session && <DesktopNav isAdmin={isAdmin} />}
                </div>

                <div className="flex items-center gap-1">
                    {!session && (
                        <Link href="/login" className="hidden md:block">
                            <Button size="sm">Sign In</Button>
                        </Link>
                    )}
                    <ThemeToggle />
                    {session && (
                        <div className="hidden md:block">
                            <SettingsMenu userName={session.user?.name ?? session.user?.email} />
                        </div>
                    )}
                    <MobileNav isSignedIn={!!session} isAdmin={isAdmin} />
                </div>
            </div>
        </nav>
    );
}
