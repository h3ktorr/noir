
"use client";

import { useState } from "react";
import Link from "next/link";
import ImageComp from "./ImageComp";
import StoryViewer from "./StoryViewer";
import { Plus, ShieldCheck } from "lucide-react";
import type { getStories } from "@/actions/getStories";
import CreateStory from "./CreateStory";

type StoriesData = Awaited<ReturnType<typeof getStories>>;

type StoriesClientProps = {
  users: StoriesData;
};

export default function StoriesClient({ users }: StoriesClientProps) {
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);

  const imageKitURL = process.env.NEXT_PUBLIC_URL_ENDPOINT;

  return (
    <>
      <div className="w-screen md:w-[calc(100vw-96px)] flex gap-4 overflow-x-auto overflow-y-hidden p-4 no-scrollbar border-b pb-6">
        <button
          type="button"
          onClick={() => setCreateStoryOpen(true)}
          className="w-36 md:min-w-52 h-50 md:h-64 shrink-0 rounded-2xl border flex flex-col items-center justify-center gap-4"
        >
          <Plus size={40} className="text-foreground" />
          <p className="text-foreground text-[1.15rem] md:text-2xl">
            Create Story
          </p>
        </button>

        {users.map((profile, index) => {
          const latestStory = profile.stories[profile.stories.length - 1];

          if (!latestStory) return null;

          return (
            <div
              key={profile.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveUserIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveUserIndex(index);
                }
              }}
              aria-label={`View ${profile.displayName || profile.username}'s stories`}
              className="w-36 md:min-w-52 h-50 md:h-64 shrink-0 rounded-2xl p-1 shadow-md relative overflow-hidden cursor-pointer"
              style={{
                backgroundImage: `url(${imageKitURL}/${latestStory.mediaUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

              <div className="relative p-3 md:p-5 flex flex-col justify-between h-full text-white pointer-events-none">
                <Link
                  href={`/${profile.username}`}
                  onClick={(event) => event.stopPropagation()}
                  className="w-fit pointer-events-auto"
                  aria-label={`Visit ${profile.username}'s profile`}
                >
                  <ImageComp
                    src={profile.img || "/default-avatar.png"}
                    alt={`${profile.username}'s profile picture`}
                    w={65}
                    h={65}
                    className="rounded-full border-2 border-white object-cover"
                  />
                </Link>

                <Link
                  href={`/${profile.username}`}
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center gap-1 text-[1.05rem] md:text-xl font-medium pointer-events-auto"
                >
                  <span className="truncate">
                    {profile.displayName || profile.username}
                  </span>

                  {profile.isOfficial && (
                    <ShieldCheck size={17} className="shrink-0" />
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {activeUserIndex !== null && (
        <StoryViewer
          users={users}
          initialUserIndex={activeUserIndex}
          onClose={() => setActiveUserIndex(null)}
        />
      )}
      {createStoryOpen && (
        <CreateStory onClose={() => setCreateStoryOpen(false)} />
      )}
    </>
  );
}
