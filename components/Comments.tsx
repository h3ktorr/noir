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
    <div className="ml-4 md:ml-0 mt-4 w-1/2 md:w-full">
     {user && <form action={formAction} className="p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0">
      <ImageComp
        src={user.imageUrl}
        alt="User Avatar"
        w={48}
        h={48}
        className="rounded-full"
      />
    </div>

    <button
      disabled={isPending}
      className="
        py-2 px-4
        font-bold
        bg-white text-black
        rounded-full
        disabled:cursor-not-allowed
        disabled:bg-slate-200
      "
    >
      {isPending ? "Replying..." : "Reply"}
    </button>
  </div>

  <input type="number" hidden readOnly name="postId" value={postId} />
  <input type="text" hidden readOnly name="username" value={username} />

  <input
    type="text"
    name="desc"
    placeholder="Post your reply"
    className="
      w-full
      bg-background border border-foreground
      focus:outline-none focus:ring-2 focus:ring-primary
      p-2 px-4 text-base sm:text-lg
      rounded-full
    "
  />
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