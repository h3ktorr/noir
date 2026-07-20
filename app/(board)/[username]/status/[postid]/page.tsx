import ImageComp from "@/components/ImageComp"
import { Ellipsis } from "lucide-react"
import Comments from "@/components/Comments"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import PostInteractions from "@/components/PostInteractions"


const page = async ({params}:{params: Promise<{ username: string, postid: string }>}) => {
  const { username, postid } = await params;

  const { userId } = await auth();
  if (!userId) return;

  const post = await prisma.post.findFirst({
    where: {
      id: Number(postid),
    },
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
      },
      comments: {
        orderBy: { createdAt: "desc" },
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
          },
        }
      }
    }
  });

  if (!post) return notFound();

  return (
    <div className="p-4 1xl:self-start self-center">
      <h1 className="text-2xl font-bold">Post</h1>
      <div className="border-t border-gray-300 mt-4 ">
       {/* <div className="mt-4 flex items-center space-x-3 font-semibold text-foreground/70">
        <Repeat2 size={27} className="" />
        <span> Kelvin reposted</span>
       </div> */}
       <div className="border-b last:border-b-0 w-150 px-12 pt-12 pb-6 flex 1xl:self-start self-center">
            <ImageComp
              src={post.user.img || "general/noAvatar.png"}
              alt={post.user.displayName || "User Avatar"}
              w={50}
              h={50}
              className={`rounded-full h-fit`}
            />
            <div className="">
              {/* FEED HEADER*/}
            <div className="flex justify-between  w-full items-center">
              <div className="flex">
                <Link href="/h3ktorr">
                  <p className="m-auto ml-8 font-semibold">{post.user.displayName }</p>
                </Link>
                <p className="m-auto ml-4 text-sm text-foreground/70">@{post.user.username}</p>
                <p className="m-auto ml-4 text-sm text-foreground/70">{(post.createdAt).toLocaleString()}</p>
              </div>
              <Ellipsis size={20} className="text-foreground" />
            </div>
            {/* FEED BODY*/}
            <div className="ml-8 pt-6 flex flex-col gap-4 w-full">
              <p className="">{post.desc}</p>
              {/* {fileDetails?.fileType === "image" && <ImageComp
                src={fileDetails?.url}
                alt={user.name}
                w={fileDetails?.width}
                h={fileDetails?.height}
                className="rounded-2xl w-100 h-100" tr={true}
              />}
              {fileDetails?.fileType === "non-image" && <VideoComp
                src={fileDetails?.url}
                className="rounded-2xl w-100 h-100"
                tr={true}
              />} */}
            </div>
            {/* FEED FOOTER*/}
           <PostInteractions 
            isLiked={!!post.likes.length} 
            isReposted={!!post.rePosts.length} 
            isSaved={!!post.saves.length} 
            count={post._count}
            postId={post.id}
          />
          </div>
        </div>
      </div>
      <Comments comments={post.comments} postId={post.id} username={post.user.username} />
    </div>
  )
}

export default page
