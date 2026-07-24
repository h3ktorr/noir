'use client'

import { AppContext } from "@/context/AppContext";
import { useContext } from "react";
import { House, Mail, Bell, User, SquarePen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";    
import Socket from "./Socket";

const Sidebar = () => {
  const { openCreatePost } = useContext(AppContext)!;
  const pathname = usePathname();
  return (
    <aside className="
      fixed left-0 top-0
      w-24 h-screen
      flex flex-col
      items-center justify-center
      gap-12
      border-r border-foreground
      text-foreground
      bg-background
      shrink-0
      z-50
    ">
      <Link href="/">
        <House
          size={45}
          fill={pathname === "/" ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/messages">
        <Mail
          size={45}
          fill={pathname.startsWith("/messages") ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/notifications">
        <Bell
          size={45}
          fill={pathname.startsWith("/notifications") ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/kelly">
        <User
          size={45}
          fill={pathname.startsWith("/kelly") ? "currentColor" : "none"}
        />
      </Link>
      <button onClick={openCreatePost} aria-label="Create post" className="text-foreground hover:cursor-pointer">
        <SquarePen size={45} />
      </button>
      <Socket />
    </aside>
  )
}

export default Sidebar