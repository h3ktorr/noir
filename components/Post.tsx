import { Ellipsis, MessageCircle, Repeat2, Heart, Bookmark, Repeat } from "lucide-react";
import ImageComp from "./ImageComp";
import VideoComp from "./VideoComp";
import Link from "next/link";
import {Post as PostType} from "@prisma/client";
import {format} from "timeago.js"

type PostWithDetails = PostType & {
  user: {
    displayName: string;
    username: string;
    img: string;
  }
};

const Post = ({comment, post}: {comment?: boolean, post: PostWithDetails}) => {
 
  return (
   <div key={post.id} className={`border-b last:border-b-0 w-150 pb-6 1xl:self-start self-center ${comment ? "px-4 first:border-t pt-6 h-fit" : "px-12 pt-12"}`}>
    {post.rePostId && (
      <div className="flex gap-4 items-center mb-6">
        <Repeat size={20} className="text-foreground" />
        <p>{post.user.displayName} Reposted</p>
      </div>
    )}
    <div className="flex">
     {post.user.img && (
       <ImageComp
         src={post.user.img}
         alt={post.user.displayName}
         w={70}
         h={70}
         className={`rounded-full h-fit ${comment && "w-12 h-12"}`}
       />
     )}
     <div className="w-full">
       {/* FEED HEADER*/}
     <div className="flex justify-between  w-full items-center">
       <div className="flex">
         <Link href="/h3ktorr">
           <p className="m-auto ml-8 font-semibold">{post.user.displayName}</p>
         </Link>
          <p className="m-auto ml-4 text-sm text-foreground/70">@{post.user.username}</p>
           <p className="m-auto ml-4 text-sm text-foreground/70">{format(post.createdAt)}</p>
       </div>
       <Ellipsis size={20} className="text-foreground" />
     </div>
     {/* FEED BODY*/}
     <Link href='/h3ktorr/status/123'>
       <div className={`ml-8 flex flex-col gap-4 w-full ${comment ? "pt-2" : "pt-6"}`}>
         <p className="">{post.desc}</p>
         {post.user.img && post.user.img.fileType === "image" && <ImageComp
           src={post.user.img}
           alt={post.user.displayName}
           w={100}
           h={100}
           className="rounded-2xl w-100 h-100" tr={true}
         />}
         {post.user.img && post.user.img.fileType === "non-image" && <VideoComp
           src={post.user.img}
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
   </div>
)}

export default Post