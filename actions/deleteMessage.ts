"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function deleteMessage(messageId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!messageId?.trim()) {
    return { success: false, error: "Message not found" };
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
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
      senderId: true,
      conversationId: true,
      deletedAt: true,
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
    return { success: false, error: "Message not found" };
  }

  if (message.senderId !== userId) {
    return {
      success: false,
      error: "You can only delete your own messages",
    };
  }

  if (message.deletedAt) {
    return {
      success: false,
      error: "Message has already been deleted",
    };
  }

  const deletedAt = new Date();

  const result = await prisma.message.updateMany({
    where: {
      id: messageId,
      deletedAt: null,
    },
    data: {
      deletedAt,
      content: "This message was deleted",
      mediaUrl: null,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "Message has already been deleted",
    };
  }

  const io = getIO();

  io?.to(`conversation:${message.conversationId}`).emit("message:deleted", {
    conversationId: message.conversationId,
    messageId,
    deletedAt: deletedAt.toISOString(),
  });

  message.conversation.participants.forEach((participant) => {
    io?.to(`user:${participant.userId}`).emit("inbox:update", {
      conversationId: message.conversationId,
    });
  });

  return {
    success: true,
    messageId,
    deletedAt: deletedAt.toISOString(),
  };
}
