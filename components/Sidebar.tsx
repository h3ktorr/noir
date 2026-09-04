'use client'

import { AppContext } from "@/context/AppContext";
import { useContext } from "react";
import { House, Mail, Bell, User, SquarePen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";    

const Sidebar = () => {
  const { openCreatePost } = useContext(AppContext)!;
  const pathname = usePathname();
  return (
    <aside className="
    fixed z-50 bg-background border-foreground text-foreground

    bottom-0 left-0 w-full h-16
    flex flex-row items-center justify-around
    border-t

    md:top-0 md:left-0 md:bottom-auto
    md:w-24 md:h-screen
    md:flex-col md:justify-center
    md:gap-12
    md:border-t-0 md:border-r
    ">
      <Link href="/">
        <House
            size={32}
            className="md:w-11.25 md:h-11.25"
          fill={pathname === "/" ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/messages">
        <Mail
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname.startsWith("/messages") ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/notifications">
        <Bell
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname.startsWith("/notifications") ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/kelly">
        <User
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname.startsWith("/kelly") ? "currentColor" : "none"}
        />
      </Link>
      <button onClick={openCreatePost} aria-label="Create post" className="text-foreground hover:cursor-pointer">
        <SquarePen size={32}
          className="md:w-11.25 md:h-11.25" />
      </button>
    </aside>
  )
}

export default Sidebar