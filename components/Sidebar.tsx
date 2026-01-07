import { House, Mail, Bell, User, SquarePen } from "lucide-react";
import Link from "next/link";

const Sidebar = () => {
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
      <Link href="/"><House size={45} fill="currentColor" stroke="none" /></Link>
      <Link href="/messages"><Mail size={45} /></Link>
      <Link href="/notifications"><Bell size={45} /></Link>
      <Link href="/profile"><User size={45} /></Link>
      <SquarePen size={45} />
    </aside>
  )
}

export default Sidebar