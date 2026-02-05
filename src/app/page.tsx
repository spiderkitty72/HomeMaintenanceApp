import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wrench, Home, Car, Hammer, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth();

  const categories = [
    {
      title: "Property",
      icon: Home,
      description: "Home & Real Estate",
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-500",
    },
    {
      title: "Vehicles",
      icon: Car,
      description: "Cars, Trucks & Bikes",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-500",
    },
    {
      title: "Equipment",
      icon: Hammer,
      description: "Tools & Utility",
      gradient: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/3 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] rounded-full bg-blue-500/3 blur-[100px]" />
      </div>

      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center relative z-10 py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Maintenance<span className="text-primary">App</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            The central hub for tracking your life's assets.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all w-full sm:w-auto">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all w-full sm:w-auto">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
          {categories.map((cat, index) => (
            <Card key={index} className="group border-0 bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ring-1 ring-white/10 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                <div className={`p-4 rounded-2xl bg-background/80 shadow-sm mb-6 ${cat.iconColor} ring-1 ring-black/5 dark:ring-white/10`}>
                  <cat.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                <p className="text-sm text-muted-foreground font-medium">{cat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground relative z-10">
        <p>© 2026 MaintenanceApp. All systems nominal.</p>
      </footer>
    </div>
  );
}
