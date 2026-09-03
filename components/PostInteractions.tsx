"use client"

import { likePost, repostPost, savePost } from "@/action";
import { socket } from "@/socket";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react"
import { useOptimistic, useState } from "react";

const PostInteractions = ({count, isLiked, isReposted, isSaved, comment, postId, username}: {
  count: {likes: number; rePosts: number; comments: number};
  isLiked: boolean;
  isReposted: boolean;
  isSaved: boolean;
  comment?: boolean;
  postId: number;
  username?: string;
}) => {
  const likes = count.likes ?? 0;
  const rePosts = count.rePosts ?? 0;
  const comments = count.comments ?? 0;

  const [state, setState] = useState({
    likes: count.likes,
    isLiked: isLiked,
    rePosts: count.rePosts,
    isReposted: isReposted,
    isSaved: isSaved,
  })

  const { user } = useUser();

  const likeAction = async () => {

    if(!user) return

    socket.emit("sendNotification", {
      receiverUsername: username,
      data: {
        senderUsername: user.username,
        type: "like",
        link: `/${username}/status/${postId}`
      }
    })

    addOptimisticCount("like");
    await likePost(postId);
    setState((prev) => ({
      ...prev,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
      isLiked: !prev.isLiked,
    }));
  };

  const repostAction = async () => {
    addOptimisticCount("repost");
    await repostPost(postId);
    setState((prev) => ({
      ...prev,
      rePosts: prev.isReposted ? prev.rePosts - 1 : prev.rePosts + 1,
      isReposted: !prev.isReposted,
    }));
  };

  const saveAction = async () => {
    addOptimisticCount("save");
    await savePost(postId);
    setState((prev) => ({
      ...prev,
      isSaved: !prev.isSaved,
    }));
  }
  
  const [optimisticCount, addOptimisticCount] = useOptimistic(state, (prev, type: "like" | "repost" | "save") => {
    if(type === "like") {
      return {
        ...prev,
        likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
        isLiked: !prev.isLiked,
      }
    }
    if(type === "repost") {
      return {
        ...prev,
        rePosts: prev.isReposted ? prev.rePosts - 1 : prev.rePosts + 1,
        isReposted: !prev.isReposted,
      }
    }
    if(type === "save") {
      return {
        ...prev,
        isSaved: !prev.isSaved,
      }
    }
    return prev;
  })


  return (
    <div className={`flex pt-8 gap-16  ${comment ? "justify-between" : "justify-end mr-10"}`}>
      {/* LIKE */}
       <form action={likeAction} className="flex gap-1 group">
        <button className="" type="submit">
          <Heart size={27} className={`text-foreground cursor-pointer hover:text-red-500 ${optimisticCount.isLiked ? "text-red-500" : ""}`} />
        </button>
        <span className="text-foreground/70 ml-2 self-center">{optimisticCount.likes}</span>
       </form>
      {/* REPOST */}
       <form action={repostAction} className="flex gap-1 group ">
        <button className="" type="submit">
          <Repeat2 size={27} className={`text-foreground cursor-pointer hover:text-green-500 ${optimisticCount.isReposted ? "text-green-500" : ""}`} />
        </button>
        <span className="text-foreground/70 ml-2 self-center">{optimisticCount.rePosts}</span>
       </form>
      {/* COMMENT */}
       <div className="flex gap-1 group">
        <MessageCircle size={24} className="text-foreground cursor-pointer hover:text-blue-500" />
        <span className="text-foreground/70 ml-2 self-center">{comments}</span>
       </div>
      {/* SAVE */}
       <form action={saveAction} className="flex gap-1 group">
        <button className="" type="submit">
          <Bookmark
            size={27}
            className={`cursor-pointer ${
              optimisticCount.isSaved
                ? "text-blue-500 fill-blue-500"
                : "text-foreground"
            }`}
          />
        </button>
       </form>
     </div>
  )
}

export default PostInteractions