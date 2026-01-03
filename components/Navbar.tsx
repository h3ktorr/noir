import Image from "next/image"

const Navbar = () => {
  return (
    <div className="fixed top-0 left-24
      h-14
      w-[calc(100vw-6rem)]
      flex items-center justify-between
      border-b border-foreground
      px-8
      bg-background
      z-40">
      <Image 
        src="/light-logo.svg"
        alt="Logo"
        width={100}
        height={100}
        className="dark:hidden"
      />
      <Image 
        src="/dark-logo.svg"
        alt="Logo"
        width={100}
        height={100}
        className="hidden dark:block"
      />
      <input type="text" placeholder="Search..." className="px-4 py-2 w-72 rounded-md bg-background border border-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
    </div>
  )
}

export default Navbar