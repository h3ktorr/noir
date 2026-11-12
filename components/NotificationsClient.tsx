"use client";

import ImageComp from "@/components/ImageComp";
import { socket } from "@/socket";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handleNotification = (notification: NotificationType) => {
      setNotifications((prev) => {
        // Prevent duplicate notifications
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <div className="mt-4 flex space-x-6 border-b border-gray-300 pb-2 font-semibold">
        <p className="cursor-pointer">All</p>
        <p className="cursor-pointer">Unread</p>
      </div>

      <div>
        {notifications.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            You don't have any notifications yet.
          </p>
        ) : (
          notifications.map((n) => (
            <div className="p-4" key={n.id}>
              <div className="flex items-center space-x-3">
                <ImageComp
                  src="general/noAvatar.png"
                  alt=""
                  w={40}
                  h={40}
                  className="rounded-full"
                />

                <div>
                  <p className="font-semibold">
                    {n.senderUsername}

                    <span className="ml-2 text-sm text-gray-400">
                      {n.type === "like"
                        ? "Liked your post"
                        : n.type === "rePost"
                          ? "re-posted your post"
                          : n.type === "comment"
                            ? "replied to your post"
                            : "followed you"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsClient;