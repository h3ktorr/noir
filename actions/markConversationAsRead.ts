"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function markConversationAsRead(conversationId: string) {
  const { userId } = await auth();

  if (!userId || !conversationId) {
    return { success: false };
  }

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
    return { success: false };
  }

  const lastReadAt = new Date();

  await prisma.conversationParticipant.update({
    where: {
      id: participant.id,
    },
    data: {
      lastReadAt,
    },
  });

  const io = getIO();

  // Notify everyone in this conversation that this user
  // has read the messages up to this timestamp.
  io?.to(`conversation:${conversationId}`).emit("messages:read", {
    conversationId,
    userId,
    lastReadAt: lastReadAt.toISOString(),
  });

  // Notify this user's connected devices that their unread count changed.
  io?.to(`user:${userId}`).emit("inbox:update", {
    conversationId,
  });

  return { success: true };
}
