"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/socket";

export default function InboxRealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const handleInboxUpdate = () => {
      router.refresh();
    };

    socket.on("inbox:update", handleInboxUpdate);

    return () => {
      socket.off("inbox:update", handleInboxUpdate);
    };
  }, [router]);

  return null;
}