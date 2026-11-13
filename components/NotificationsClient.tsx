
"use client";

import ImageComp from "@/components/ImageComp";
import { markNotificationAsRead } from "@/action";
import { socket } from "@/socket";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationType = {
  id: string;
  senderUsername: string;
  type: "like" | "comment" | "rePost" | "follow";
  link: string;
  read: boolean;
  createdAt: string;
};

const NotificationsClient = ({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: NotificationType[];
}) => {
  const [notifications, setNotifications] =
    useState<NotificationType[]>(initialNotifications);

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const router = useRouter();

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Show all notifications or only unread ones
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

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
  const handleNotificationClick = async (notification: NotificationType) => {
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>

        {unreadCount > 0 && (
          <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
            {unreadCount} unread
          </span>
        )}
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
                src="general/noAvatar.png"
                alt=""
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
              </div>

              {!n.read && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsClient;
