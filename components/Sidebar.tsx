
"use client";

import { AppContext } from "@/context/AppContext";
import { useContext, useEffect, useState } from "react";
import { House, Mail, Bell, User, SquarePen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { socket } from "@/socket";

const Sidebar = () => {
  const { openCreatePost } = useContext(AppContext)!;
  const pathname = usePathname();

  const { user, isLoaded } = useUser();
  const username = user?.username;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Fetch the existing unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread");

        if (!response.ok) return;

        const data = await response.json();
        setUnreadCount(data.count);
      } catch (error) {
        console.error("Failed to fetch unread notifications:", error);
      }
    };

    fetchUnreadCount();

    // Listen for new real-time notifications
    const handleNotification = (notification: {
      id: string;
      read: boolean;
    }) => {
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Listen when a notification is marked as read
    const handleNotificationRead = () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    socket.on("getNotification", handleNotification);

    window.addEventListener(
      "notificationRead",
      handleNotificationRead,
    );

    return () => {
      socket.off("getNotification", handleNotification);

      window.removeEventListener(
        "notificationRead",
        handleNotificationRead,
      );
    };
  }, [user, isLoaded]);

  return (
    <aside
      className="
        fixed z-50 bg-background border-foreground text-foreground
        bottom-0 left-0 w-full h-16
        flex flex-row items-center justify-around
        border-t
        md:top-0 md:left-0 md:bottom-auto
        md:w-24 md:h-screen
        md:flex-col md:justify-center
        md:gap-12
        md:border-t-0 md:border-r
      "
    >
      <Link href="/">
        <House
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname === "/" ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/messages">
        <Mail
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname.startsWith("/messages") ? "currentColor" : "none"}
        />
      </Link>

      <Link href="/notifications" className="relative">
        <Bell
          size={32}
          className="md:w-11.25 md:h-11.25"
          fill={pathname.startsWith("/notifications") ? "currentColor" : "none"}
        />

        {unreadCount > 0 && (
          <span className="
            absolute -top-2 -right-2
            flex h-5 min-w-5 items-center justify-center
            rounded-full bg-red-500 px-1
            text-[10px] font-bold text-white
          ">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {isLoaded && username && (
        <Link href={`/${username}`}>
          <User
            size={32}
            className="md:w-11.25 md:h-11.25"
            fill={pathname.startsWith(`/${username}`) ? "currentColor" : "none"}
          />
        </Link>
      )}

      <button
        onClick={openCreatePost}
        aria-label="Create post"
        className="text-foreground hover:cursor-pointer"
      >
        <SquarePen size={32} className="md:w-11.25 md:h-11.25" />
      </button>
    </aside>
  );
};

export default Sidebar;
