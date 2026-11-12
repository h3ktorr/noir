import "server-only";
import type { Server } from "socket.io";

declare global {
  var io: Server | undefined;
}

export const getIO = () => global.io;
