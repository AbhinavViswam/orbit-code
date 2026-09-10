import { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "@/clientProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Orbit Code',
  description: 'Collaborate and build with AI',
  icons:{
    icon:"/favicon.svg"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <ClientProvider>{children}</ClientProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
