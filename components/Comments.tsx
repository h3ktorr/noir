"use client";

import ImageComp from "@/components/ImageComp"
import {Post as PostType} from "@prisma/client";
import Post from "./Post";
import { useUser } from "@clerk/nextjs";
import { useActionState } from "react";
import { addComment } from "@/action";

type CommentWithDetails = PostType & {
  user: { 
    displayName: string | null;
    username: string;
    img: string | null;
  };
  _count: {
    likes: number;
    rePosts: number;
    comments: number;
  };
  likes: {
    id: number;
  }[];
  rePosts: {
    id: number;
  }[];
  saves: {
    id: number;
  }[];
}

const Comments = ({ comments, postId, username }: { comments: CommentWithDetails[]; postId: number; username: string }) => {
  const { isLoaded, user, isSignedIn } = useUser();

  const [state, formAction, isPending] = useActionState(addComment, {success: false, error: false})

  return (
    <div className="mt-4">
     {user && <form action={ formAction } className="flex items-center gap-4 justify-between p-4">
      <div className="relative w-12 h-12 rounded-full overflow-hidden">
       <ImageComp
        src={ user?.imageUrl }
        alt={ "User Avatar" }
        w={40}
        h={40}
        className={`rounded-full h-fit`}
      />
      </div>
      <input type="number" hidden readOnly name="postId" value={postId} />
      <input type="text" hidden readOnly name="username" value={username} />
      <input type="text" name="desc" className="flex-1 bg-background border border-foreground focus:outline-none focus:ring-2 focus:ring-primary p-2 px-5 text-lg ml-2 rounded-4xl" placeholder="Post your reply" />
      <button disabled={isPending} className="py-2 px-4 font-bold bg-white text-black rounded-full disabled:cursor-not-allowed disabled:bg-slate-200">{ isPending ? "Replying..." : "Reply" }</button>
     </form>}
     {state.error && <span className="text-red-500 p-4">Something went wrong!</span>}
     {
      comments.map((comment) => (
        <div key={comment.id} className="border-t border-gray-300 p-4">
          <Post comment={true} post={comment} />
        </div>
      ))
     }
    </div>
  )
}

export default Comments