import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ReactNode } from "react";

export function MarketingPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
          {lead && <p className="text-lg text-muted-foreground mb-10">{lead}</p>}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
