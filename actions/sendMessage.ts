"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function sendMessage(conversationId: string, content: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedContent = content.trim();

  if (!conversationId || !trimmedContent) {
    return { success: false, error: "Message cannot be empty" };
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: {
          userId,
          archivedAt: null,
        },
      },
    },
    include: {
      participants: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!conversation) {
    return { success: false, error: "Conversation not found" };
  }

  const otherParticipantIds = conversation.participants
    .map((participant) => participant.userId)
    .filter((participantId) => participantId !== userId);

  const block = await prisma.block.findFirst({
    where: {
      OR: otherParticipantIds.flatMap((participantId) => [
        { blockerId: userId, blockedId: participantId },
        { blockerId: participantId, blockedId: userId },
      ]),
    },
    select: {
      id: true,
    },
  });

  if (block) {
    return {
      success: false,
      error: "Messaging is unavailable",
    };
  }

  const message = await prisma.message.create({
    data: {
      content: trimmedContent,
      type: "TEXT",
      conversationId,
      senderId: userId,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          img: true,
        },
      },
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt: new Date(),
    },
  });

  const io = getIO();

  io?.to(`conversation:${conversationId}`).emit("message:new", message);

  conversation.participants.forEach((participant) => {
    io?.to(`user:${participant.userId}`).emit("inbox:update", {
      conversationId,
    });
  });

  return {
    success: true,
    message,
  };
}
