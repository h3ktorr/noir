
"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "react-infinite-scroll-component";
import ImageComp from "@/components/ImageComp";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import { X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type FollowUser = {
  id: string;
  username: string;
  displayName: string | null;
  img: string | null;
  isFollowed: boolean;
};

type FollowResponse = {
  users: FollowUser[];
  nextCursor: number | null;
  hasMore: boolean;
};

const FollowList = ({
  userId,
  initialType,
  onClose,
}: {
  userId: string;
  initialType: "followers" | "following";
  onClose: () => void;
}) => {

  const { user: currentUser } = useUser();
  const [type, setType] = useState<"followers" | "following">(initialType);

  const {
    data,
    error,
    status,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FollowResponse>({
    queryKey: ["follow-list", userId, type],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        type,
        cursor: String(pageParam),
      });

      const res = await fetch(
        `/api/users/${encodeURIComponent(userId)}/follow?${params}`
      );

      if (!res.ok) {
        throw new Error("Failed to load users");
      }

      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor ?? undefined,
  });

  const users = data?.pages.flatMap((page) => page.users) ?? [];

  // Close the modal when Escape is pressed.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-background shadow-xl flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold">
            {type === "followers" ? "Followers" : "Following"}
          </h2>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-foreground/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setType("followers")}
            className={`flex-1 py-3 text-sm font-medium ${
              type === "followers"
                ? "border-b-2 border-foreground"
                : "text-foreground/60"
            }`}
          >
            Followers
          </button>

          <button
            onClick={() => setType("following")}
            className={`flex-1 py-3 text-sm font-medium ${
              type === "following"
                ? "border-b-2 border-foreground"
                : "text-foreground/60"
            }`}
          >
            Following
          </button>
        </div>

        {/* USER LIST */}
        <div
          id="follow-list-scroll"
          className="overflow-y-auto flex-1 min-h-0"
        >
          {status === "pending" && (
            <p className="text-center py-10 text-foreground/60">
              Loading users...
            </p>
          )}

          {status === "error" && (
            <p className="text-center py-10 text-red-500">
              {error.message}
            </p>
          )}

          {status === "success" && users.length === 0 && (
            <p className="text-center py-10 text-foreground/60">
              {type === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </p>
          )}

          {users.length > 0 && (
            <InfiniteScroll
              dataLength={users.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={
                <p className="text-center py-4 text-sm text-foreground/60">
                  Loading more users...
                </p>
              }
              scrollableTarget="follow-list-scroll"
              endMessage={
                <p className="text-center py-4 text-xs text-foreground/50">
                  You've reached the end.
                </p>
              }
            >
              {users.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-300/50"
                >
                  <Link
                    href={`/${person.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <ImageComp
                      src={person.img || "general/noAvatar.png"}
                      alt={person.displayName || person.username}
                      w={48}
                      h={48}
                      className="rounded-full object-cover"
                    />

                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {person.displayName || person.username}
                      </p>

                      <p className="text-sm text-foreground/60 truncate">
                        @{person.username}
                      </p>
                    </div>
                  </Link>

                  {person.id !== currentUser?.id && (
                   <div className="shrink-0">
                     <FollowButton
                       userId={person.id}
                       isFollowed={person.isFollowed}
                     />
                   </div>
                 )}
                </div>
              ))}
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowList;
