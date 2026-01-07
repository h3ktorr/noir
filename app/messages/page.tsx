import AllMessages from "@/components/AllMessages"
import SingleMessage from "@/components/SingleMessage"

const page = () => {
  return (
    <div className="w-full flex h-screen">
      <AllMessages />
      <SingleMessage />
    </div>
  )
}

export default page
