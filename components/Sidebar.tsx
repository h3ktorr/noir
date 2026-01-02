import { House, Mail, Bell, User, SquarePen } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="flex flex-col border-r border-foreground w-24 h-screen text-foreground gap-12 items-center justify-center">
      <House width={45} height={45} fill="currentColor" stroke="none" />
      <Mail width={45} height={45} />
      <Bell width={45} height={45} />
      <User width={45} height={45} />
      <SquarePen width={45} height={45} />
    </div>
  )
}

export default Sidebar
