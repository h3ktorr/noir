import  prisma from "@/lib/prisma";
import Post from "./Post";
import { auth } from "@clerk/nextjs/server";
import InfiniteFeed from "./InfiniteFeed";


const Feed = async ({userProfileId}: {userProfileId?: string}) => {

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
    include: {
      user: {
        select: {
          displayName: true,
          username: true,
          img: true
        }
      },
      rePost: {
        include: {
          user: {
            select: {
              displayName: true,
              username: true,
              img: true
            }
          },
          _count: {
            select: {
              likes: true,
              rePosts: true,
              comments: true
            }
          },
          likes: {
            where: {
              userId: userId
            },
            select: {
              id: true
            }
          },
          rePosts: {
            where: {
              userId: userId
            },
            select: {
              id: true
            }
          },
          saves: {
            where: {
              userId: userId
            },
            select: {
              id: true
            }
          }
        }
      },
      _count: {
        select: {
          likes: true,
          rePosts: true,
          comments: true
        }
      },
      likes: {
        where: {
          userId: userId
        },
        select: {
          id: true
        }
      },
      rePosts: {
        where: {
          userId: userId
        },
        select: {
          id: true
        }
      },
      saves: {
        where: {
          userId: userId
        },
        select: {
          id: true
        }
      },
    },
    take: 3, 
    skip: 0, 
    orderBy: { createdAt: 'desc' } 
  });

  console.log(post);
  

  return (
    <div className="border-r border-gray-100 max-w-fit">
      {post.map((post) => {
        return (
          <Post key={post.id} post={post} />
        )
      })}
      <InfiniteFeed />
    </div>
  )
}

export default Feed