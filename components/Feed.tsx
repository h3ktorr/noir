import { feeds } from "@/assets/dummydata"
import { Ellipsis, MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react";
import ImageComp from "./ImageComp";
import { getFileDetails } from "@/actions/getFileDetails";
import VideoComp from "./VideoComp";
import Link from "next/link";
import  prisma from "@/lib/prisma";

const Feed = async ({comment}: {comment?: boolean}) => {
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

  const users = await prisma.user.findMany();

  const post = await prisma.post.findMany()

  console.log(users);
  console.log(post);
  return (
    <div className="">
      {feedsWithImages.map((feed) => {
        
        return (
          <div key={feed.id} className={`border-b last:border-b-0 w-150 pb-6 flex 1xl:self-start self-center ${comment ? "px-4 first:border-t pt-6 h-fit" : "px-12 pt-12 h-162.5"}`}>
            <ImageComp
              src={feed.feedImage}
              alt={feed.name}
              w={70}
              h={70}
              className={`rounded-full h-fit ${comment && "w-12 h-12"}`}
            />
            <div className="w-full">
              {/* FEED HEADER*/}
            <div className="flex justify-between  w-full items-center">
              <div className="flex">
                <Link href="/h3ktorr">
                  <p className="m-auto ml-8 font-semibold">{feed.name}</p>
                </Link>
                  <p className="m-auto ml-4 text-sm text-foreground/70">{feed.createdAt}</p>
              </div>
              <Ellipsis size={20} className="text-foreground" />
            </div>
            {/* FEED BODY*/}
            <Link href='/h3ktorr/status/123'>
              <div className={`ml-8 flex flex-col gap-4 w-full ${comment ? "pt-2" : "pt-6"}`}>
                <p className="">{feed.caption}</p>
                {feed.fileDetails?.fileType === "image" && <ImageComp
                  src={feed.fileDetails?.url}
                  alt={feed.name}
                  w={feed.fileDetails?.width}
                  h={feed.fileDetails?.height}
                  className="rounded-2xl w-100 h-100" tr={true}
                />}
                {feed.fileDetails?.fileType === "non-image" && <VideoComp
                  src={feed.fileDetails?.url}
                  className="rounded-2xl w-100 h-100"
                  tr={true}
                />}
              </div>
            </Link>
            {/* FEED FOOTER*/}
            <div className={`flex pt-8 gap-16 ${comment ? "justify-end mr-10" : "justify-center"}`}>
              <MessageCircle size={27} className="text-foreground" />
              <Repeat2 size={27} className="text-foreground" />
              <Heart size={27} className="text-foreground" />
              <Bookmark size={27} className="text-foreground" />
            </div>
            </div>
          </div>
      )})}
    </div>
  )
}

export default Feed