import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            email: true,
        },
    });

    if (!user) {
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8 px-4">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and security preferences.</p>
                </div>
            </div>

            <SettingsForm user={user} />
        </div>
    );
}
