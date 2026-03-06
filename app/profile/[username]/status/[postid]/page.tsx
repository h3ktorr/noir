import ImageComp from "@/components/ImageComp"
import { user } from "@/assets/dummydata"
import { Ellipsis, MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react"
import VideoComp from "@/components/VideoComp"
import { getFileDetails } from "@/actions/getFileDetails"
import Comments from "@/components/Comments"


const page = async () => {
  const fileDetails = user.fileId
          ? await getFileDetails(user.fileId)
          : null;
  return (
    <div className="p-4 1xl:self-start self-center">
      <h1 className="text-2xl font-bold">Post</h1>
      <div className="border-t border-gray-300 pb-4 mt-4 ">
       <div className="mt-4 flex items-center space-x-3 font-semibold text-foreground/70">
        <Repeat2 size={27} className="" />
        <span> Kelvin reposted</span>
       </div>
       <div className="border-b last:border-b-0 w-150 h-162.5 px-12 pt-12 pb-6 flex 1xl:self-start self-center">
            <ImageComp
              src={user.feedImage}
              alt={user.name}
              w={70}
              h={70}
              className="rounded-full h-fit"
            />
            <div className="">
              {/* FEED HEADER*/}
            <div className="flex justify-between  w-full items-center">
              <div className="flex">
                <p className="m-auto ml-8 font-semibold">{user.name}</p>
                <p className="m-auto ml-4 text-sm text-foreground/70">{(user.createdAt).toLocaleString()}</p>
              </div>
              <Ellipsis size={20} className="text-foreground" />
            </div>
            {/* FEED BODY*/}
            <div className="ml-8 pt-6 flex flex-col gap-4 w-full">
              <p className="">{user.caption}</p>
              {fileDetails?.fileType === "image" && <ImageComp
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
              />}
            </div>
            {/* FEED FOOTER*/}
            <div className="flex pt-8 gap-16 justify-center">
              <MessageCircle size={27} className="text-foreground" />
              <Repeat2 size={27} className="text-foreground" />
              <Heart size={27} className="text-foreground" />
              <Bookmark size={27} className="text-foreground" />
            </div>
            </div>
          </div>
      </div>
          <Comments />
    </div>
  )
}

export default page