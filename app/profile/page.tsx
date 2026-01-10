import { user } from "@/assets/dummydata"
import Feed from "@/components/Feed"
import Image from "next/image"
import { MapPin, CalendarDays } from "lucide-react";

const page = () => {
  return (
    <div className="w-full">
      <div className="w-full border-b border-gray-300 mb-6">
        {/* COVER + AVATAR */}
        <div className="relative w-full">

          {/* COVER */}
          <div className="relative w-full aspect-3/1 bg-gray-300">
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* AVATAR */}
          <div className="absolute left-6 -bottom-16 rounded-full overflow-hidden">
            <div className="w-32 h-32 border-4 border-background bg-gray-300">
              <Image
                src={user.image}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>

        </div>

        {/* PROFILE CONTENT */}
        <div className="max-w-4xl px-6 pt-20 pb-6 flex flex-col gap-4">

          {/* NAME + USERNAME */}
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              {user.displayName}
            </h1>
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
      <Feed />
    </div>
  )
}

export default page
