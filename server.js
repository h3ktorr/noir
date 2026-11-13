import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3100;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

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
          process.env.CLIENT_URL,
        ].filter(Boolean),
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
