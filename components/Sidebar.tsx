import { House, Mail, Bell, User, SquarePen } from "lucide-react";

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
      <House size={45} fill="currentColor" stroke="none" />
      <Mail size={45} />
      <Bell size={45} />
      <User size={45} />
      <SquarePen size={45} />
    </aside>
  )
}

export default Sidebar