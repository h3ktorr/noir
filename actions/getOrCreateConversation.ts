"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function getOrCreateConversation(targetUserId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!targetUserId || targetUserId === userId) {
    return { success: false, error: "Invalid recipient" };
  }

  // Confirm the recipient exists.
  const recipient = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!recipient) {
    return { success: false, error: "User not found" };
  }

  // Prevent conversations between users who have blocked each other.
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
    select: { id: true },
  });

  if (block) {
    return { success: false, error: "Messaging is unavailable" };
  }

  // The same two users always produce the same key.
  const directKey = [userId, targetUserId].sort().join(":");

  // Check whether this conversation already exists.
  const existingConversation = await prisma.conversation.findUnique({
    where: { directKey },
    select: {
      id: true,
      participants: {
        where: { userId },
        select: { id: true, archivedAt: true },
      },
    },
  });

  if (existingConversation) {
    // Restore it to the inbox if the current user archived it.
    if (existingConversation.participants[0]?.archivedAt) {
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: existingConversation.id,
          userId,
        },
        data: { archivedAt: null },
      });
    }

    return {
      success: true,
      conversationId: existingConversation.id,
    };
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        directKey,
        createdById: userId,
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      select: { id: true },
    });

    return {
      success: true,
      conversationId: conversation.id,
    };
  } catch (error) {
    // Another request may have created the same conversation
    // at the same time. Reuse it instead of creating a duplicate.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const conversation = await prisma.conversation.findUnique({
        where: { directKey },
        select: { id: true },
      });

      if (conversation) {
        return {
          success: true,
          conversationId: conversation.id,
        };
      }
    }

    throw error;
  }
}
