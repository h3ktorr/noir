"use client";

import { followUser } from "@/action";
import { useOptimistic, useState } from "react";

const FollowButton = ({userId, isFollowed}: {userId: string, isFollowed: boolean}) => {

  const [state, setState] = useState(isFollowed);

  const followAction = async ()=> {
    switchOptimisticFollow("");
    await followUser(userId);
    setState((prev)=> !prev)
  }

  const [optimisticFollow, switchOptimisticFollow] = useOptimistic(state, (prev)=>!prev)

  return (
    <form action={followAction}>
      <button className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-red-600 transition">{optimisticFollow ? "Unfollow" : "Follow"}</button>
    </form>
  )
}

export default FollowButton