import { feeds } from "@/assets/dummydata"
import { Ellipsis, MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react";
import ImageComp from "./ImageComp";
import { getFileDetails } from "@/actions/getFileDetails";
import VideoComp from "./VideoComp";

const Feed = async () => {
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

  return (
    <div className="flex flex-col gap-4">
      {feedsWithImages.map((feed) => {
        
        return (
          <div key={feed.id} className="border-b last:border-b-0 w-150 h-162.5 px-12 pt-12 pb-6 flex self-center">
            <ImageComp
              src={feed.feedImage}
              alt={feed.name}
              w={70}
              h={70}
              className="rounded-full h-fit"
            />
            <div className="">
              {/* FEED HEADER*/}
            <div className="flex justify-between  w-full items-center">
              <div className="flex">
                <p className="m-auto ml-8 font-semibold">{feed.name}</p>
                <p className="m-auto ml-4 text-sm text-foreground/70">{feed.createdAt}</p>
              </div>
              <Ellipsis size={20} className="text-foreground" />
            </div>
            {/* FEED BODY*/}
            <div className="ml-8 pt-6 flex flex-col gap-4 w-full">
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
            {/* FEED FOOTER*/}
            <div className="flex pt-8 gap-16 justify-center">
              <MessageCircle size={30} className="text-foreground" />
              <Repeat2 size={30} className="text-foreground" />
              <Heart size={30} className="text-foreground" />
              <Bookmark size={30} className="text-foreground" />
            </div>
            </div>
          </div>
      )})}
    </div>
  )
}

export default Feed