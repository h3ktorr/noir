import  prisma from "@/lib/prisma";
import Post from "./Post";
import { getFileDetails } from "@/actions/getFileDetails";
import { feeds } from "@/assets/dummydata"
import { auth } from "@clerk/nextjs/server";
import InfiniteFeed from "./InfiniteFeed";


const Feed = async ({userProfileId}: {userProfileId?: string}) => {
  const feedsWithImages = await Promise.all(
       feeds.map(async (feed) => {
         const details = feed.fileId
           ? await getFileDetails(feed.fileId)
           : null;        
   
         return {
           ...feed,
           fileDetails: details
         };
       })
     );

  const {userId} = await auth()
  if(!userId) return 
    

  const whereCondition = userProfileId ? { parentPostId: null, userId: userProfileId } : {
    parentPostId: null,
    userId: {
      in: [userId, ...(await prisma.follow.findMany({
        where: {
          followerId: userId
        },
        select: {
          followingId: true
        }
      })).map(follow => follow.followingId)
  ]}};

  const post = await prisma.post.findMany({ 
    where: whereCondition, 
    take: 3, 
    skip: 0, 
    orderBy: { createdAt: 'desc' } 
  });

  console.log(post);
  

  return (
    <div className="">
      {feedsWithImages.map((feed) => {
        return (
          <Post key={feed.id} post={feed} />
        )
      })}
      <InfiniteFeed />
    </div>
  )
}

export default Feed