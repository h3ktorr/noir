import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3100;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  const { default: prisma } = await import("@/lib/prisma");
  const httpServer = createServer((req, res) => {
    handler(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? "http://localhost:3100" : process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  // Authenticate every Socket.IO connection using a Clerk session token
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
          "http://localhost:3100",
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
        ],
      });

      if (!verifiedToken.sub) {
        return next(new Error("Invalid user identity"));
      }

      // Store the verified Clerk user ID on the socket
      socket.data.userId = verifiedToken.sub;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Unauthorized"));
    }
  });

  global.io = io;

  io.on("connection", (socket) => {
    // This ID comes from the verified Clerk token
    const userId = socket.data.userId;

    // Automatically join the authenticated user's private room
    socket.join(`user:${userId}`);

    console.log("Authenticated user connected:", userId);
    console.log(`Joined room: user:${userId}`);

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

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
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
