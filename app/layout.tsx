import type { Metadata } from "next";
import "@/app/globals.css";
import { Nunito } from "next/font/google";
import AppContextProvider from "@/context/AppContext";
import { ClerkProvider } from '@clerk/nextjs';

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Noir",
  description: "A social media platform built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={nunito.variable}>
        <AppContextProvider>
          <body className="flex h-screen">
            {children}
          </body>
        </AppContextProvider>
      </html>
    </ClerkProvider>
  );
}
