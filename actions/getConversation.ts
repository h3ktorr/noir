"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getConversation(conversationId: string) {
  const { userId } = await auth();

  if (!userId || !conversationId) {
    return null;
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
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              img: true,
            },
          },
        },
      },
      messages: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
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
      },
    },
  });

  if (!conversation) {
    return null;
  }

  return {
    id: conversation.id,
    isGroup: conversation.isGroup,
    name: conversation.name,
    img: conversation.img,
    currentUserId: userId,

    participants: conversation.participants.map(
      (participant) => participant.user,
    ),

    messages: conversation.messages.reverse(),
  };
}
