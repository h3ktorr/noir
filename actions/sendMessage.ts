"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

type MediaType = "IMAGE" | "VIDEO";

export async function sendMessage(
  conversationId: string,
  content: string,
  mediaUrl?: string,
  mediaType?: MediaType,
) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedContent = content.trim();
  const trimmedMediaUrl = mediaUrl?.trim() || "";

  if (!conversationId || (!trimmedContent && !trimmedMediaUrl)) {
    return { success: false, error: "Message cannot be empty" };
  }

  if (trimmedMediaUrl) {
    try {
      const mediaUrlObject = new URL(trimmedMediaUrl);
      const imageKitUrl = new URL(
        process.env.NEXT_PUBLIC_URL_ENDPOINT as string,
      );

      const isValidImageExtension = /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(
        mediaUrlObject.pathname,
      );

      const isValidVideoExtension = /\.(mp4|webm|mov)$/i.test(
        mediaUrlObject.pathname,
      );

      const isValidMediaType =
        (mediaType === "IMAGE" && isValidImageExtension) ||
        (mediaType === "VIDEO" && isValidVideoExtension);

      if (
        mediaUrlObject.protocol !== "https:" ||
        mediaUrlObject.origin !== imageKitUrl.origin ||
        trimmedMediaUrl.length > 1000 ||
        !isValidMediaType
      ) {
        return {
          success: false,
          error: "Invalid media URL or media type",
        };
      }
    } catch {
      return {
        success: false,
        error: "Invalid media URL",
      };
    }
  }

  if (trimmedMediaUrl && !mediaType) {
    return {
      success: false,
      error: "Media type is required",
    };
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
      content: trimmedContent || null,
      type: trimmedMediaUrl ? mediaType! : "TEXT",
      mediaUrl: trimmedMediaUrl || null,
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
