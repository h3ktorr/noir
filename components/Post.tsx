import { Ellipsis, MessageCircle, Repeat2, Heart, Bookmark, Repeat } from "lucide-react";
import ImageComp from "./ImageComp";
import VideoComp from "./VideoComp";
import Link from "next/link";
import {Post as PostType} from "@prisma/client";
import {format} from "timeago.js"
import PostInteractions from "./PostInteractions";

type PostWithDetails = PostType & {
    user: {
      displayName: string;
      username: string;
      img: string;
    };
  rePost?: PostType & {
    user: {
      displayName: string;
      username: string;
      img: string;
    };
  };
  _count: {
    likes: number;
    rePosts: number;
    comments: number;
  }
};

const Post = ({comment, post}: {comment?: boolean, post: PostWithDetails}) => {

  const originalPost = post.rePost || post;

  console.log(post._count);
  
  return (
   <div key={post.id} className={`border-b last:border-b-0 w-150 pb-6 1xl:self-start self-center ${comment ? "px-4 first:border-t pt-6 h-fit" : "px-12 pt-12"}`}>
    {post.rePostId && (
      <div className="flex gap-4 items-center mb-6">
        <Repeat size={20} className="text-foreground" />
        <p>{post.user.displayName} Reposted</p>
      </div>
    )}
    <div className="flex">
     
       <ImageComp
         src={originalPost.user.img || "general/noAvater.png"}
         alt={originalPost.user.displayName}
         w={50}
         h={50}
         className={`rounded-full h-fit ${comment && "w-12 h-12"}`}
       />
     
     <div className="w-full">
       {/* FEED HEADER*/}
     <div className="flex justify-between  w-full items-center">
       <div className="flex">
         <Link href="/h3ktorr">
           <p className="m-auto ml-8 font-semibold">{originalPost.user.displayName}</p>
         </Link>
          <p className="m-auto ml-4 text-sm text-foreground/70">@{originalPost.user.username}</p>
           <p className="m-auto ml-4 text-sm text-foreground/70">{format(originalPost.createdAt)}</p>
       </div>
       <Ellipsis size={20} className="text-foreground" />
     </div>
     {/* FEED BODY*/}
     <Link href='/h3ktorr/status/123'>
       <div className={`ml-8 flex flex-col gap-4 w-full ${comment ? "pt-2" : "pt-6"}`}>
         <p className="">{originalPost.desc}</p>
         {originalPost.user.img && originalPost.user.img.fileType === "image" && <ImageComp
           src={originalPost.user.img}
           alt={originalPost.user.displayName}
           w={100}
           h={100}
           className="rounded-2xl w-100 h-100" tr={true}
         />}
         {originalPost.user.img && originalPost.user.img.fileType === "non-image" && <VideoComp
           src={originalPost.user.img}
           className="rounded-2xl w-100 h-100"
           tr={true}
         />}
       </div>
     </Link>
     {/* FEED FOOTER*/}
     <PostInteractions count={post._count} />
    </div>
   </div>
  </div>
)}

export default Post