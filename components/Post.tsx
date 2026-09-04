import { Ellipsis, Repeat } from "lucide-react";
import ImageComp from "./ImageComp";
import VideoComp from "./VideoComp";
import Link from "next/link";
import {Post as PostType} from "@prisma/client";
import {format} from "timeago.js"
import PostInteractions from "./PostInteractions";

type PostWithDetails = PostType & {
    user: {
      displayName: string | null;
      username: string;
      img: string | null;
    };
  rePost?: PostType & {
    user: {
      displayName: string | null;
      username: string;
      img: string | null;
    };
    _count: {
      likes: number;
      rePosts: number;
      comments: number;
    }
    likes: {
      id: number;
    }[];
    rePosts: {
      id: number;
    }[];
    saves: {
      id: number;
    }[];
  } | null;
  _count: {
    likes: number;
    rePosts: number;
    comments: number;
  }
  likes: {
    id: number;
  }[];
  rePosts: {
    id: number;
  }[];
  saves: {
    id: number;
  }[];
};

const Post = ({comment, post}: {comment?: boolean, post: PostWithDetails}) => {

  const originalPost = post.rePost || post;
  
  return (
   <div key={post.id} className={`border-b last:border-b-0 w-150 pb-6 1xl:self-start self-center ${comment ? "pt-6 h-fit" : "px-6 md:px-12 pt-6 md:pt-12"}`}>
    {post.rePostId && (
      <div className="flex gap-4 items-center mb-6">
        <Repeat size={20} className="text-foreground" />
        <p>{post.user.displayName} Reposted</p>
      </div>
    )}
    <div className="md:flex">
      <div className="flex">
          <ImageComp
            src={originalPost.user.img || "general/noAvatar.png"}
            alt={originalPost.user.displayName || "User Avatar"}
            w={50}
            h={50}
            className={`rounded-full h-fit ${comment && "w-9 h-9"}`}
          />
          <div className="flex w-full items-center md:hidden">
            <Link href={`${originalPost.user.username}`}>
              <p className="ml-8 font-semibold">{originalPost.user.displayName}</p>
            </Link>
              <p className="ml-4 text-sm text-foreground/70">@{originalPost.user.username}</p>
              <p className="ml-4 text-sm text-foreground/70">{format(originalPost.createdAt)}</p>
        </div>
      </div>
     
     <div className="w-full">
       {/* FEED HEADER*/}
     <div className="justify-between  w-full items-center hidden md:flex">
       <div className="flex">
         <Link href={`${originalPost.user.username}`}>
           <p className="m-auto ml-8 font-semibold">{originalPost.user.displayName}</p>
         </Link>
          <p className="m-auto ml-4 text-sm text-foreground/70">@{originalPost.user.username}</p>
           <p className="m-auto ml-4 text-sm text-foreground/70">{format(originalPost.createdAt)}</p>
       </div>
       <Ellipsis size={20} className="text-foreground" />
     </div>
     {/* FEED BODY*/}
     <Link href={`${originalPost.user.username}/status/${originalPost.id}`}>
       <div className={`md:ml-8 flex flex-col gap-4 w-full justify-start ${comment ? "pt-2" : "pt-6"}`}>
         <p className="">{originalPost.desc}</p>
         {(originalPost.img && originalPost.img !== null) && <ImageComp
           src={originalPost.img}
           alt={originalPost.user.displayName || "User Avatar"}
           w={600}
           h={originalPost.imgHeight || 600}
           className="rounded-2xl h-75 w-75  md:w-100 md:h-100 object-contain" tr={true}
         />}
       </div>
     </Link>
     {/* FEED FOOTER*/}
     <PostInteractions 
      postId={originalPost.id}
      count={originalPost._count} 
      isLiked={!!originalPost.likes.length}
      isReposted={!!originalPost.rePosts.length}
      isSaved={!!originalPost.saves.length}
      comment={comment}
     />
    </div>
   </div>
  </div>
)}

export default Post