
"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "@/socket";

const SocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      socket.emit("register", userId);
    };

    socket.on("connect", handleConnect);

    socket.connect();

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [userId, isLoaded]);

  return <>{children}</>;
};

export default SocketProvider;
