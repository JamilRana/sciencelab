import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bengali = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Science Lab Coaching Center",
  description: "Academic & Administrative Management System",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, bengali.variable)}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-950 selection:bg-indigo-100 selection:text-indigo-900">
        <NextTopLoader showSpinner={false} color="#4f46e5" height={2.5} />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
