import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench, Shield, Smartphone, Zap } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="px-4 py-16 md:py-32 bg-gradient-to-b from-card to-background border-b">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center justify-center p-2 mb-8 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Wrench className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Professional Maintenance Tracking</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Keep Your Assets in <span className="text-primary italic">Peak</span> Condition.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Track service records, fuel usage, and predict upcoming maintenance for your cars, property, and tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {session ? (
              <Button size="lg" asChild className="text-lg px-8 py-6 rounded-xl">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="text-lg px-8 py-6 rounded-xl">
                <Link href="/login">Get Started Free</Link>
              </Button>
            )}
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl">
              Learn More
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Predictive AI</h3>
              <p className="text-muted-foreground italic">
                Get smart reminders based on your actual usage patterns and service schedules.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mobile First</h3>
              <p className="text-muted-foreground italic">
                Designed for the garage and the field. Log fuel and service events in seconds from your phone.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Privacy Focused</h3>
              <p className="text-muted-foreground italic">
                Your data stays secure with encrypted logins and standalone SQLite database architecture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center mb-4 space-x-2">
            <Wrench className="h-5 w-5" />
            <span className="font-bold">MaintenanceApp</span>
          </div>
          <p>© 2024 MaintenanceApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
