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
    <div>
      <Sidebar />
      <Navbar />
      <main className="ml-24 pt-14 w-full flex flex-col min-h-screen overflow-x-hidden">
        <div className="grow flex flex-col">
          {children}
        </div>
        <Footer />
      </main>
      <CreatePost />
    </div>
  );
}
