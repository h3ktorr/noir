import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3300;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const { default: prisma } = await import("@/lib/prisma");

  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3300" : process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // Track every active socket connection for each user.
  const onlineUsers = new Map<string, Set<string>>();

  // Find users who share active conversations with a user.
  const getConversationPeerIds = async (userId: string) => {
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        archivedAt: null,
      },
      select: {
        conversation: {
          select: {
            participants: {
              where: {
                archivedAt: null,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        participations.flatMap((participation) =>
          participation.conversation.participants
            .map((participant) => participant.userId)
            .filter((peerId) => peerId !== userId),
        ),
      ),
    ];
  };

  // Notify conversation peers about a user's presence.
  const broadcastPresence = async (
    userId: string,
    isOnline: boolean,
    lastSeenAt: Date | null = null,
  ) => {
    try {
      const peerIds = await getConversationPeerIds(userId);

      peerIds.forEach((peerId) => {
        io.to(`user:${peerId}`).emit("presence:update", {
          userId,
          isOnline,
          lastSeenAt: lastSeenAt?.toISOString() ?? null,
        });
      });
    } catch (error) {
      console.error("Presence broadcast failed:", error);
    }
  };

  // Authenticate every Socket.IO connection using a Clerk session token.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const secretKey = process.env.CLERK_SECRET_KEY;

      if (!token || typeof token !== "string") {
        return next(new Error("Authentication required"));
      }

      if (!secretKey) {
        return next(new Error("Clerk secret key is missing"));
      }

      const verifiedToken = await verifyToken(token, {
        secretKey,
        authorizedParties: [
          "http://localhost:3300",
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
        ],
      });

      if (!verifiedToken.sub) {
        return next(new Error("Invalid user identity"));
      }

      socket.data.userId = verifiedToken.sub;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Unauthorized"));
    }
  });

  global.io = io;

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    const typingConversations = new Set<string>();

    // Register this connection.
    const userSockets = onlineUsers.get(userId) ?? new Set<string>();
    const wasOffline = userSockets.size === 0;

    userSockets.add(socket.id);
    onlineUsers.set(userId, userSockets);

    // Automatically join the authenticated user's private room.
    socket.join(`user:${userId}`);

    console.log("Authenticated user connected:", userId);
    console.log(`Joined room: user:${userId}`);

    // Notify conversation peers only when the user transitions online.
    if (wasOffline) {
      void broadcastPresence(userId, true);
    }

    const stopTyping = (conversationId: string) => {
      if (!typingConversations.has(conversationId)) return;

      typingConversations.delete(conversationId);

      socket.to(`conversation:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    };

    // Allow users to join only conversations they actively participate in.
    socket.on(
      "conversation:join",
      async (
        conversationId: unknown,
        acknowledge?: (result: { success: boolean; error?: string }) => void,
      ) => {
        const respond = (result: { success: boolean; error?: string }) => {
          if (typeof acknowledge === "function") {
            acknowledge(result);
          }
        };

        if (typeof conversationId !== "string" || !conversationId.trim()) {
          return respond({
            success: false,
            error: "Invalid conversation ID",
          });
        }

        try {
          const participant = await prisma.conversationParticipant.findFirst({
            where: {
              conversationId,
              userId,
              archivedAt: null,
            },
            select: {
              id: true,
            },
          });

          if (!participant) {
            return respond({
              success: false,
              error: "Conversation not found or access denied",
            });
          }

          await socket.join(`conversation:${conversationId}`);

          // Send the current presence of conversation participants
          // to this socket when it joins.
          const participants = await prisma.conversationParticipant.findMany({
            where: {
              conversationId,
              archivedAt: null,
            },
            select: {
              userId: true,
              user: {
                select: {
                  lastSeenAt: true,
                },
              },
            },
          });

          socket.emit("presence:initial", {
            conversationId,
            users: participants.map((participant) => ({
              userId: participant.userId,
              isOnline: onlineUsers.has(participant.userId),
              lastSeenAt: participant.user.lastSeenAt,
            })),
          });

          console.log(`User ${userId} joined conversation:${conversationId}`);

          respond({ success: true });
        } catch (error) {
          console.error("Conversation room authorization failed:", error);

          respond({
            success: false,
            error: "Unable to join conversation",
          });
        }
      },
    );

    // Notify other participants when this user starts typing.
    socket.on("typing:start", (conversationId: unknown) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) {
        return;
      }

      const room = `conversation:${conversationId}`;

      if (!socket.rooms.has(room)) return;

      if (typingConversations.has(conversationId)) return;

      typingConversations.add(conversationId);

      socket.to(room).emit("typing:start", {
        conversationId,
        userId,
      });
    });

    // Notify other participants when this user stops typing.
    socket.on("typing:stop", (conversationId: unknown) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) {
        return;
      }

      stopTyping(conversationId);
    });

    socket.on("conversation:leave", (conversationId: unknown) => {
      if (typeof conversationId !== "string" || !conversationId.trim()) {
        return;
      }

      stopTyping(conversationId);

      socket.leave(`conversation:${conversationId}`);

      console.log(`User ${userId} left conversation:${conversationId}`);
    });

    // Clear typing status in every conversation if the socket disconnects.
    socket.on("disconnecting", () => {
      typingConversations.forEach((conversationId) => {
        socket.to(`conversation:${conversationId}`).emit("typing:stop", {
          conversationId,
          userId,
        });
      });

      typingConversations.clear();
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", userId);

      const activeSockets = onlineUsers.get(userId);

      if (!activeSockets) return;

      activeSockets.delete(socket.id);

      // Other tabs or devices are still connected.
      if (activeSockets.size > 0) return;

      onlineUsers.delete(userId);

      try {
        const lastSeenAt = new Date();

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            lastSeenAt,
          },
        });

        // Broadcast the exact timestamp saved in the database.
        await broadcastPresence(userId, false, lastSeenAt);
      } catch (error) {
        console.error("Unable to update last seen:", error);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
