import Feed from "@/components/Feed"
import { MapPin, CalendarDays } from "lucide-react";
import ImageComp from "@/components/ImageComp";
import LogoutButton from "@/components/LogoutButton";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import FollowButton from "@/components/FollowButton";

const page = async ({params}:{params: Promise< {username: string} >}) => {
    const { username } = await params;

  const { userId } = await auth();
  const user = await prisma.user.findUnique({
    where: {username: username},
    include: {
      _count: {
        select: {
          followers: true,
          following: true
        }
      },
      following: userId ? {
        where: {
          followerId: userId
        }
      } : undefined,
    }
  })

  if(!user) return notFound()

  return (
    <div className="w-full">
      <div className="w-full border-b border-gray-300 mb-6">
        {/* COVER + AVATAR */}
        <div className="relative w-full">

          {/* COVER */}
          <div className="relative w-full aspect-3/1 bg-gray-300 h-72">
            {user.cover && (
              <ImageComp
                src={user.cover}
                alt="Cover"
                tr={true}
                w={1200}
                h={288}
                className="object-cover"
              />
            )}
          </div>

          {/* AVATAR */}
          <div className="absolute left-6 -bottom-16 overflow-hidden w-23 h-23  rounded-full bg-gray-300">
            <div className="">
              <ImageComp
                src={user.img || "general/noAvatar.png"}
                alt="Avatar"
                w={92}
                h={92}
                className="object-cover rounded-full md:w-30 md:h-30"
              />
            </div>
          </div>

        </div>

        {/* PROFILE CONTENT */}
        <div className="max-w-4xl px-6 pt-20 pb-6 flex flex-col gap-4">

          {/* NAME + USERNAME */}
          <div>
            <div className="flex justify-between">
              <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                {user.displayName}
              </h1>
              <div className="flex gap-4">
                <LogoutButton />
                <FollowButton userId={user.id} isFollowed={!!user.following.length} />
              </div>
            </div>
            <p className="text-foreground/60 text-sm">
              @{user.username}
            </p>
          </div>

          {/* BIO */}
          {user.bio && (
            <p className="text-foreground leading-relaxed max-w-xl">
              {user.bio}
            </p>
          )}

          {/* JOB & LOCATION & DATE */}
            <div className="flex gap-4 text-textGray text-[15px]">
            {user.location && <div className="flex gap-2 items-center">
            <MapPin size={20} />
              <span className="">{user.location}</span>
              </div>}
              <div className="flex gap-2 items-center">
                <CalendarDays size={20} />
              <span className="">
                Joined{" "} 
                {
                  new Date ( 
                    user.createdAt.toString()).toLocaleDateString(
                      "en-Us",
                      { month: "long", year: "numeric" }
                    )
                    }
              </span>
              </div>
            </div>

          {/* FOLLOW STATS */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-semibold">
                {user._count.followers}
              </span>
              <span className="text-foreground/60">
                Followers
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold">
                {user._count.following}
              </span>
              <span className="text-foreground/60">
                Following
              </span>
            </div>
          </div>

        </div>
      </div>
      <Feed userProfileId={user.id} />
    </div>
  )
}

export default page
