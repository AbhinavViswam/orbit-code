"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Check, Code2, Cpu, Rocket } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("token");
    if (token) {
      setHasSession(true);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <header className="px-6 h-16 flex items-center justify-between border-b border-zinc-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight">Orbit Code</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex gap-4">
          {isMounted && hasSession ? (
            <Button onClick={() => router.push("/main")} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Dashboard
            </Button>
          ) : isMounted ? (
            <>
              <Button variant="ghost" onClick={() => router.push("/login")} className="hover:bg-zinc-800">
                Sign In
              </Button>
              <Button onClick={() => router.push("/signup")} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Started
              </Button>
            </>
          ) : (
            <div className="w-20 h-10"></div> /* Placeholder to avoid layout shift before hydration */
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl px-6 py-32 flex flex-col items-center text-center gap-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Orbit Code 2.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-3xl leading-tight">
            The intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">workspace</span> for developers.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
            Collaborate with an autonomous AI engineer directly in your browser. Generate, edit, and execute code in seconds.
          </p>
          <div className="flex gap-4 mt-4">
            {isMounted && hasSession ? (
              <Button size="lg" onClick={() => router.push("/main")} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/signup")} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base">
                  Start Building Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/login")} className="border-zinc-800 hover:bg-zinc-900 bg-zinc-600 text-white h-12 px-8 text-base">
                  View Documentation
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full max-w-7xl px-6 py-24 border-t border-zinc-800/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Supercharge your workflow</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Everything you need to write better code, faster. Integrated directly into a modern, cloud-based IDE.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: "Autonomous AI Agent", desc: "Just describe what you need. Orbit Code will plan, write, and debug the entire application." },
              { icon: Code2, title: "Cloud Workspaces", desc: "Run your code in isolated sandboxes. See the output instantly without local setup." },
              { icon: Rocket, title: "Real-time Collaboration", desc: "Share your workspace with teammates and code together in real-time." }
            ].map((feature, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 text-white">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-indigo-400 mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-zinc-400">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full max-w-5xl px-6 py-24 border-t border-zinc-800/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-400">Start for free, upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="bg-zinc-950 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Hobby</CardTitle>
                <CardDescription className="text-zinc-400">For individuals and small projects.</CardDescription>
                <div className="mt-4 font-bold text-4xl">$0<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['100 AI queries per month', 'Basic cloud execution', 'Community support'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-zinc-900" onClick={() => router.push("/signup")}>Get Started</Button>
              </CardFooter>
            </Card>

            <Card className="bg-zinc-900 border-indigo-500/50 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription className="text-zinc-400">For professional developers.</CardDescription>
                <div className="mt-4 font-bold text-4xl">$20<span className="text-lg text-zinc-500 font-normal">/mo</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Unlimited AI queries', 'Advanced GPT-4o / Claude 3.5 access', 'Priority execution environments', 'Private workspaces'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-4 h-4 text-indigo-400" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push("/signup")}>Upgrade to Pro</Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 text-center text-zinc-500 text-sm border-t border-zinc-800/50">
        &copy; {new Date().getFullYear()} Orbit Code. All rights reserved.
      </footer>
    </div>
  );
}
