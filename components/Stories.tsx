import { stories } from "@/assets/dummydata"
import { Plus } from "lucide-react";
import ImageComp from "./ImageComp";

const Stories = () => {
  const imageKitURL= process.env.NEXT_PUBLIC_URL_ENDPOINT
  return (
    <div className="w-screen md:w-[calc(100vw-96px)] flex gap-4 overflow-x-scroll overflow-y-hidden p-4 no-scrollbar text-2xl border-b pb-6">
     <div className=" w-36 md:min-w-52 h-50 md:h-64 shrink-0 rounded-2xl border">
      <Plus size={40} className="m-auto mt-20 text-foreground" />
      <p className="text-center mt-4 text-foreground text-[1.15rem] md:text-2xl">Create Story</p>
     </div>
      {stories.map(profile => (
        <div
          key={profile.id}
          style={{
            backgroundImage: `url(${imageKitURL}/${profile.story})`,
          }}
          className="w-36 md:min-w-52 h-50 md:h-64 shrink-0 rounded-2xl p-1 flex flex-col justify-between shadow-md bg-cover bg-center relative overflow-scroll"
        >
         <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/70 via-black/30 to-transparent" />
         <div className="relative p-5 flex flex-col justify-between h-full text-white"> 
          <ImageComp
           src={profile.image}
           alt="profile-pix"
           w={70}
           h={70}
           className="rounded-full"
          />
          <p className="text-[1.15rem] md:text-2xl">{profile.name}</p>
         </div>
        </div>
      ))}
    </div>
  )
}

export default Stories
