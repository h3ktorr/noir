import { user } from "@/assets/dummydata"
import ImageComp from "@/components/ImageComp"

const Comments = () => {
  return (
    <div>
     <form className="flex items-center gap-4 justify-between p-4">
      <div className="relative w-12 h-12 rounded-full overflow-hidden">
       <ImageComp
        src={user.userImage}
        alt={user.name}
        w={48}
        h={48}
        className="rounded-full"
       />
      </div>
      <input type="text" className="flex-1 bg-background border border-foreground focus:outline-none focus:ring-2 focus:ring-primary p-2 px-5 text-lg ml-8 rounded-4xl" placeholder="Post your reply" />
      <button className="py-2 px-4 font-bold bg-white text-black rounded-full">Reply</button>
     </form>
    </div>
  )
}

export default Comments