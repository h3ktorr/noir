
"use client";

import { useState } from "react";
import FollowList from "@/components/FollowList";

const ProfileFollowStats = ({
  username,
  followersCount,
  followingCount,
}: {
  username: string;
  followersCount: number;
  followingCount: number;
}) => {
  const [activeList, setActiveList] = useState<
    "followers" | "following" | null
  >(null);

  return (
    <>
      <div className="flex gap-6 text-sm">
        <button
          type="button"
          onClick={() => setActiveList("followers")}
          className="flex items-center gap-1 hover:opacity-70 transition"
        >
          <span className="font-semibold">{followersCount}</span>
          <span className="text-foreground/60">Followers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveList("following")}
          className="flex items-center gap-1 hover:opacity-70 transition"
        >
          <span className="font-semibold">{followingCount}</span>
          <span className="text-foreground/60">Following</span>
        </button>
      </div>

      {activeList && (
        <FollowList
          userId={username}
          initialType={activeList}
          onClose={() => setActiveList(null)}
        />
      )}
    </>
  );
};

export default ProfileFollowStats;
