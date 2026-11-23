
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

function getStoryThumbnailUrl(mediaUrl: string, mediaType: string) {
  const endpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT?.replace(/\/$/, "");
  const path = mediaUrl.replace(/^\/+/, "");

  const videoUrl = `${endpoint}/${path}`;

  if (mediaType === "VIDEO") {
    return `${videoUrl}/ik-thumbnail.jpg?tr=so-1,w-400,h-600`;
  }

  return videoUrl;
}

export default function StoriesClient({ users }: StoriesClientProps) {
  const [activeUserIndex, setActiveUserIndex] = useState<number | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [viewerUsers, setViewerUsers] = useState<StoriesData | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<number>>(
    () => new Set(),
  );

  const sortedUsers = [...users].sort((a, b) => {
    const aHasUnviewed = a.stories.some(
      (story) =>
        story.views.length === 0 && !viewedStoryIds.has(story.id),
    );

    const bHasUnviewed = b.stories.some(
      (story) =>
        story.views.length === 0 && !viewedStoryIds.has(story.id),
    );

    if (aHasUnviewed !== bHasUnviewed) {
      return aHasUnviewed ? -1 : 1;
    }

    return 0;
  });

  const imageKitURL = process.env.NEXT_PUBLIC_URL_ENDPOINT;

  const handleStoryViewed = (storyId: number) => {
    setViewedStoryIds((previous) => {
      const updated = new Set(previous);
      updated.add(storyId);
      return updated;
    });
  };

  const handleOpenStory = (userIndex: number) => {
    const profile = sortedUsers[userIndex];

    const firstUnviewedIndex = profile.stories.findIndex(
      (story) =>
        story.views.length === 0 && !viewedStoryIds.has(story.id),
    );

    setActiveStoryIndex(firstUnviewedIndex === -1 ? 0 : firstUnviewedIndex);
    setViewerUsers(sortedUsers);
    setActiveUserIndex(userIndex);
  };

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

        {sortedUsers.map((profile, index) => {
          const latestStory = profile.stories[profile.stories.length - 1];

          if (!latestStory) return null;

          const hasUnviewedStories = profile.stories.some(
            (story) =>
              story.views.length === 0 && !viewedStoryIds.has(story.id),
          );

          return (
            <div
              key={profile.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenStory(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenStory(index);
                }
              }}
              aria-label={`View ${profile.displayName || profile.username}'s stories`}
              className="w-36 md:min-w-52 h-50 md:h-64 shrink-0 rounded-2xl p-1 shadow-md relative overflow-hidden cursor-pointer"
            >
              <img
                src={getStoryThumbnailUrl(
                  latestStory.mediaUrl,
                  latestStory.mediaType,
                )}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 pointer-events-none ${
                  hasUnviewedStories
                    ? "bg-linear-to-t from-black/70 via-black/30 to-transparent"
                    : "bg-black/45"
                }`}
              />
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

      {activeUserIndex !== null && viewerUsers && (
        <StoryViewer
          users={viewerUsers}
          initialUserIndex={activeUserIndex}
          initialStoryIndex={activeStoryIndex}
          onClose={() => {
            setActiveUserIndex(null);
            setViewerUsers(null);
          }}
          onStoryViewed={handleStoryViewed}
        />
      )}
      {createStoryOpen && (
        <CreateStory onClose={() => setCreateStoryOpen(false)} />
      )}
    </>
  );
}
