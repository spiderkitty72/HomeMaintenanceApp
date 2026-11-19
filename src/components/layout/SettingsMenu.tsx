"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, Info, Bug, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AboutDialog } from "./AboutDialog";
import { REPORT_BUG_URL } from "./nav-items";

/** Gear menu at the right of the top bar: account settings, about, bug report and sign out. */
export function SettingsMenu({ userName }: { userName?: string | null }) {
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Settings menu" title="Settings">
                        <Settings className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    {userName && (
                        <>
                            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{userName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
                        <Info className="h-4 w-4" />
                        About
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a href={REPORT_BUG_URL} target="_blank" rel="noopener noreferrer">
                            <Bug className="h-4 w-4" />
                            Report a bug
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-red-600 focus:text-red-600">
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        </>
    );
}
