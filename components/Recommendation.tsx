import prisma from "@/lib/prisma"
import ImageComp from "./ImageComp"
import { auth } from "@clerk/nextjs/server"

const Recommendation = async () => {
 const { userId } = await auth()

 if (!userId) return;

 const followingIds = await prisma.follow.findMany({
  where: {
    followerId: userId
  },
  select: {
    followingId: true
  }
 });

 const followedUserIds = followingIds.map(follow => follow.followingId);

 const friendRecommendations = await prisma.user.findMany({
  where: {
    id: {
      notIn: [...followedUserIds, userId]
    },
    following: {
      some: {
        followerId:{
          in: followedUserIds
        }
      }
    }
  },
  take: 3,
  select: {
    id: true,
    displayName: true,
    username: true,
    img: true
  }
 });

  return (
    <div className="w-11/12 m-auto mt-4 p-4 border border-gray-100 rounded-lg max-h-screen">
      <div className="">
        <h2 className="text-lg font-bold">Recommendation</h2>
        <p className="text-gray-500">Find people you might like</p>
      </div>
      <div className="">
       {friendRecommendations.map((person) => (
       <div className="flex flex-col gap-4 mt-4" key={person.id} >
         <div className="flex items-center gap-4">
           <ImageComp
             src={person.img || "general/noAvatar.png"}
             alt=""
             w={40}
             h={40}
             className={`rounded-full h-fit`}
           />
           <div className="">
             <h3 className="font-bold">{person.displayName}</h3>
             <p className="text-gray-500">@{person.username}</p>
           </div>
           <button className="bg-foreground text-background px-4 py-2 rounded-lg hover:bg-blue-600 ml-auto">
             Follow
           </button>
         </div> 
       </div>
       ))}
      </div>
      <p className="text-blue-500 hover:text-blue-700 cursor-pointer mt-4">See more</p>
    </div>
  )
}

export default Recommendation