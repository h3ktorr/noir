import { profiles } from "@/assets/dummydata"
import Image from "next/image"
import { Plus } from "lucide-react";

const Stories = () => {
  return (
    <div className="flex gap-4 overflow-x-auto overflow-y-hidden p-4 no-scrollbar text-2xl">
     <div className="min-w-52 h-64 shrink-0 rounded-2xl border">
      <Plus size={40} className="m-auto mt-20 text-foreground" />
      <p className="text-center mt-4 text-foreground">Create Story</p>
     </div>
      {profiles.map(profile => (
        <div
          key={profile.id}
          style={{
            backgroundImage: `url(${profile.story.src})`,
          }}
          className="min-w-52 h-64 shrink-0 rounded-2xl p-1 flex flex-col justify-between shadow-md bg-cover bg-center relative"
        >
         <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/70 via-black/30 to-transparent" />
         <div className="relative p-5 flex flex-col justify-between h-full text-white"> 
          <Image
           src={profile.image}
           alt="profile-pix"
           width={70}
           height={70}
           className="rounded-full"
          />
          <p className="">{profile.name}</p>
         </div>
        </div>
      ))}
    </div>
  )
}

export default Stories
