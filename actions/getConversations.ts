"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getConversations() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: {
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
        take: 1,
        select: {
          id: true,
          content: true,
          type: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    isGroup: conversation.isGroup,
    name: conversation.name,
    img: conversation.img,
    updatedAt: conversation.updatedAt,

    participants: conversation.participants
      .filter((participant) => participant.userId !== userId)
      .map((participant) => participant.user),

    lastMessage: conversation.messages[0] ?? null,
  }));
}
