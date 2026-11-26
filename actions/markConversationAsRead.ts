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

  await prisma.conversationParticipant.update({
    where: {
      id: participant.id,
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  // Notify this user's connected devices that their unread count changed.
  getIO()?.to(`user:${userId}`).emit("inbox:update", {
    conversationId,
  });

  return { success: true };
}
