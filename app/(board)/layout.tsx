import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreatePost from "@/components/CreatePost";

export default function BoardLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <Navbar />

      <main className="pt-14 w-screen md:w-[calc(100vw-6rem)] flex flex-col h-dvh overflow-x-hidden pb-32 md:ml-24 md:pb-11">
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>

        <Footer />
      </main>

      <CreatePost />
    </div>
  );
}