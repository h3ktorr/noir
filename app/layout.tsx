import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Nunito } from "next/font/google";
import Footer from "@/components/Footer";
import CreatePost from "@/components/CreatePost";
import AppContextProvider from "@/context/AppContext";

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
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <AppContextProvider>
        <body className="flex h-screen">
          <Sidebar />
          <Navbar />
          <main className="ml-24 pt-14 w-full flex flex-col min-h-screen overflow-x-hidden">
            <div className="grow flex flex-col">
              {children}
            </div>
            <Footer />
          </main>
          <CreatePost />
        </body>
      </AppContextProvider>
    </html>
  );
}
