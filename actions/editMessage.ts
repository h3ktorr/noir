"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function editMessage(messageId: string, content: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!messageId?.trim()) {
    return { success: false, error: "Message not found" };
  }

  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    return { success: false, error: "Message cannot be empty" };
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: userId,
      type: "TEXT",
      deletedAt: null,
      conversation: {
        participants: {
          some: {
            userId,
            archivedAt: null,
          },
        },
      },
    },
    select: {
      id: true,
      conversationId: true,
      conversation: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    return {
      success: false,
      error: "Message not found or cannot be edited",
    };
  }

  const editedAt = new Date();

  const result = await prisma.message.updateMany({
    where: {
      id: messageId,
      senderId: userId,
      type: "TEXT",
      deletedAt: null,
    },
    data: {
      content: trimmedContent,
      editedAt,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Message could not be edited",
    };
  }

  const io = getIO();

  io?.to(`conversation:${message.conversationId}`).emit("message:edited", {
    conversationId: message.conversationId,
    messageId,
    content: trimmedContent,
    editedAt: editedAt.toISOString(),
  });

  message.conversation.participants.forEach((participant) => {
    io?.to(`user:${participant.userId}`).emit("inbox:update", {
      conversationId: message.conversationId,
    });
  });

  return {
    success: true,
    messageId,
    content: trimmedContent,
    editedAt: editedAt.toISOString(),
  };
}
