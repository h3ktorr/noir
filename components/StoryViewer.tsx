
"use client";

import { recordStoryView } from "@/actions/recordStoryView";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, Users } from "lucide-react";
import type { getStories } from "@/actions/getStories";
import { getStoryViewers } from "@/actions/getStoryViewers";
import ImageComp from "./ImageComp";

type StoriesData = Awaited<ReturnType<typeof getStories>>;

type StoryViewerProps = {
  users: StoriesData;
  initialUserIndex: number;
  onClose: () => void;
};

const IMAGE_DURATION = 5000;

function getMediaUrl(path: string) {
  if (path.startsWith("http")) return path;

  const endpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT?.replace(/\/$/, "");
  return `${endpoint}/${path.replace(/^\//, "")}`;
}

export default function StoryViewer({
  users,
  initialUserIndex,
  onClose,
}: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<
    Awaited<ReturnType<typeof getStoryViewers>>["viewers"]
  >([]);
  const [totalViews, setTotalViews] = useState(0);
  const [isStoryOwner, setIsStoryOwner] = useState(false);

  const currentUser = users[userIndex];
  const currentStory = currentUser?.stories[storyIndex];

  const elapsedRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Record a view whenever a story becomes active.
  useEffect(() => {
   if (!currentStory) return;

   let cancelled = false;

   async function loadStoryViews() {
     try {
       await recordStoryView(currentStory!.id);

       const result = await getStoryViewers(currentStory!.id);

       if (cancelled) return;

       setIsStoryOwner(result.success);

       if (result.success) {
         setViewers(result.viewers);
         setTotalViews(result.totalViews);
       } else {
         setViewers([]);
         setTotalViews(0);
       }
     } catch (error) {
       console.error("Failed to load story views:", error);
     }
   }

   setViewersOpen(false);
   setIsStoryOwner(false);
   setViewers([]);
   setTotalViews(0);

   loadStoryViews();

   return () => {
     cancelled = true;
   };
 }, [currentStory?.id]);

  const nextStory = useCallback(() => {
    if (!currentUser) return;

    if (storyIndex < currentUser.stories.length - 1) {
      setStoryIndex((index) => index + 1);
      return;
    }

    if (userIndex < users.length - 1) {
      setUserIndex((index) => index + 1);
      setStoryIndex(0);
      return;
    }

    onClose();
  }, [currentUser, storyIndex, userIndex, users.length, onClose]);

  const previousStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((index) => index - 1);
      return;
    }

    if (userIndex > 0) {
      const previousUser = users[userIndex - 1];

      setUserIndex((index) => index - 1);
      setStoryIndex(previousUser.stories.length - 1);
    }
  }, [storyIndex, userIndex, users]);

  // Automatically advance image stories after five seconds.
  useEffect(() => {
    if (
      !currentStory ||
      currentStory.mediaType !== "IMAGE" ||
      viewersOpen
    ) {
      return;
    }

    const interval = setInterval(() => {
      elapsedRef.current += 50;

      setProgress(
        Math.min((elapsedRef.current / IMAGE_DURATION) * 100, 100),
      );

      if (elapsedRef.current >= IMAGE_DURATION) {
        clearInterval(interval);
        nextStory();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentStory?.id, currentStory?.mediaType, viewersOpen, nextStory]);

  // Reset progress when changing stories.
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [userIndex, storyIndex]);

  // Pause video while the viewers sheet is open.
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (viewersOpen) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error("Video playback failed:", error);
      });
    }
  }, [viewersOpen, currentStory?.id]);

  // Allow Escape and arrow keys to control the viewer.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") nextStory();
      if (event.key === "ArrowLeft") previousStory();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, nextStory, previousStory]);

  if (!currentUser || !currentStory) return null;

  const mediaUrl = getMediaUrl(currentStory.mediaUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center">
      {/* Story media */}
      {currentStory.mediaType === "VIDEO" ? (
        <video
          ref={videoRef}
          key={currentStory.id}
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          onEnded={nextStory}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;

            if (video.duration && Number.isFinite(video.duration)) {
              setProgress((video.currentTime / video.duration) * 100);
            }
          }}
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <img
          key={currentStory.id}
          src={mediaUrl}
          alt={`Story by ${currentUser.username}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Tap zones */}
      <button
        type="button"
        aria-label="Previous story"
        onClick={previousStory}
        className="absolute left-0 top-20 bottom-0 w-1/2 z-10"
      />

      <button
        type="button"
        aria-label="Next story"
        onClick={nextStory}
        className="absolute right-0 top-20 bottom-0 w-1/2 z-10"
      />

      {/* Header and progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-linear-to-b from-black/70 to-transparent">
        <div className="flex gap-1 mb-4">
          {currentUser.stories.map((story, index) => (
            <div
              key={story.id}
              className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden"
            >
              <div
                className="h-full bg-white"
                style={{
                  width:
                    index < storyIndex
                      ? "100%"
                      : index === storyIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/${currentUser.username}`}
            onClick={onClose}
            className="font-semibold"
          >
            {currentUser.displayName || currentUser.username}
            {currentUser.isOfficial && " ✓"}
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close stories"
            className="p-2"
          >
            <X size={26} />
          </button>
        </div>
      </div>
      {/* Story viewers button - visible only to the owner */}
{isStoryOwner && (
  <button
    type="button"
    onClick={() => setViewersOpen(true)}
    className="absolute bottom-6 left-5 z-20 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur"
  >
    <Users size={18} />
    <span>{totalViews} views</span>
  </button>
)}

{/* Viewers bottom sheet */}
{viewersOpen && isStoryOwner && (
  <div
    className="absolute inset-0 z-30 flex items-end justify-center bg-black/60"
    onClick={() => setViewersOpen(false)}
  >
    <div
      className="w-full max-w-lg rounded-t-2xl bg-background text-foreground p-5 max-h-[65vh] overflow-y-auto"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold">Story viewers</h2>
          <p className="text-sm text-muted-foreground">
            {totalViews} {totalViews === 1 ? "view" : "views"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewersOpen(false)}
          aria-label="Close viewers"
          className="p-2"
        >
          <X size={22} />
        </button>
      </div>

      {viewers.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">
          No viewers yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {viewers.map((view) => (
            <Link
              key={view.id}
              href={`/${view.viewer.username}`}
              onClick={onClose}
              className="flex items-center gap-3"
            >
              <ImageComp
                src={view.viewer.img || "/default-avatar.png"}
                alt={`${view.viewer.username}'s profile picture`}
                w={44}
                h={44}
                className="rounded-full object-cover"
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {view.viewer.displayName || view.viewer.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{view.viewer.username}
                </p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(view.viewedAt).toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
}
