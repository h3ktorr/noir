
"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { socket } from "@/socket";

const SocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId, isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      socket.disconnect();
      return;
    }

    let cancelled = false;

    const handleConnect = () => {
      console.log("Authenticated socket connected:", socket.id);
    };

    const handleConnectError = (error: Error) => {
      console.error("Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    // Fetch a fresh Clerk token for each connection attempt,
    // including automatic reconnections.
    socket.auth = (callback) => {
      getToken()
        .then((token) => {
          callback({ token });
        })
        .catch((error) => {
          console.error("Unable to retrieve Clerk token:", error);
          callback({ token: null });
        });
    };

    if (!cancelled) {
      socket.connect();
    }

    return () => {
      cancelled = true;

      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, [userId, isLoaded, getToken]);

  return <>{children}</>;
};

export default SocketProvider;
