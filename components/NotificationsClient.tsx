
"use client";

import ImageComp from "@/components/ImageComp";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/action";
import { socket } from "@/socket";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

type NotificationType = {
  id: string;
  senderUsername: string;
  senderImg: string | null;
  type: "like" | "comment" | "rePost" | "follow";
  link: string;
  read: boolean;
  createdAt: string;
};

const NotificationsClient = ({
  userId,
  initialNotifications,
  initialHasMore,
}: {
  userId: string;
  initialNotifications: NotificationType[];
  initialHasMore: boolean;
}) => {
  const [notifications, setNotifications] =
    useState<NotificationType[]>(initialNotifications);

  const [activeTab, setActiveTab] =
    useState<"all" | "unread">("all");

  const [cursor, setCursor] = useState<string | null>(
    initialNotifications.length > 0
      ? initialNotifications[initialNotifications.length - 1].id
      : null,
  );

  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  const loadingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Show all notifications or only unread ones
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  // Load older notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!cursor || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const response = await fetch(
        `/api/notifications?cursor=${encodeURIComponent(cursor)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load more notifications");
      }

      const data = await response.json();

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));

        const newNotifications = data.notifications.filter(
          (n: NotificationType) => !existingIds.has(n.id),
        );

        return [...prev, ...newNotifications];
      });

      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setLoadMoreError(true);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore]);

  // Automatically load more when reaching the bottom
  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreNotifications();
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasMore, loadMoreNotifications]);

  // Keep searching older pages when the Unread filter has no results
  useEffect(() => {
    if (
      activeTab === "unread" &&
      filteredNotifications.length === 0 &&
      hasMore &&
      !isLoadingMore
    ) {
      loadMoreNotifications();
    }
  }, [
    activeTab,
    filteredNotifications.length,
    hasMore,
    isLoadingMore,
    loadMoreNotifications,
  ]);

  // Listen for new real-time notifications
  useEffect(() => {
    const handleNotification = (notification: NotificationType) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notification.id)) {
          return prev;
        }

        return [notification, ...prev];
      });
    };

    socket.on("getNotification", handleNotification);

    return () => {
      socket.off("getNotification", handleNotification);
    };
  }, [userId]);

  // Mark notification as read and navigate
  const handleNotificationClick = async (
    notification: NotificationType,
  ) => {
    if (!notification.read) {
      const result = await markNotificationAsRead(notification.id);

      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );

        window.dispatchEvent(new Event("notificationRead"));
      }
    }

    router.push(notification.link);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const result = await markAllNotificationsAsRead();

      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true })),
        );

        window.dispatchEvent(new Event("notificationsRead"));
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <>
              <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                {unreadCount} unread
              </span>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="cursor-pointer text-sm font-semibold text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex space-x-6 border-b border-gray-300 pb-2 font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer ${
            activeTab === "all"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setActiveTab("unread")}
          className={`cursor-pointer ${
            activeTab === "unread"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification list */}
      <div>
        {filteredNotifications.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            {activeTab === "unread"
              ? "You're all caught up. No unread notifications."
              : "You don't have any notifications yet."}
          </p>
        ) : (
          filteredNotifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNotificationClick(n)}
              className={`flex w-full cursor-pointer items-center space-x-3 border-b border-gray-200 p-4 text-left transition hover:bg-foreground/5 ${
                !n.read ? "bg-blue-500/5" : ""
              }`}
            >
              <ImageComp
                src={n.senderImg || "general/noAvatar.png"}
                alt={`${n.senderUsername}'s profile picture`}
                w={40}
                h={40}
                className="rounded-full"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {n.senderUsername}

                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {n.type === "like"
                      ? "Liked your post"
                      : n.type === "rePost"
                        ? "re-posted your post"
                        : n.type === "comment"
                          ? "commented on your post"
                          : "followed you"}
                  </span>
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {!n.read && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center gap-3 py-6"
        >
          {isLoadingMore && (
            <p className="text-sm text-gray-500">
              Loading more notifications...
            </p>
          )}

          {loadMoreError && (
            <p className="text-sm text-red-500">
              Could not load more notifications.
            </p>
          )}

          {!isLoadingMore && (
            <button
              type="button"
              onClick={loadMoreNotifications}
              className="cursor-pointer text-sm font-semibold text-blue-500 hover:text-blue-600"
            >
              {loadMoreError ? "Try again" : "Load more"}
            </button>
          )}
        </div>
      )}

      {!hasMore && notifications.length > 0 && (
        <p className="py-6 text-center text-sm text-gray-500">
          You're all caught up.
        </p>
      )}
    </div>
  );
};

export default NotificationsClient;
